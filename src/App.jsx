import { useMemo, useState } from 'react'
import Header from './components/Header'
import HowToModal from './components/HowToModal'
import FeedbackModal from './components/FeedbackModal'
import Pitch from './components/Pitch'
import DraftList from './components/DraftList'
import SimulationScreen from './components/SimulationScreen'
import { teams } from './data/teams'
import { FORMATIONS, FORMATION_NAMES, playerFitsRole } from './data/formations'
import { average } from './lib/util'
import { runTournament } from './lib/sim'
import { useI18n } from './i18n'

const DIFFICULTIES = [
  { key: 'Easy', rerolls: 3 },
  { key: 'Medium', rerolls: 1 },
  { key: 'Hard', rerolls: 0 },
]
const FORMATS = [{ key: 'group' }, { key: 'league' }]

export default function App() {
  const { t } = useI18n()
  const [step, setStep] = useState('setup') // setup | draft | result
  const [formationKey, setFormationKey] = useState('4-3-3')
  const [difficulty, setDifficulty] = useState('Medium')
  const [format, setFormat] = useState('group')

  const [currentTeam, setCurrentTeam] = useState(null)
  const [rollPhase, setRollPhase] = useState('idle')
  const [rerollsLeft, setRerollsLeft] = useState(0)
  const [assignments, setAssignments] = useState({})
  const [armed, setArmed] = useState(null)
  const [result, setResult] = useState(null)
  const [simTeam, setSimTeam] = useState(null)
  const [howTo, setHowTo] = useState(false)
  const [feedback, setFeedback] = useState(false)

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
    if (armed && armed.source === 'pitch' && armed.fromSlotId === slot.id) { setArmed(null); return }
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
      if (wasDraft) setCurrentTeam(null)
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
    if (armed && armed.source === 'pitch') return t('hint.reposition', { name: armed.player.name })
    if (armed) return t('hint.placing', { name: armed.player.name })
    if (complete) return t('hint.complete')
    if (rollPhase === 'rolling') return t('hint.drawing')
    if (currentTeam && !canPlaceAny) return t('hint.noFit')
    if (currentTeam) return t('hint.pickFrom', { club: currentTeam.club })
    return t('hint.rollPrompt')
  })()

  const StatBox = ({ value, label }) => (
    <div className="text-center">
      <p className="font-display text-3xl text-cream">{value}</p>
      <p className="text-xs uppercase tracking-wider text-bluegray">{label}</p>
    </div>
  )

  return (
    <div className="min-h-screen">
      <Header onHowTo={() => setHowTo(true)} onReplay={playAgain} onFeedback={() => setFeedback(true)} />
      <HowToModal open={howTo} onClose={() => setHowTo(false)} />
      <FeedbackModal open={feedback} onClose={() => setFeedback(false)} />

      {/* ── Step 1: setup ── */}
      {step === 'setup' && (
        <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
          <p className="eyebrow mb-2 animate-fadeUp">{t('setup.eyebrow')}</p>
          <h1 className="mb-3 animate-fadeUp font-display text-5xl leading-tight text-cream sm:text-6xl">{t('setup.title')}</h1>
          <p className="mb-8 max-w-md animate-fadeUp text-xl text-bluegray">{t('setup.subtitle')}</p>

          <div className="panel mb-6 w-full max-w-2xl space-y-5 p-5 text-left">
            <div>
              <p className="eyebrow mb-2">{t('setup.formation')}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FORMATION_NAMES.map((key) => (
                  <button
                    key={key}
                    onClick={() => setFormationKey(key)}
                    className={['rounded-xl px-3 py-2.5 font-display text-base tracking-wide transition-all', formationKey === key ? 'bg-gold text-navy-deep shadow-gold' : 'border border-white/10 text-bluegray hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold'].join(' ')}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2">{t('setup.format')}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className={['rounded-xl px-4 py-3 text-left transition-all', format === f.key ? 'bg-gold text-navy-deep shadow-gold' : 'border border-white/10 hover:-translate-y-0.5 hover:border-gold/40'].join(' ')}
                  >
                    <p className={`font-display text-lg ${format === f.key ? 'text-navy-deep' : 'text-cream'}`}>{t(`format.${f.key}.label`)}</p>
                    <p className={`text-sm ${format === f.key ? 'text-navy-deep/70' : 'text-bluegray'}`}>{t(`format.${f.key}.sub`)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2">{t('setup.difficulty')}</p>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDifficulty(d.key)}
                    className={['rounded-xl px-3 py-3 transition-all', difficulty === d.key ? 'bg-gold text-navy-deep shadow-gold' : 'border border-white/10 hover:-translate-y-0.5 hover:border-gold/40'].join(' ')}
                  >
                    <p className={`font-display text-lg ${difficulty === d.key ? 'text-navy-deep' : 'text-cream'}`}>{t(`diff.${d.key}`)}</p>
                    <p className={`text-xs uppercase tracking-wide ${difficulty === d.key ? 'text-navy-deep/70' : 'text-bluegray'}`}>{t(`diff.${d.key}.sub`)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={startDraft} className="btn-gold text-lg">{t('setup.start')}</button>
        </main>
      )}

      {/* ── Step 2: draft ── */}
      {step === 'draft' && (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-5">
          <div className="panel mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">{formationKey} · {t(`format.${format}.label`)} · {t(`diff.${difficulty}`)}</p>
              <h2 className="font-display text-4xl text-cream">
                {complete ? t('draft.squadComplete') : currentTeam ? <>{t('draft.drawnPrefix')} <span className="text-gold">{currentTeam.club}</span></> : t('draft.rollNext')}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <StatBox value={`${count} / 11`} label={t('draft.drafted')} />
              <StatBox value={liveAvg ? liveAvg.toFixed(1) : '—'} label={t('draft.avgRating')} />
              <StatBox value={rerollsLeft} label={t('draft.rerolls')} />
              <button onClick={simulate} disabled={!complete} className="btn-gold">{t('draft.simulate')}</button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
            <div>
              <Pitch slots={slots} assignments={assignments} eligibleSlotIds={eligibleSlotIds} activeSlotId={armed?.source === 'pitch' ? armed.fromSlotId : null} onSlotClick={onSlotClick} />
              <p className="mt-3 text-center font-display text-lg italic text-bluegray/70">{hint}</p>
            </div>

            <div className="h-[30rem] lg:h-[46rem]">
              {complete ? (
                <div className="panel flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                  <p className="text-6xl">✓</p>
                  <p className="font-display text-2xl text-cream">{t('draft.completeTitle')}</p>
                  <p className="text-lg text-bluegray">{t('draft.completeBody')}</p>
                  <button onClick={simulate} className="btn-gold mt-2">{t('draft.simulateCampaign')}</button>
                </div>
              ) : rollPhase === 'rolling' ? (
                <div className="panel flex h-full flex-col items-center justify-center gap-3 text-bluegray">
                  <span className="text-5xl animate-starSpin">🎲</span>
                  <p className="font-display text-xl">{t('draft.drawing')}</p>
                </div>
              ) : currentTeam ? (
                <div className="flex h-full flex-col gap-3">
                  <div className="min-h-0 flex-1">
                    <DraftList club={currentTeam.club} edition={currentTeam.edition} players={currentTeam.players} armedName={armed?.source === 'draft' ? armed.player.name : null} canPlace={canPlace} onPick={pickCandidate} />
                  </div>
                  {!canPlaceAny ? (
                    <button onClick={roll} className="btn-ghost shrink-0">{t('draft.redrawFree')}</button>
                  ) : rerollsLeft > 0 ? (
                    <button onClick={reroll} className="btn-ghost shrink-0">{t('draft.reroll', { n: rerollsLeft })}</button>
                  ) : null}
                </div>
              ) : (
                <div className="panel flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                  <p className="font-display text-2xl text-cream">{count === 0 ? t('draft.drawFirst') : t('draft.pickOf', { n: count + 1 })}</p>
                  <p className="text-lg text-bluegray">{t('draft.rollHelp')}</p>
                  <button onClick={roll} className="btn-gold mt-1 text-lg"><span>🎲</span> {t('draft.roll')}</button>
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

      <footer className="border-t border-white/5 py-4 text-center">
        <p className="font-display text-xs tracking-wide text-bluegray/50">{t('footer')}</p>
      </footer>
    </div>
  )
}
