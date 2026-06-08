import { Fragment, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import OutcomeMedia from './OutcomeMedia'

const VENUE_CLS = { H: 'text-green-300', A: 'text-sky-300', N: 'text-gold' }

// Expand a match into a chronological event stream: goals (one by one, running
// score) then penalty kicks (one by one) if the tie went to a shootout.
function buildEvents(m) {
  const goals = []
  m.scorers.forEach((s) => { for (let k = 0; k < s.count; k++) goals.push({ side: 'us', name: s.name }) })
  m.conceded.forEach((s) => { for (let k = 0; k < s.count; k++) goals.push({ side: 'them', name: s.name }) })
  goals.forEach((g) => (g.min = 1 + Math.floor(Math.random() * 90)))
  goals.sort((a, b) => a.min - b.min)
  let us = 0, them = 0
  const events = goals.map((g) => { if (g.side === 'us') us++; else them++; return { type: 'goal', side: g.side, name: g.name, us, them, min: g.min } })
  if (m.pens) {
    let pu = 0, po = 0, turn = 'u'
    while (pu < m.pens.user || po < m.pens.opp) {
      if (turn === 'u') { if (pu < m.pens.user) { pu++; events.push({ type: 'pen', penU: pu, penO: po }) } }
      else { if (po < m.pens.opp) { po++; events.push({ type: 'pen', penU: pu, penO: po }) } }
      turn = turn === 'u' ? 'o' : 'u'
    }
  }
  return events
}

function viewFromEvents(events, n) {
  let gf = 0, ga = 0, penU = null, penO = null, showPens = false
  const sc = new Map(), cc = new Map()
  for (let k = 0; k < n; k++) {
    const e = events[k]
    if (e.type === 'goal') {
      if (e.side === 'us') { gf++; sc.set(e.name, (sc.get(e.name) || 0) + 1) } else { ga++; cc.set(e.name, (cc.get(e.name) || 0) + 1) }
    } else { showPens = true; penU = e.penU; penO = e.penO }
  }
  return { gf, ga, scorers: [...sc].map(([name, count]) => ({ name, count })), conceded: [...cc].map(([name, count]) => ({ name, count })), penU, penO, showPens }
}

function fullView(m) {
  return { gf: m.gf, ga: m.ga, scorers: m.scorers, conceded: m.conceded, penU: m.pens?.user, penO: m.pens?.opp, showPens: !!m.pens }
}

function MatchRow({ m, view, note, isFinal, live }) {
  const { t } = useI18n()
  const fmt = (arr) => arr.map((s) => (s.count > 1 ? `${s.name} (${s.count})` : s.name)).join(', ')
  const win = view.gf > view.ga
  const draw = view.gf === view.ga
  return (
    <div className={`px-4 py-4 transition-colors ${isFinal ? 'border-l-2 border-gold' : ''} ${live ? 'bg-gold/[0.04]' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="w-24 shrink-0">
          <p className="font-display text-sm font-semibold uppercase leading-tight tracking-[0.12em] text-gold/90">{t('stage.' + m.stage)}</p>
          {m.leg && <p className="text-[0.72rem] uppercase tracking-wider text-bluegray">{t('leg.' + m.leg)}</p>}
          <p className={`text-xs font-bold uppercase tracking-wider ${VENUE_CLS[m.venue]}`}>{t('venue.' + m.venue)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl text-cream">
            <span className="mr-1 text-sm uppercase tracking-wider text-bluegray">vs {m.opponent.code}</span>
            {m.opponent.club} <span className="text-bluegray/70">{m.opponent.edition}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`font-display text-3xl font-semibold tabular-nums ${win ? 'text-green-300' : draw ? 'text-cream' : 'text-red-300'}`}>
            {view.gf}<span className="mx-1 text-bluegray">–</span>{view.ga}
          </span>
          <span className={`w-5 text-center font-display text-xl ${win ? 'text-green-300' : draw ? 'text-bluegray' : 'text-red-300'}`}>{win ? '✓' : draw ? '–' : '✗'}</span>
        </div>
      </div>

      {(view.scorers.length > 0 || view.conceded.length > 0) && (
        <p className="mt-1.5 pl-[6.75rem] text-base leading-snug sm:text-lg">
          {view.scorers.length > 0 && (
            <span><span className="font-display text-xs font-semibold uppercase tracking-wider text-green-300/90">{t('res.goals')} </span><span className="text-cream">{fmt(view.scorers)}</span></span>
          )}
          {view.conceded.length > 0 && (
            <span>{view.scorers.length > 0 && <span className="px-2 text-bluegray/40">·</span>}<span className="font-display text-xs font-semibold uppercase tracking-wider text-red-300/80">{t('res.conceded')} </span><span className="text-bluegray">{fmt(view.conceded)}</span></span>
          )}
        </p>
      )}

      {view.showPens && (
        <p className="mt-1 pl-[6.75rem] font-display text-base text-gold/90">
          {t('res.penalties')} <span className="tabular-nums text-cream">{view.penU}–{view.penO}</span>
        </p>
      )}

      {note && (
        <p className={`mt-2 pl-[6.75rem] font-display text-sm font-semibold uppercase tracking-wider ${note.advanced ? 'text-gold' : 'text-red-300'}`}>{note.word}{note.how}</p>
      )}
    </div>
  )
}

function Standings({ standings, userClub }) {
  const { t } = useI18n()
  const { mode, rows } = standings
  const cuts = mode === 'league'
    ? { [standings.directCount]: t('cut.r16'), [standings.playoffMax]: t('cut.playoff') }
    : { 2: t('cut.knockouts') }
  const tierClass = (rank) => {
    if (mode === 'league') return rank <= standings.directCount ? 'text-gold' : rank <= standings.playoffMax ? 'text-cream/90' : 'text-bluegray/60'
    return rank <= 2 ? 'text-gold' : 'text-bluegray'
  }
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-white/5 px-4 py-2.5">
        <p className="eyebrow">{mode === 'league' ? t('stand.leagueTitle', { n: rows.length }) : t('stand.groupTitle')}</p>
      </div>
      <div className="max-h-[30rem] overflow-y-auto">
        <table className="w-full text-left font-body">
          <thead className="sticky top-0 bg-navy-800/95 backdrop-blur">
            <tr className="text-[0.7rem] uppercase tracking-wider text-bluegray">
              <th className="px-3 py-2 font-normal">#</th><th className="px-1 py-2 font-normal">Club</th>
              <th className="px-2 py-2 text-center font-normal">P</th><th className="px-1 py-2 text-center font-normal">W</th>
              <th className="px-1 py-2 text-center font-normal">D</th><th className="px-1 py-2 text-center font-normal">L</th>
              <th className="px-2 py-2 text-center font-normal">GD</th><th className="px-2 py-2 text-center font-normal">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rank = i + 1
              const isUser = r.club === userClub
              return (
                <Fragment key={r.club + r.edition + i}>
                  <tr className={`border-t border-white/5 text-lg ${isUser ? 'bg-gold/10' : ''}`}>
                    <td className="px-3 py-2"><span className={tierClass(rank)}>{rank}</span></td>
                    <td className="px-1 py-2"><span className={`font-display ${isUser ? 'text-gold' : 'text-cream/90'}`}>{r.club}</span></td>
                    <td className="px-2 py-2 text-center text-bluegray">{r.P}</td>
                    <td className="px-1 py-2 text-center text-bluegray">{r.W}</td>
                    <td className="px-1 py-2 text-center text-bluegray">{r.D}</td>
                    <td className="px-1 py-2 text-center text-bluegray">{r.L}</td>
                    <td className="px-2 py-2 text-center text-bluegray">{r.GF - r.GA >= 0 ? '+' : ''}{r.GF - r.GA}</td>
                    <td className="px-2 py-2 text-center font-display text-cream">{r.Pts}</td>
                  </tr>
                  {cuts[rank] && (
                    <tr><td colSpan={8} className="bg-navy-deep/40 px-3 py-1 text-center font-display text-[0.65rem] uppercase tracking-[0.25em] text-gold/70">{cuts[rank]}</td></tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function SimulationScreen({ team, result, onReplay, onEditXI }) {
  const { t } = useI18n()
  const { totals, standings, matches, ties, champion, outcome, cleanSheets, topScorer } = result

  const [loading, setLoading] = useState(true)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [mode, setMode] = useState('auto')
  const [mi, setMi] = useState(0) // current match index revealing
  const [gi, setGi] = useState(0) // events shown in current match
  const [done, setDone] = useState(false)

  const eventsByMatch = useMemo(() => matches.map(buildEvents), [matches])

  const noteByMatchIndex = useMemo(() => {
    const tieByStage = {}
    ties.forEach((ti) => (tieByStage[ti.stage] = ti))
    const lastIdx = {}
    matches.forEach((m, i) => { if (m.stage !== 'GROUPS' && m.stage !== 'LEAGUE') lastIdx[m.stage] = i })
    const map = {}
    Object.entries(lastIdx).forEach(([stage, idx]) => {
      const ti = tieByStage[stage]
      if (!ti) return
      const word = ti.advanced ? (ti.stage === 'FINAL' ? t('tie.champions') : t('tie.through')) : ti.stage === 'FINAL' ? t('tie.runnersUp') : t('tie.eliminated')
      let how = ''
      if (ti.decidedOn === 'penalties' && ti.pens) how = ' ' + t('tie.onPens', { a: ti.pens.user, b: ti.pens.opp })
      else if (ti.decidedOn === 'away goals') how = ' ' + t('tie.onAwayGoals')
      else if (ti.decidedOn === 'aggregate' && !ti.single) how = ' ' + t('tie.onAgg', { a: ti.aggFor, b: ti.aggAgainst })
      map[idx] = { word, how: how ? ` ${how.trim()}` : '', advanced: ti.advanced }
    })
    return map
  }, [matches, ties, t])

  // loading splash
  useEffect(() => {
    setLoading(true); setPhaseIdx(0); setMi(0); setGi(0); setDone(false)
    const stepper = setInterval(() => setPhaseIdx((i) => Math.min(i + 1, 4)), 520)
    const tmo = setTimeout(() => { clearInterval(stepper); setLoading(false) }, 2200)
    return () => { clearInterval(stepper); clearTimeout(tmo) }
  }, [result])

  // reveal engine
  useEffect(() => {
    if (loading || done) return
    if (mi >= matches.length) { setDone(true); return }
    const events = eventsByMatch[mi]
    if (gi < events.length) {
      const e = events[gi]
      const id = setTimeout(() => setGi((g) => g + 1), e.type === 'pen' ? 430 : 600)
      return () => clearTimeout(id)
    }
    if (mode === 'auto') {
      const id = setTimeout(() => { setGi(0); setMi((m) => m + 1) }, 850)
      return () => clearTimeout(id)
    }
  }, [loading, done, mi, gi, mode, eventsByMatch, matches.length])

  const activeComplete = !loading && mi < matches.length && gi >= eventsByMatch[mi].length
  function next() { setGi(0); setMi((m) => m + 1) }

  if (loading) {
    const phases = [t('sim.p0'), t('sim.p1'), t('sim.p2'), t('sim.p3'), t('sim.p4')]
    return (
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-xl flex-col items-center justify-center px-5 text-center">
        <div className="relative mb-8 h-20 w-20">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 animate-starSpin rounded-full border-2 border-transparent border-t-gold" />
          <div className="absolute inset-3 animate-pulseGlow rounded-full bg-gold/10" />
        </div>
        <p className="eyebrow mb-3">{team.club} · {team.edition}</p>
        <p key={phaseIdx} className="h-7 animate-fadeUp font-display text-2xl text-cream">{phases[phaseIdx]}</p>
      </section>
    )
  }

  const exitNote = (() => {
    if (standings.mode === 'group') return standings.qualified ? null : t('note.groupOut', { rank: standings.userRank })
    if (standings.status === 'direct') return t('note.direct', { rank: standings.userRank })
    if (standings.status === 'playoff') return t('note.playoff', { rank: standings.userRank })
    return t('note.leagueOut', { rank: standings.userRank, max: standings.playoffMax })
  })()

  // which matches to render and how
  const lastRender = done ? matches.length - 1 : mi
  return (
    <section className="mx-auto max-w-2xl px-4 py-8 sm:px-5">
      {/* reveal controls (hidden once done) */}
      {!done && (
        <div className="mb-5 flex items-center justify-between">
          <div className="inline-flex overflow-hidden rounded-full border border-white/10">
            {['auto', 'manual'].map((mneu) => (
              <button key={mneu} onClick={() => setMode(mneu)} className={`px-4 py-1.5 font-display text-sm ${mode === mneu ? 'bg-gold text-navy-deep' : 'text-bluegray hover:text-gold'}`}>
                {t('reveal.' + mneu)}
              </button>
            ))}
          </div>
          <button onClick={() => setDone(true)} className="btn-ghost !px-4 !py-1.5 text-sm">{t('reveal.skip')}</button>
        </div>
      )}

      {done && (
        <div className="mb-8 animate-spinReveal text-center">
          <OutcomeMedia outcome={outcome} />
          <p className="eyebrow mb-2">{team.club} · {team.edition}</p>
          <h1 className={`font-display text-4xl leading-tight sm:text-5xl ${champion ? 'text-gold' : 'text-cream'}`}>{t('outcome.' + outcome)}</h1>
        </div>
      )}

      <div className="panel mb-6 divide-y divide-white/5">
        {matches.map((m, i) => {
          if (i > lastRender) return null
          const isActive = !done && i === mi
          const view = isActive ? viewFromEvents(eventsByMatch[i], gi) : fullView(m)
          const showNote = done || i < mi || (isActive && activeComplete)
          return <MatchRow key={i} m={m} view={view} note={showNote ? noteByMatchIndex[i] : null} isFinal={m.stage === 'FINAL'} live={isActive} />
        })}
      </div>

      {!done && mode === 'manual' && activeComplete && mi < matches.length && (
        <div className="mb-8 flex justify-center">
          <button onClick={next} className="btn-gold">{mi === matches.length - 1 ? t('reveal.continue') : t('reveal.next')}</button>
        </div>
      )}

      {done && (
        <>
          <div className="panel mb-6 flex flex-col items-center gap-5 p-6 sm:flex-row sm:gap-8" style={{ boxShadow: '0 0 0 1px rgba(201,168,76,0.25), 0 18px 50px -20px rgba(0,0,0,0.7)' }}>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-7xl font-bold leading-none text-green-300" style={{ textShadow: '0 0 24px rgba(134,239,172,0.35)' }}>{totals.W}</span>
              <span className="font-display text-5xl text-bluegray">–</span>
              <span className="font-display text-7xl font-bold leading-none text-gold">{totals.L}</span>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-4 text-center sm:grid-cols-4">
              <div><p className="font-display text-3xl text-cream">{totals.GF}</p><p className="text-xs uppercase tracking-wider text-bluegray">{t('res.goalsFor')}</p></div>
              <div><p className="font-display text-3xl text-cream">{totals.GA}</p><p className="text-xs uppercase tracking-wider text-bluegray">{t('res.against')}</p></div>
              <div><p className="font-display text-3xl text-cream">{totals.P}</p><p className="text-xs uppercase tracking-wider text-bluegray">{t('res.played')}</p></div>
              <div><p className="font-display text-3xl text-gold">{cleanSheets}</p><p className="text-xs uppercase tracking-wider text-bluegray">{t('res.cleanSheets')}</p></div>
            </div>
          </div>

          {topScorer && (
            <div className="mb-8 flex items-center justify-center gap-3 font-display text-lg">
              <span className="eyebrow">{t('res.topScorer')}</span>
              <span className="text-cream">{topScorer.name}</span>
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-gold px-2 text-sm font-bold text-navy-deep">{topScorer.goals}</span>
            </div>
          )}

          <div className="mb-8">
            <Standings standings={standings} userClub={team.club} />
            {exitNote && <p className="mt-3 text-center font-display text-lg italic text-bluegray">{exitNote}</p>}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={onEditXI} className="btn-ghost">{t('res.adjust')}</button>
            <button onClick={onReplay} className="btn-gold">{t('res.playAgain')}</button>
          </div>
        </>
      )}
    </section>
  )
}
