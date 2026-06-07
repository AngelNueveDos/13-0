import { useMemo, useState } from 'react'
import Header from './components/Header'
import HowToModal from './components/HowToModal'
import DrawScreen from './components/DrawScreen'
import Pitch from './components/Pitch'
import SquadPanel from './components/SquadPanel'
import PlayerPickerModal from './components/PlayerPickerModal'
import ResultScreen from './components/ResultScreen'
import { teams } from './data/teams'
import { FORMATIONS, FORMATION_NAMES, playerFitsRole } from './data/formations'
import { average, simulate } from './lib/util'

export default function App() {
  const [step, setStep] = useState('draw') // draw | select | result
  const [drawPhase, setDrawPhase] = useState('idle') // idle | spinning | revealed
  const [team, setTeam] = useState(null)

  const [formationKey, setFormationKey] = useState('4-3-3')
  const [assignments, setAssignments] = useState({}) // slotId -> player
  const [activeSlot, setActiveSlot] = useState(null)
  const [result, setResult] = useState(null)
  const [howTo, setHowTo] = useState(false)

  const slots = FORMATIONS[formationKey]
  const usedNames = useMemo(
    () => new Set(Object.values(assignments).map((p) => p.name)),
    [assignments],
  )
  const selectedCount = Object.keys(assignments).length
  const liveAvg = useMemo(() => {
    const picked = Object.values(assignments)
    return picked.length ? average(picked.map((p) => p.rating)) : 0
  }, [assignments])

  // ── Draw ──────────────────────────────────────────────────────────────────
  function spin() {
    setDrawPhase('spinning')
    setTeam(null)
    setTimeout(() => {
      let next = teams[Math.floor(Math.random() * teams.length)]
      // avoid immediately redrawing the same squad when possible
      if (team && teams.length > 1) {
        while (next.club === team.club && next.edition === team.edition) {
          next = teams[Math.floor(Math.random() * teams.length)]
        }
      }
      setTeam(next)
      setDrawPhase('revealed')
    }, 1500)
  }

  function goToSelect() {
    setStep('select')
    setFormationKey('4-3-3')
    setAssignments({})
    setActiveSlot(null)
  }

  // ── Selection ───────────────────────────────────────────────────────────────
  function changeFormation(key) {
    const placed = Object.values(assignments)
    const nextSlots = FORMATIONS[key]
    const next = {}
    const taken = new Set()
    // Greedily re-seat already-picked players into compatible empty slots.
    for (const slot of nextSlots) {
      const fit = placed.find((p) => !taken.has(p.name) && playerFitsRole(p, slot.role))
      if (fit) {
        next[slot.id] = fit
        taken.add(fit.name)
      }
    }
    setFormationKey(key)
    setAssignments(next)
    setActiveSlot(null)
  }

  function pickForSlot(player) {
    if (!activeSlot) return
    setAssignments((prev) => {
      const copy = { ...prev }
      // ensure the player isn't double-booked in another slot
      for (const id of Object.keys(copy)) {
        if (copy[id].name === player.name) delete copy[id]
      }
      copy[activeSlot.id] = player
      return copy
    })
    setActiveSlot(null)
  }

  function clearSlot() {
    if (!activeSlot) return
    setAssignments((prev) => {
      const copy = { ...prev }
      delete copy[activeSlot.id]
      return copy
    })
    setActiveSlot(null)
  }

  // Click a player card in the squad list: toggle off if placed, else seat in
  // the first empty compatible slot.
  function quickPlace(player) {
    if (usedNames.has(player.name)) {
      setAssignments((prev) => {
        const copy = { ...prev }
        for (const id of Object.keys(copy)) {
          if (copy[id].name === player.name) delete copy[id]
        }
        return copy
      })
      return
    }
    const target = slots.find((s) => !assignments[s.id] && playerFitsRole(player, s.role))
    if (target) {
      setAssignments((prev) => ({ ...prev, [target.id]: player }))
    } else {
      // no natural slot free — open the nearest empty slot's picker as a hint
      const anyEmpty = slots.find((s) => !assignments[s.id])
      if (anyEmpty) setActiveSlot(anyEmpty)
    }
  }

  function runSimulation() {
    if (selectedCount !== 11) return
    setResult(simulate(Object.values(assignments)))
    setStep('result')
  }

  function fullReplay() {
    setStep('draw')
    setDrawPhase('idle')
    setTeam(null)
    setAssignments({})
    setActiveSlot(null)
    setResult(null)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Header onHowTo={() => setHowTo(true)} onReplay={fullReplay} />
      <HowToModal open={howTo} onClose={() => setHowTo(false)} />

      {step === 'draw' && (
        <DrawScreen phase={drawPhase} team={team} onSpin={spin} onContinue={goToSelect} />
      )}

      {step === 'select' && team && (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5">
          {/* command bar */}
          <div className="panel mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">{team.edition} · Champions League</p>
              <h2 className="font-display text-3xl text-cream">{team.club}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-center">
                <p className="font-display text-2xl text-gold">{selectedCount} / 11</p>
                <p className="text-xs uppercase tracking-wider text-bluegray">Selected</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-cream">
                  {liveAvg ? liveAvg.toFixed(1) : '—'}
                </p>
                <p className="text-xs uppercase tracking-wider text-bluegray">Avg rating</p>
              </div>
              <button
                onClick={runSimulation}
                disabled={selectedCount !== 11}
                className="btn-gold"
              >
                Simulate →
              </button>
            </div>
          </div>

          {/* formation chips */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-1">Formation</span>
            {FORMATION_NAMES.map((key) => (
              <button
                key={key}
                onClick={() => changeFormation(key)}
                className={[
                  'rounded-full px-4 py-1.5 font-display text-sm tracking-wide transition-all',
                  formationKey === key
                    ? 'bg-gold text-navy-deep shadow-gold'
                    : 'border border-white/10 text-bluegray hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold',
                ].join(' ')}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div>
              <Pitch
                slots={slots}
                assignments={assignments}
                activeSlotId={activeSlot?.id}
                onSlotClick={setActiveSlot}
              />
              <p className="mt-3 text-center font-display text-base italic text-bluegray/70">
                Tap a position to choose a player · {formationKey}
              </p>
            </div>

            <div className="h-[28rem] lg:h-[40rem]">
              <SquadPanel
                squad={team.players}
                usedNames={usedNames}
                onPlayerClick={quickPlace}
              />
            </div>
          </div>
        </main>
      )}

      {step === 'result' && team && result && (
        <ResultScreen
          team={team}
          result={result}
          onReplay={fullReplay}
          onEditXI={() => setStep('select')}
        />
      )}

      <PlayerPickerModal
        slot={activeSlot}
        squad={team?.players || []}
        usedNames={usedNames}
        currentName={activeSlot ? assignments[activeSlot.id]?.name : null}
        onPick={pickForSlot}
        onClear={clearSlot}
        onClose={() => setActiveSlot(null)}
      />

      <footer className="border-t border-white/5 py-6 text-center">
        <p className="font-display text-sm tracking-wide text-bluegray/60">
          13—0 · A Champions League XI builder · ratings reflect each club’s FIFA season
        </p>
      </footer>
    </div>
  )
}
