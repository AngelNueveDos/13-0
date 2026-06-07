import { useEffect, useMemo, useState } from 'react'

const PHASES = [
  'Seeding the group draw…',
  'Matchday football under the anthem…',
  'Standings taking shape…',
  'Into the knockout nights…',
  'Final whistle approaching…',
]

const fmtScorers = (arr) =>
  arr.map((s) => (s.count > 1 ? `${s.name} (${s.count})` : s.name)).join(', ')

const LEG_LABEL = { 1: '1st leg', 2: '2nd leg' }

function tieNote(tie) {
  if (!tie) return null
  const word = tie.advanced ? (tie.stage === 'FINAL' ? 'Champions' : 'Through') : tie.stage === 'FINAL' ? 'Runners-up' : 'Eliminated'
  let how = ''
  if (tie.decidedOn === 'penalties' && tie.pens) how = ` on penalties (${tie.pens.user}–${tie.pens.opp})`
  else if (tie.decidedOn === 'away goals') how = ' on away goals'
  else if (tie.decidedOn === 'aggregate' && !tie.single) how = ` on aggregate (${tie.aggFor}–${tie.aggAgainst})`
  return { word, how, advanced: tie.advanced }
}

function MatchRow({ m, isFinal, note }) {
  const win = m.result === 'W'
  const draw = m.result === 'D'
  return (
    <div className={`px-4 py-3 ${isFinal ? 'border-l-2 border-gold' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="w-20 shrink-0">
          <p className="font-display text-[0.6rem] uppercase leading-tight tracking-[0.2em] text-bluegray">{m.stage}</p>
          {m.leg && <p className="text-[0.6rem] uppercase tracking-wider text-bluegray/60">{LEG_LABEL[m.leg]}</p>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg text-cream">
            <span className="mr-1 text-xs uppercase tracking-wider text-bluegray">vs {m.opponent.code}</span>
            {m.opponent.club} <span className="text-bluegray/70">{m.opponent.edition}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`font-display text-2xl tabular-nums ${win ? 'text-green-300' : draw ? 'text-cream' : 'text-red-300/80'}`}>
            {m.gf}<span className="mx-1 text-bluegray">–</span>{m.ga}
          </span>
          <span className={`w-4 text-center font-display text-lg ${win ? 'text-green-300' : draw ? 'text-bluegray' : 'text-red-300/80'}`}>
            {win ? '✓' : draw ? '–' : '✗'}
          </span>
        </div>
      </div>

      {(m.scorers.length > 0 || m.conceded.length > 0) && (
        <p className="mt-1 pl-[5.75rem] font-body text-sm leading-snug">
          {m.scorers.length > 0 && (
            <span className="text-cream/90">
              <span className="text-[0.62rem] uppercase tracking-wider text-bluegray">Goals </span>
              {fmtScorers(m.scorers)}
            </span>
          )}
          {m.conceded.length > 0 && (
            <span className="text-bluegray">
              {m.scorers.length > 0 && <span className="px-1.5 text-bluegray/40">·</span>}
              <span className="text-[0.62rem] uppercase tracking-wider text-bluegray/70">Conceded </span>
              {fmtScorers(m.conceded)}
            </span>
          )}
        </p>
      )}

      {note && (
        <p className={`mt-1.5 pl-[5.75rem] font-display text-xs uppercase tracking-wider ${note.advanced ? 'text-gold' : 'text-red-300/80'}`}>
          {note.word}{note.how}
        </p>
      )}
    </div>
  )
}

function Standings({ rows, userClub }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-white/5 px-4 py-2.5"><p className="eyebrow">Group stage · final table</p></div>
      <table className="w-full text-left font-body">
        <thead>
          <tr className="text-[0.7rem] uppercase tracking-wider text-bluegray">
            <th className="px-3 py-2 font-normal">#</th><th className="px-1 py-2 font-normal">Club</th>
            <th className="px-2 py-2 text-center font-normal">P</th><th className="px-1 py-2 text-center font-normal">W</th>
            <th className="px-1 py-2 text-center font-normal">D</th><th className="px-1 py-2 text-center font-normal">L</th>
            <th className="px-2 py-2 text-center font-normal">GD</th><th className="px-2 py-2 text-center font-normal">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isUser = r.club === userClub
            return (
              <tr key={r.club + r.edition} className={`border-t border-white/5 text-lg ${isUser ? 'bg-gold/10' : ''}`}>
                <td className="px-3 py-2"><span className={i < 2 ? 'text-gold' : 'text-bluegray'}>{i + 1}</span></td>
                <td className="px-1 py-2"><span className={`font-display ${isUser ? 'text-gold' : 'text-cream/90'}`}>{r.club}</span></td>
                <td className="px-2 py-2 text-center text-bluegray">{r.P}</td>
                <td className="px-1 py-2 text-center text-bluegray">{r.W}</td>
                <td className="px-1 py-2 text-center text-bluegray">{r.D}</td>
                <td className="px-1 py-2 text-center text-bluegray">{r.L}</td>
                <td className="px-2 py-2 text-center text-bluegray">{r.GF - r.GA >= 0 ? '+' : ''}{r.GF - r.GA}</td>
                <td className="px-2 py-2 text-center font-display text-cream">{r.Pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function SimulationScreen({ team, result, onReplay, onEditXI }) {
  const [loading, setLoading] = useState(true)
  const [phaseIdx, setPhaseIdx] = useState(0)

  useEffect(() => {
    setLoading(true); setPhaseIdx(0)
    const stepper = setInterval(() => setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1)), 620)
    const done = setTimeout(() => { clearInterval(stepper); setLoading(false) }, 3200)
    return () => { clearInterval(stepper); clearTimeout(done) }
  }, [result])

  const { totals, group, matches, ties, champion, verdict } = result

  // Attach each knockout tie's outcome note to the last match of that stage.
  const noteByMatchIndex = useMemo(() => {
    const tieByStage = {}
    ties.forEach((t) => (tieByStage[t.stage] = t))
    const lastIdx = {}
    matches.forEach((m, i) => { if (m.stage !== 'GROUPS') lastIdx[m.stage] = i })
    const map = {}
    Object.entries(lastIdx).forEach(([stage, idx]) => (map[idx] = tieNote(tieByStage[stage])))
    return map
  }, [matches, ties])

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

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-5">
      <div className="mb-8 animate-spinReveal text-center">
        {champion && <div className="mb-3 text-5xl" aria-hidden="true">🏆</div>}
        <p className="eyebrow mb-2">{team.club} · {team.edition}</p>
        <h1 className={`font-display text-4xl leading-tight sm:text-5xl ${champion ? 'text-gold' : 'text-cream'}`}>{verdict}</h1>
      </div>

      {/* Match log */}
      <div className="panel mb-6 divide-y divide-white/5">
        {matches.map((m, i) => (
          <MatchRow key={i} m={m} isFinal={m.stage === 'FINAL'} note={noteByMatchIndex[i]} />
        ))}
      </div>

      {/* Summary card */}
      <div className="panel mb-8 flex flex-col items-center gap-5 p-6 sm:flex-row sm:gap-8" style={{ boxShadow: '0 0 0 1px rgba(201,168,76,0.25), 0 18px 50px -20px rgba(0,0,0,0.7)' }}>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-7xl font-bold leading-none text-green-300" style={{ textShadow: '0 0 24px rgba(134,239,172,0.35)' }}>{totals.W}</span>
          <span className="font-display text-5xl text-bluegray">–</span>
          <span className="font-display text-7xl font-bold leading-none text-gold">{totals.L}</span>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-4 text-center">
          <div><p className="font-display text-3xl text-cream">{totals.GF}</p><p className="text-xs uppercase tracking-wider text-bluegray">Goals for</p></div>
          <div><p className="font-display text-3xl text-cream">{totals.GA}</p><p className="text-xs uppercase tracking-wider text-bluegray">Against</p></div>
          <div><p className="font-display text-3xl text-gold">{totals.W}</p><p className="text-xs uppercase tracking-wider text-bluegray">Wins</p></div>
        </div>
      </div>

      <div className="mb-8"><Standings rows={group.rows} userClub={team.club} /></div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={onEditXI} className="btn-ghost">← Adjust the XI</button>
        <button onClick={onReplay} className="btn-gold">Play again</button>
      </div>
    </section>
  )
}
