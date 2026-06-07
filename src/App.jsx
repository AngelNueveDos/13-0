import { useMemo, useState } from 'react'
import Header from './components/Header'
import HowToModal from './components/HowToModal'
import Pitch from './components/Pitch'
import DraftList from './components/DraftList'
import SimulationScreen from './components/SimulationScreen'
import { teams } from './data/teams'
import { FORMATIONS, FORMATION_NAMES, playerFitsRole } from './data/formations'
import { average } from './lib/util'
import { runTournament } from './lib/sim'

const DIFFICULTIES = [
  { key: 'Easy', rerolls: 3, sub: '3 re-rolls' },
  { key: 'Medium', rerolls: 1, sub: '1 re-roll' },
  { key: 'Hard', rerolls: 0, sub: 'no re-rolls' },
]
const FORMATS = [
  { key: 'group', label: 'Group Stage', sub: 'Classic · 4-team group, home & away' },
  { key: 'league', label: 'League Stage', sub: 'New · 36-team Swiss league phase' },
]

export default function App() {
  const [step, setStep] = useState('setup') // setup | draft | result
  const [formationKey, setFormationKey] = useState('4-3-3')
  const [difficulty, setDifficulty] = useState('Medium')
  const [format, setFormat] = useState('group')

  const [currentTeam, setCurrentTeam] = useState(null)
  const [rollPhase, setRollPhase] = useState('idle') // idle | rolling
  const [rerollsLeft, setRerollsLeft] = useState(0)
  const [assignments, setAssignments] = useState({}) // slotId -> player (with origin)
  const [armed, setArmed] = useState(null) // { player, source:'draft'|'pitch', fromSlotId? }
  const [result, setResult] = useState(null)
  const [simTeam, setSimTeam] = useState(null)
  const [howTo, setHowTo] = useState(false)

  const slots = FORMATIONS[formationKey]
  const placed = Object.values(assignments)
  const usedNames = useMemo(() => new Set(placed.map((p) => p.name)), [assignments])
  const count = placed.length
  const complete = count === 11
  const liveAvg = placed.length ? average(placed.map((p) => p.rating)) : 0

  const canPlace = useMemo(() => {
    return (player) => {
      if (usedNames.has(player.name)) return false
      return slots.some((s) => !assignments[s.id] && playerFitsRole(player, s.role))
    }
  }, [slots, assignments, usedNames])

  const canPlaceAny = currentTeam ? currentTeam.players.some((p) => canPlace(p)) : false

  const eligibleSlotIds = useMemo(() => {
    const set = new Set()
    if (!armed) return set
    const fromSlot = armed.fromSlotId ? slots.find((s) => s.id === armed.fromSlotId) : null
    for (const s of slots) {
      if (armed.fromSlotId && s.id === armed.fromSlotId) continue
      const occ = assignments[s.id]
      if (!occ) {
        if (playerFitsRole(armed.player, s.role)) set.add(s.id)
      } else if (armed.source === 'pitch' && fromSlot) {
        if (playerFitsRole(armed.player, s.role) && playerFitsRole(occ, fromSlot.role)) set.add(s.id)
      }
    }
    return set
  }, [armed, slots, assignments])

  // ── Drawing ──────────────────────────────────────────────────────────────────
  function drawClub() {
    setRollPhase('rolling')
    setArmed(null)
    setTimeout(() => {
      let next = teams[Math.floor(Math.random() * teams.length)]
      if (currentTeam && teams.length > 1) {
        let guard = 0
        while (next.club === currentTeam.club && next.edition === currentTeam.edition && guard++ < 20) {
          next = teams[Math.floor(Math.random() * teams.length)]
        }
      }
      setCurrentTeam(next)
      setRollPhase('idle')
    }, 800)
  }
  const roll = () => drawClub()
  function reroll() {
    if (rerollsLeft <= 0) return
    setRerollsLeft((n) => n - 1)
    drawClub()
  }

  function startDraft() {
    setStep('draft')
    setAssignments({})
    setArmed(null)
    setCurrentTeam(null)
    setRerollsLeft(DIFFICULTIES.find((d) => d.key === difficulty).rerolls)
  }

  function pickCandidate(player) {
    if (!canPlace(player)) return
    setArmed((cur) => (cur && cur.source === 'draft' && cur.player.name === player.name ? null : { player, source: 'draft' }))
  }

  function onSlotClick(slot) {
    const occupant = assignments[slot.id]
    if (armed && armed.source === 'pitch' && armed.fromSlotId === slot.id) {
      setArmed(null)
      return
    }
    if (armed && eligibleSlotIds.has(slot.id)) {
      const a = armed
      const wasDraft = a.source === 'draft'
      setAssignments((prev) => {
        const copy = { ...prev }
        if (a.source === 'pitch') {
          if (occupant) { copy[slot.id] = a.player; copy[a.fromSlotId] = occupant }
          else { delete copy[a.fromSlotId]; copy[slot.id] = a.player }
        } else {
          copy[slot.id] = { ...a.player, fromClub: currentTeam.club, fromEdition: currentTeam.edition }
        }
        return copy
      })
      setArmed(null)
      if (wasDraft) setCurrentTeam(null) // pick spent — user rolls for the next one
      return
    }
    if (occupant) setArmed({ player: occupant, source: 'pitch', fromSlotId: slot.id })
  }

  function simulate() {
    if (!complete) return
    const editions = [...new Set(placed.map((p) => p.fromEdition).filter(Boolean))]
    const userTeam = { club: 'Your XI', league: null, edition: editions.length === 1 ? editions[0] : 'Select XI', players: placed }
    setSimTeam({ club: userTeam.club, edition: userTeam.edition })
    setResult(runTournament(userTeam, placed, teams, { format }))
    setStep('result')
  }

  function playAgain() {
    setStep('setup')
    setFormationKey('4-3-3')
    setCurrentTeam(null)
    setRollPhase('idle')
    setAssignments({})
    setArmed(null)
    setResult(null)
    setSimTeam(null)
  }

  const hint = (() => {
    if (armed && armed.source === 'pitch') return `Repositioning ${armed.player.name} — tap a highlighted slot (a filled one swaps)`
    if (armed) return `Placing ${armed.player.name} — tap a highlighted position`
    if (complete) return 'Squad complete — tap any player to reposition, or simulate'
    if (rollPhase === 'rolling') return 'Drawing a club…'
    if (currentTeam && !canPlaceAny) return 'No one fits a free slot — redraw'
    if (currentTeam) return `Pick one player from ${currentTeam.club}`
    return 'Roll to draw a club for your next pick'
  })()

  return (
    <div className="min-h-screen">
      <Header onHowTo={() => setHowTo(true)} onReplay={playAgain} />
      <HowToModal open={howTo} onClose={() => setHowTo(false)} />

      {/* ── Step 1: setup ── */}
      {step === 'setup' && (
        <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
          <p className="eyebrow mb-2 animate-fadeUp">UEFA Champions League · 2010—2025</p>
          <h1 className="mb-3 animate-fadeUp font-display text-5xl leading-tight text-cream sm:text-6xl">Set your terms.</h1>
          <p className="mb-8 max-w-md animate-fadeUp text-xl text-bluegray">
            Lock a shape, a competition format and a difficulty. Then draft eleven
            players, each from a different random club.
          </p>

          <div className="panel mb-6 w-full max-w-2xl space-y-5 p-5 text-left">
            <div>
              <p className="eyebrow mb-2">Formation</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FORMATION_NAMES.map((key) => (
                  <button
                    key={key}
                    onClick={() => setFormationKey(key)}
                    className={[
                      'rounded-xl px-3 py-2.5 font-display text-base tracking-wide transition-all',
                      formationKey === key ? 'bg-gold text-navy-deep shadow-gold' : 'border border-white/10 text-bluegray hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold',
                    ].join(' ')}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2">Format</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className={[
                      'rounded-xl px-4 py-3 text-left transition-all',
                      format === f.key ? 'bg-gold text-navy-deep shadow-gold' : 'border border-white/10 hover:-translate-y-0.5 hover:border-gold/40',
                    ].join(' ')}
                  >
                    <p className={`font-display text-lg ${format === f.key ? 'text-navy-deep' : 'text-cream'}`}>{f.label}</p>
                    <p className={`text-sm ${format === f.key ? 'text-navy-deep/70' : 'text-bluegray'}`}>{f.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2">Difficulty Mode</p>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDifficulty(d.key)}
                    className={[
                      'rounded-xl px-3 py-3 transition-all',
                      difficulty === d.key ? 'bg-gold text-navy-deep shadow-gold' : 'border border-white/10 hover:-translate-y-0.5 hover:border-gold/40',
                    ].join(' ')}
                  >
                    <p className={`font-display text-lg ${difficulty === d.key ? 'text-navy-deep' : 'text-cream'}`}>{d.key}</p>
                    <p className={`text-xs uppercase tracking-wide ${difficulty === d.key ? 'text-navy-deep/70' : 'text-bluegray'}`}>{d.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={startDraft} className="btn-gold text-lg">Start the draft →</button>
        </main>
      )}

      {/* ── Step 2: draft ── */}
      {step === 'draft' && (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5">
          <div className="panel mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">{formationKey} · {FORMATS.find((f) => f.key === format).label} · {difficulty}</p>
              <h2 className="font-display text-3xl text-cream">
                {complete ? 'Squad complete' : currentTeam ? <>Drawn: <span className="text-gold">{currentTeam.club}</span></> : 'Roll your next pick'}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-center">
                <p className="font-display text-2xl text-gold">{count} / 11</p>
                <p className="text-xs uppercase tracking-wider text-bluegray">Drafted</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-cream">{liveAvg ? liveAvg.toFixed(1) : '—'}</p>
                <p className="text-xs uppercase tracking-wider text-bluegray">Avg rating</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-cream">{rerollsLeft}</p>
                <p className="text-xs uppercase tracking-wider text-bluegray">Re-rolls</p>
              </div>
              <button onClick={simulate} disabled={!complete} className="btn-gold">Simulate →</button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div>
              <Pitch
                slots={slots}
                assignments={assignments}
                eligibleSlotIds={eligibleSlotIds}
                activeSlotId={armed?.source === 'pitch' ? armed.fromSlotId : null}
                onSlotClick={onSlotClick}
              />
              <p className="mt-3 text-center font-display text-base italic text-bluegray/70">{hint}</p>
            </div>

            <div className="h-[28rem] lg:h-[42rem]">
              {complete ? (
                <div className="panel flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                  <p className="text-5xl">✓</p>
                  <p className="font-display text-2xl text-cream">Your eleven is set</p>
                  <p className="text-bluegray">Tap any player on the pitch to move them to another position they can play, or run the campaign.</p>
                  <button onClick={simulate} className="btn-gold mt-2">Simulate the campaign →</button>
                </div>
              ) : rollPhase === 'rolling' ? (
                <div className="panel flex h-full flex-col items-center justify-center gap-3 text-bluegray">
                  <span className="text-4xl animate-starSpin">🎲</span>
                  <p className="font-display text-lg">Drawing a club…</p>
                </div>
              ) : currentTeam ? (
                <div className="flex h-full flex-col gap-3">
                  <DraftList
                    club={currentTeam.club}
                    edition={currentTeam.edition}
                    players={currentTeam.players}
                    armedName={armed?.source === 'draft' ? armed.player.name : null}
                    canPlace={canPlace}
                    onPick={pickCandidate}
                  />
                  {!canPlaceAny ? (
                    <button onClick={roll} className="btn-ghost shrink-0">🎲 Redraw — no fit here (free)</button>
                  ) : (
                    <button onClick={reroll} disabled={rerollsLeft <= 0} className="btn-ghost shrink-0">
                      ↻ Re-roll this club {rerollsLeft > 0 ? `(${rerollsLeft} left)` : '(none left)'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="panel flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                  <p className="font-display text-2xl text-cream">{count === 0 ? 'Draw your first club' : `Pick ${count + 1} of 11`}</p>
                  <p className="text-bluegray">Roll the dice to be handed a random club, then take one player.</p>
                  <button onClick={roll} className="btn-gold mt-1 text-lg"><span>🎲</span> Roll</button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ── Step 3: result ── */}
      {step === 'result' && result && simTeam && (
        <SimulationScreen team={simTeam} result={result} onReplay={playAgain} onEditXI={() => setStep('draft')} />
      )}

      <footer className="border-t border-white/5 py-6 text-center">
        <p className="font-display text-sm tracking-wide text-bluegray/60">
          13—0 · draft eleven from random clubs · group or league phase, two-legged knockouts, a one-off final
        </p>
      </footer>
    </div>
  )
}
