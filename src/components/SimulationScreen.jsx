import { useEffect, useState } from 'react'

const PHASES = [
  'Seeding the group draw…',
  'Matchday football under the anthem…',
  'Standings taking shape…',
  'Into the knockout nights…',
  'Final whistle approaching…',
]

function Standings({ rows, userClub }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-white/5 px-4 py-2.5">
        <p className="eyebrow">Group stage · final table</p>
      </div>
      <table className="w-full text-left font-body">
        <thead>
          <tr className="text-[0.7rem] uppercase tracking-wider text-bluegray">
            <th className="px-3 py-2 font-normal">#</th>
            <th className="px-1 py-2 font-normal">Club</th>
            <th className="px-2 py-2 text-center font-normal">P</th>
            <th className="px-1 py-2 text-center font-normal">W</th>
            <th className="px-1 py-2 text-center font-normal">D</th>
            <th className="px-1 py-2 text-center font-normal">L</th>
            <th className="px-2 py-2 text-center font-normal">GD</th>
            <th className="px-2 py-2 text-center font-normal">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isUser = r.club === userClub
            const qualifies = i < 2
            return (
              <tr
                key={r.club}
                className={[
                  'border-t border-white/5 text-lg',
                  isUser ? 'bg-gold/10 text-cream' : 'text-bluegray',
                ].join(' ')}
              >
                <td className="px-3 py-2">
                  <span className={qualifies ? 'text-gold' : ''}>{i + 1}</span>
                </td>
                <td className="px-1 py-2">
                  <span className={`font-display ${isUser ? 'text-gold' : 'text-cream/90'}`}>{r.club}</span>
                </td>
                <td className="px-2 py-2 text-center">{r.P}</td>
                <td className="px-1 py-2 text-center">{r.W}</td>
                <td className="px-1 py-2 text-center">{r.D}</td>
                <td className="px-1 py-2 text-center">{r.L}</td>
                <td className="px-2 py-2 text-center">{r.GF - r.GA >= 0 ? '+' : ''}{r.GF - r.GA}</td>
                <td className="px-2 py-2 text-center font-display text-cream">{r.Pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RoundCard({ round, delay }) {
  const out = round.advanced === false
  return (
    <div
      className="panel animate-fadeUp p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-lg text-cream">{round.name}</p>
        <span
          className={[
            'rounded-full px-2.5 py-0.5 font-display text-[0.65rem] uppercase tracking-wider',
            round.advanced ? 'bg-gold/20 text-gold' : 'bg-red-500/15 text-red-300/90',
          ].join(' ')}
        >
          {round.name === 'Final' ? (round.advanced ? 'Won' : 'Lost') : round.advanced ? 'Through' : 'Out'}
        </span>
      </div>
      <p className="mt-1 font-body text-bluegray">vs {round.opponent}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-cream">
        {round.single ? (
          <span className="text-lg">
            {round.single.gf}<span className="text-bluegray">–</span>{round.single.ga}
            <span className="ml-1 text-sm text-bluegray">(final)</span>
          </span>
        ) : (
          <>
            {round.legs.map((l, idx) => (
              <span key={idx} className="text-lg">
                <span className="text-xs uppercase text-bluegray">{l.venue === 'H' ? 'Home' : 'Away'} </span>
                {l.gf}<span className="text-bluegray">–</span>{l.ga}
              </span>
            ))}
            <span className="text-sm text-bluegray">
              agg {round.aggFor}–{round.aggAgainst}
            </span>
          </>
        )}
        {round.decidedOn === 'penalties' && (
          <span className="rounded-full bg-navy-700/60 px-2 py-0.5 text-xs uppercase tracking-wide text-gold/80">
            on penalties
          </span>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="panel px-3 py-4 text-center">
      <p className={`font-display text-3xl ${accent ? 'text-gold' : 'text-cream'}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-bluegray">{label}</p>
    </div>
  )
}

export default function SimulationScreen({ team, result, onReplay, onEditXI }) {
  const [loading, setLoading] = useState(true)
  const [phaseIdx, setPhaseIdx] = useState(0)

  useEffect(() => {
    setLoading(true)
    setPhaseIdx(0)
    const stepper = setInterval(() => setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1)), 620)
    const done = setTimeout(() => {
      clearInterval(stepper)
      setLoading(false)
    }, 3200)
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
        <p key={phaseIdx} className="h-7 animate-fadeUp font-display text-2xl text-cream">{PHASES[phaseIdx]}</p>
      </section>
    )
  }

  const { totals, group, rounds, champion, verdict } = result
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-5">
      {/* Verdict */}
      <div className="mb-8 animate-spinReveal text-center">
        {champion && <div className="mb-3 text-5xl" aria-hidden="true">🏆</div>}
        <p className="eyebrow mb-2">{team.club} · {team.edition}</p>
        <h1 className={`font-display text-4xl leading-tight sm:text-5xl ${champion ? 'text-gold' : 'text-cream'}`}>
          {verdict}
        </h1>
      </div>

      {/* Campaign stats */}
      <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Stat label="Played" value={totals.P} />
        <Stat label="Wins" value={totals.W} accent />
        <Stat label="Draws" value={totals.D} />
        <Stat label="Losses" value={totals.L} />
        <Stat label="Goals for" value={totals.GF} />
        <Stat label="Against" value={totals.GA} />
      </div>

      <div className="mb-8">
        <Standings rows={group.rows} userClub={team.club} />
        {!group.qualified && (
          <p className="mt-3 text-center font-display text-lg italic text-bluegray">
            Finished {group.userRank}{ordinal(group.userRank)} — only the top two advance.
          </p>
        )}
      </div>

      {rounds.length > 0 && (
        <div className="mb-8 space-y-3">
          <p className="eyebrow text-center">Knockout run</p>
          {rounds.map((r, i) => (
            <RoundCard key={r.name} round={r} delay={i * 120} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={onEditXI} className="btn-ghost">← Adjust the XI</button>
        <button onClick={onReplay} className="btn-gold">Play again</button>
      </div>
    </section>
  )
}

function ordinal(n) {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}
