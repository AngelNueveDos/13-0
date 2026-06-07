import { useMemo, useState } from 'react'
import Header from './components/Header'
import HowToModal from './components/HowToModal'
import Pitch from './components/Pitch'
import SquadList from './components/SquadList'
import SimulationScreen from './components/SimulationScreen'
import { teams } from './data/teams'
import { FORMATIONS, FORMATION_NAMES, playerFitsRole } from './data/formations'
import { average } from './lib/util'
import { runTournament } from './lib/sim'

export default function App() {
  const [step, setStep] = useState('build') // build | result
  const [team, setTeam] = useState(null)
  const [rollPhase, setRollPhase] = useState('idle') // idle | rolling

  const [formationKey, setFormationKey] = useState('4-3-3')
  const [assignments, setAssignments] = useState({}) // slotId -> player
  const [armed, setArmed] = useState(null) // player object being placed
  const [result, setResult] = useState(null)
  const [howTo, setHowTo] = useState(false)

  const slots = FORMATIONS[formationKey]
  const usedNames = useMemo(() => new Set(Object.values(assignments).map((p) => p.name)), [assignments])
  const selectedCount = Object.keys(assignments).length
  const liveAvg = useMemo(() => {
    const picked = Object.values(assignments)
    return picked.length ? average(picked.map((p) => p.rating)) : 0
  }, [assignments])

  // ── Roll ────────────────────────────────────────────────────────────────────
  function roll() {
    setRollPhase('rolling')
    setArmed(null)
    setAssignments({})
    setTimeout(() => {
      let next = teams[Math.floor(Math.random() * teams.length)]
      if (team && teams.length > 1) {
        while (next.club === team.club && next.edition === team.edition) {
          next = teams[Math.floor(Math.random() * teams.length)]
        }
      }
      setTeam(next)
      setRollPhase('idle')
    }, 1200)
  }

  // ── Formation ─────────────────────────────────────────────────────────────────
  function changeFormation(key) {
    const placed = Object.values(assignments)
    const next = {}
    const taken = new Set()
    for (const slot of FORMATIONS[key]) {
      const fit = placed.find((p) => !taken.has(p.name) && playerFitsRole(p, slot.role))
      if (fit) { next[slot.id] = fit; taken.add(fit.name) }
    }
    setFormationKey(key)
    setAssignments(next)
  }

  // ── Placement (player-first) ───────────────────────────────────────────────────
  function armPlayer(player) {
    setArmed((cur) => (cur && cur.name === player.name ? null : player))
  }

  function removePlayer(player) {
    setAssignments((prev) => {
      const copy = { ...prev }
      for (const id of Object.keys(copy)) if (copy[id].name === player.name) delete copy[id]
      return copy
    })
    setArmed((cur) => (cur && cur.name === player.name ? null : cur))
  }

  function onSlotClick(slot) {
    const occupant = assignments[slot.id]
    if (occupant) {
      // tap a filled token to clear it
      setAssignments((prev) => {
        const copy = { ...prev }
        delete copy[slot.id]
        return copy
      })
      return
    }
    if (armed && playerFitsRole(armed, slot.role)) {
      setAssignments((prev) => {
        const copy = { ...prev }
        for (const id of Object.keys(copy)) if (copy[id].name === armed.name) delete copy[id]
        copy[slot.id] = armed
        return copy
      })
      setArmed(null)
    }
  }

  // ── Simulate ────────────────────────────────────────────────────────────────
  function simulate() {
    if (selectedCount !== 11) return
    setResult(runTournament(team, Object.values(assignments), teams))
    setStep('result')
  }

  function playAgain() {
    setStep('build')
    setTeam(null)
    setRollPhase('idle')
    setAssignments({})
    setArmed(null)
    setResult(null)
    setFormationKey('4-3-3')
  }

  const FormationChips = ({ className = '' }) => (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {FORMATION_NAMES.map((key) => (
        <button
          key={key}
          onClick={() => changeFormation(key)}
          className={[
            'rounded-lg px-3.5 py-1.5 font-display text-sm tracking-wide transition-all',
            formationKey === key
              ? 'bg-gold text-navy-deep shadow-gold'
              : 'border border-white/10 text-bluegray hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold',
          ].join(' ')}
        >
          {key}
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen">
      <Header onHowTo={() => setHowTo(true)} onReplay={playAgain} />
      <HowToModal open={howTo} onClose={() => setHowTo(false)} />

      {step === 'build' && (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5">
          {!team ? (
            // ── Setup: choose a shape, then roll ──
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow mb-2 animate-fadeUp">UEFA Champions League · 2010—2025</p>
              <h1 className="mb-8 animate-fadeUp font-display text-4xl leading-tight text-cream sm:text-5xl">
                Pick your shape.<br /><span className="text-gold">Roll your club.</span>
              </h1>

              <div className="panel mx-auto mb-6 max-w-2xl p-5">
                <p className="eyebrow mb-3 text-left">Step 1 · Formation</p>
                <FormationChips className="justify-center" />
                <p className="eyebrow mb-3 mt-6 text-left">Step 2 · The draw</p>
                <button onClick={roll} disabled={rollPhase === 'rolling'} className="btn-gold mx-auto text-lg">
                  <span className={rollPhase === 'rolling' ? 'inline-block animate-starSpin' : ''}>🎲</span>
                  {rollPhase === 'rolling' ? 'Rolling…' : 'Roll'}
                </button>
              </div>

              <div className="opacity-80">
                <Pitch slots={slots} assignments={{}} armedPlayer={null} onSlotClick={() => {}} />
                <p className="mt-3 font-display text-base italic text-bluegray/70">
                  {formationKey} · the shape you’ll fill once your club is drawn
                </p>
              </div>
            </div>
          ) : (
            // ── Build the XI ──
            <>
              <div className="panel mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="eyebrow">{team.edition} · Champions League{team.league ? ` · ${team.league}` : ''}</p>
                  <h2 className="font-display text-3xl text-cream">{team.club}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-center">
                    <p className="font-display text-2xl text-gold">{selectedCount} / 11</p>
                    <p className="text-xs uppercase tracking-wider text-bluegray">Selected</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-2xl text-cream">{liveAvg ? liveAvg.toFixed(1) : '—'}</p>
                    <p className="text-xs uppercase tracking-wider text-bluegray">Avg rating</p>
                  </div>
                  <button onClick={roll} className="btn-ghost">🎲 Re-roll</button>
                  <button onClick={simulate} disabled={selectedCount !== 11} className="btn-gold">Simulate →</button>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="eyebrow mr-1">Formation</span>
                <FormationChips />
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                <div>
                  <Pitch
                    slots={slots}
                    assignments={assignments}
                    armedPlayer={armed}
                    onSlotClick={onSlotClick}
                  />
                  <p className="mt-3 text-center font-display text-base italic text-bluegray/70">
                    {armed
                      ? `Placing ${armed.name} — tap a glowing position`
                      : 'Tap a player, then tap a position · tap a token to remove'}
                  </p>
                </div>

                <div className="h-[28rem] lg:h-[42rem]">
                  <SquadList
                    squad={team.players}
                    usedNames={usedNames}
                    armedName={armed?.name || null}
                    onArm={armPlayer}
                    onRemove={removePlayer}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      )}

      {step === 'result' && team && result && (
        <SimulationScreen team={team} result={result} onReplay={playAgain} onEditXI={() => setStep('build')} />
      )}

      <footer className="border-t border-white/5 py-6 text-center">
        <p className="font-display text-sm tracking-wide text-bluegray/60">
          13—0 · A Champions League XI builder · group stage, two-legged knockouts, a one-off final
        </p>
      </footer>
    </div>
  )
}
