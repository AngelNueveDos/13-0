import { useEffect, useState } from 'react'

const PHASES = [
  'Seeding the draw…',
  'Group stage navigated…',
  'Into the knockout rounds…',
  'The nights grow heavier…',
  'Final whistle…',
]

export default function ResultScreen({ team, result, onReplay, onEditXI }) {
  const [loading, setLoading] = useState(true)
  const [phaseIdx, setPhaseIdx] = useState(0)

  useEffect(() => {
    setLoading(true)
    setPhaseIdx(0)
    const stepper = setInterval(() => {
      setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1))
    }, 750)
    const done = setTimeout(() => {
      clearInterval(stepper)
      setLoading(false)
    }, 3600)
    return () => {
      clearInterval(stepper)
      clearTimeout(done)
    }
  }, [result])

  if (loading) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-xl flex-col items-center justify-center px-5 text-center">
        <div className="relative mb-8 h-20 w-20">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 animate-starSpin rounded-full border-2 border-transparent border-t-gold" />
          <div className="absolute inset-3 animate-pulseGlow rounded-full bg-gold/10" />
        </div>
        <p className="eyebrow mb-3">{team.club} · {team.edition}</p>
        <p className="h-7 animate-fadeUp font-display text-2xl text-cream" key={phaseIdx}>
          {PHASES[phaseIdx]}
        </p>
      </section>
    )
  }

  const win = result.isWin
  return (
    <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-2xl flex-col items-center justify-center px-5 py-12 text-center">
      <div className="animate-spinReveal">
        {win && (
          <div className="mb-4 text-5xl" aria-hidden="true">
            🏆
          </div>
        )}
        <p className="eyebrow mb-2">{team.club} · {team.edition}</p>
        <h1
          className={`font-display text-5xl leading-tight sm:text-6xl ${
            win ? 'text-gold' : 'text-cream'
          }`}
        >
          {result.verdict}
        </h1>
        <p className="mt-3 font-display text-xl italic text-bluegray">{result.verdictLine}</p>
      </div>

      <div className="mt-10 grid w-full max-w-lg animate-fadeUp grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Verdict" value={result.tag} />
        <Stat label="XI rating" value={result.avg.toFixed(1)} />
        <Stat label="Goals for" value={result.goalsFor} />
        <Stat label="Goals against" value={result.goalsAgainst} />
      </div>

      <p className="mt-6 animate-fadeUp font-display text-lg text-gold/80">
        {result.band} · average rating {result.avg.toFixed(1)}
      </p>

      <div className="mt-9 flex animate-fadeUp flex-wrap items-center justify-center gap-3">
        <button onClick={onEditXI} className="btn-ghost">
          ← Adjust the XI
        </button>
        <button onClick={onReplay} className="btn-gold">
          Play again
        </button>
      </div>
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="panel px-3 py-4">
      <p className="font-display text-2xl text-cream">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-bluegray">{label}</p>
    </div>
  )
}
