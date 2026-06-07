// ─────────────────────────────────────────────────────────────────────────────
//  13—0 · TOURNAMENT ENGINE
//
//  1. GROUP STAGE — user + 3 opponents from 3 DIFFERENT leagues (UEFA rule),
//     drawn from the whole pool (any edition). Double round-robin → 6 user
//     matches, full standings, top 2 advance.
//  2. KNOCKOUTS — R16 / QF / SF: two legs, decided on aggregate then AWAY GOALS
//     then a penalty shootout (best of 5, then sudden death). Group winners host
//     the second leg; runners-up host the first. Opponents drawn from the whole
//     pool and getting STRONGER each round.
//  3. FINAL — single match on neutral ground (shootout if drawn).
//
//  Every user match carries its scoreline AND goalscorers (theirs & conceded).
// ─────────────────────────────────────────────────────────────────────────────

import { average, clubCode } from './util.js'

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export function bestXI(team) {
  return [...team.players].sort((a, b) => b.rating - a.rating).slice(0, 11)
}
export function bestXIStrength(team) {
  return average(bestXI(team).map((p) => p.rating))
}

// ── Match maths ──────────────────────────────────────────────────────────────
function poisson(lambda) {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}

function playMatch(strHome, strAway, neutral = false) {
  const K = 0.06
  const BASE = 1.32
  const homeBonus = neutral ? 0 : 0.35
  const diff = strHome - strAway
  const expH = clamp(BASE + diff * K + homeBonus, 0.2, 5)
  const expA = clamp(BASE - diff * K - homeBonus * 0.5, 0.18, 4.6)
  return [poisson(expH), poisson(expA)]
}

// Classic shootout: five kicks each, then sudden death.
function shootout(strA, strB) {
  const pa = clamp(0.76 + (strA - strB) * 0.004, 0.6, 0.92)
  const pb = clamp(0.76 + (strB - strA) * 0.004, 0.6, 0.92)
  let a = 0, b = 0
  for (let i = 0; i < 5; i++) {
    if (Math.random() < pa) a++
    if (Math.random() < pb) b++
  }
  while (a === b) {
    const sa = Math.random() < pa
    const sb = Math.random() < pb
    if (sa) a++
    if (sb) b++
  }
  return { a, b, winnerA: a > b }
}

// ── Goalscorer attribution ───────────────────────────────────────────────────
const ATTACK_WEIGHT = {
  ST: 10, CF: 9, LW: 7, RW: 7, CAM: 6, LM: 3.2, RM: 3.2, CM: 2.4, CDM: 1,
  LWB: 1.2, RWB: 1.2, LB: 0.9, RB: 0.9, CB: 0.5, SW: 0.5, GK: 0.03,
}
function scorerWeight(p) {
  const base = Math.max(...p.positions.map((pos) => ATTACK_WEIGHT[pos] ?? 1))
  return base * Math.pow(p.rating / 78, 2)
}
function weightedSample(items, weights) {
  const total = weights.reduce((s, w) => s + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}
function attributeGoals(lineup, count) {
  if (count <= 0 || !lineup.length) return []
  const weights = lineup.map(scorerWeight)
  const tally = new Map()
  for (let i = 0; i < count; i++) {
    const name = weightedSample(lineup, weights).name
    tally.set(name, (tally.get(name) || 0) + 1)
  }
  return [...tally.entries()].map(([name, c]) => ({ name, count: c }))
}

// ── Records ──────────────────────────────────────────────────────────────────
function makeRecord(stage, oppTeam, venue, gf, ga, userXI, oppXI, extra = {}) {
  return {
    stage,
    opponent: { club: oppTeam.club, edition: oppTeam.edition, league: oppTeam.league, code: clubCode(oppTeam.club) },
    venue, // 'H' | 'A' | 'N'
    gf, ga,
    result: gf > ga ? 'W' : gf === ga ? 'D' : 'L',
    scorers: attributeGoals(userXI, gf),
    conceded: attributeGoals(oppXI, ga),
    ...extra,
  }
}

// ── Opponent selection ───────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function pickGroupOpponents(userTeam, pool, strengthOf) {
  const byLeague = {}
  for (const t of pool) {
    if (t.club === userTeam.club) continue
    if (t.league === userTeam.league) continue
    ;(byLeague[t.league] ||= []).push(t)
  }
  const leagues = shuffle(Object.keys(byLeague)).slice(0, 3)
  const chosen = leagues.map((lg) => pick(byLeague[lg]))
  while (chosen.length < 3) {
    const others = pool.filter((t) => t.club !== userTeam.club && !chosen.includes(t))
    if (!others.length) break
    chosen.push(pick(others))
  }
  return chosen.map((t) => ({ team: t, strength: strengthOf(t), xi: bestXI(t) }))
}

// Escalating difficulty: each round draws nearer the top of the strength ladder.
function pickKnockoutOpponents(userTeam, usedClubs, pool, strengthOf) {
  const avail = pool
    .filter((t) => t.club !== userTeam.club && !usedClubs.has(t.club))
    .map((t) => ({ team: t, strength: strengthOf(t) }))
    .sort((a, b) => a.strength - b.strength)
  if (!avail.length) return []
  const percentiles = [0.35, 0.58, 0.78, 0.95] // R16, QF, SF, Final
  const used = new Set()
  const out = []
  for (const pc of percentiles) {
    let idx = Math.round(pc * (avail.length - 1)) + (Math.floor(Math.random() * 3) - 1)
    idx = clamp(idx, 0, avail.length - 1)
    // nudge off collisions
    let guard = 0
    while (used.has(idx) && guard++ < avail.length) idx = clamp(idx + 1, 0, avail.length - 1)
    used.add(idx)
    const o = avail[idx]
    out.push({ team: o.team, strength: o.strength, xi: bestXI(o.team) })
  }
  return out
}

// ── Group stage ──────────────────────────────────────────────────────────────
function runGroup(userTeam, userXI, userStrength, opponents) {
  const entries = [
    { team: userTeam, strength: userStrength, xi: userXI, isUser: true },
    ...opponents.map((o) => ({ team: o.team, strength: o.strength, xi: o.xi })),
  ]
  const rows = entries.map((e) => ({
    club: e.team.club, edition: e.team.edition, league: e.team.league,
    P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0,
  }))
  const rowOf = (club) => rows.find((r) => r.club === club)
  const apply = (row, gf, ga) => {
    row.P++; row.GF += gf; row.GA += ga
    if (gf > ga) { row.W++; row.Pts += 3 } else if (gf === ga) { row.D++; row.Pts++ } else row.L++
  }

  const userMatches = []
  for (let i = 0; i < entries.length; i++) {
    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue
      const home = entries[i]
      const away = entries[j]
      const [hg, ag] = playMatch(home.strength, away.strength)
      apply(rowOf(home.team.club), hg, ag)
      apply(rowOf(away.team.club), ag, hg)
      if (home.isUser) userMatches.push(makeRecord('GROUPS', away.team, 'H', hg, ag, home.xi, away.xi))
      if (away.isUser) userMatches.push(makeRecord('GROUPS', home.team, 'A', ag, hg, away.xi, home.xi))
    }
  }
  rows.sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF || Math.random() - 0.5)
  const userRank = rows.findIndex((r) => r.club === userTeam.club) + 1
  return { rows, userRank, qualified: userRank <= 2, userMatches }
}

// ── Two-legged tie (aggregate → away goals → penalties) ───────────────────────
function runTie(stage, userTeam, userXI, userStrength, opp, firstLegHome) {
  const order = firstLegHome ? ['H', 'A'] : ['A', 'H']
  const matches = []
  let aggFor = 0, aggAgainst = 0, userAwayGoals = 0, oppAwayGoals = 0
  order.forEach((venue, idx) => {
    const userHome = venue === 'H'
    const [hg, ag] = userHome ? playMatch(userStrength, opp.strength) : playMatch(opp.strength, userStrength)
    const gf = userHome ? hg : ag
    const ga = userHome ? ag : hg
    aggFor += gf; aggAgainst += ga
    if (!userHome) userAwayGoals += gf // user's goals away
    if (userHome) oppAwayGoals += ga // opponent's goals at user's home = their away goals
    matches.push(makeRecord(stage, opp.team, venue, gf, ga, userXI, opp.xi, { leg: idx + 1 }))
  })

  let advanced, decidedOn, pens = null
  if (aggFor !== aggAgainst) {
    advanced = aggFor > aggAgainst
    decidedOn = 'aggregate'
  } else if (userAwayGoals !== oppAwayGoals) {
    advanced = userAwayGoals > oppAwayGoals
    decidedOn = 'away goals'
  } else {
    const s = shootout(userStrength, opp.strength)
    advanced = s.winnerA
    decidedOn = 'penalties'
    pens = { user: s.a, opp: s.b }
  }
  return { matches, aggFor, aggAgainst, advanced, decidedOn, pens }
}

function runFinal(userTeam, userXI, userStrength, opp) {
  let [gf, ga] = playMatch(userStrength, opp.strength, true)
  let decidedOn = 'normal time', pens = null
  let won = gf > ga
  if (gf === ga) {
    const s = shootout(userStrength, opp.strength)
    won = s.winnerA
    decidedOn = 'penalties'
    pens = { user: s.a, opp: s.b }
  }
  const record = makeRecord('FINAL', opp.team, 'N', gf, ga, userXI, opp.xi, { pens, decidedOn, advanced: won })
  return { record, won }
}

const KO_STAGES = ['ROUND OF 16', 'QUARTERS', 'SEMIS', 'FINAL']

// ── Orchestrator ─────────────────────────────────────────────────────────────
export function runTournament(userTeam, userXI, pool) {
  const userStrength = average(userXI.map((p) => p.rating))
  const cache = new Map()
  const strengthOf = (t) => {
    if (!cache.has(t.club + t.edition)) cache.set(t.club + t.edition, bestXIStrength(t))
    return cache.get(t.club + t.edition)
  }

  const groupOpps = pickGroupOpponents(userTeam, pool, strengthOf)
  const group = runGroup(userTeam, userXI, userStrength, groupOpps)

  const totals = { P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0 }
  const tally = (rec) => {
    totals.P++; totals.GF += rec.gf; totals.GA += rec.ga
    if (rec.result === 'W') totals.W++; else if (rec.result === 'D') totals.D++; else totals.L++
  }
  group.userMatches.forEach(tally)

  const matches = [...group.userMatches]
  const ties = []
  let exitRound = group.qualified ? null : 'group stage'
  let champion = false

  if (group.qualified) {
    const used = new Set([userTeam.club, ...groupOpps.map((o) => o.team.club)])
    const koOpps = pickKnockoutOpponents(userTeam, used, pool, strengthOf)

    for (let r = 0; r < KO_STAGES.length; r++) {
      const stage = KO_STAGES[r]
      const opp = koOpps[r] || pickKnockoutOpponents(userTeam, used, pool, strengthOf)[0]
      if (!opp) break
      used.add(opp.team.club)

      if (stage === 'FINAL') {
        const { record, won } = runFinal(userTeam, userXI, userStrength, opp)
        tally(record)
        matches.push(record)
        ties.push({ stage, opponent: record.opponent, advanced: won, decidedOn: record.decidedOn, pens: record.pens, single: true })
        if (won) champion = true; else exitRound = 'final'
        break
      }

      const firstLegHome = r === 0 ? group.userRank === 2 : Math.random() < 0.5
      const tie = runTie(stage, userTeam, userXI, userStrength, opp, firstLegHome)
      tie.matches.forEach((m) => { tally(m); matches.push(m) })
      ties.push({ stage, opponent: tie.matches[0].opponent, advanced: tie.advanced, decidedOn: tie.decidedOn, pens: tie.pens, aggFor: tie.aggFor, aggAgainst: tie.aggAgainst })
      if (!tie.advanced) { exitRound = stage.toLowerCase(); break }
    }
  }

  const reachedFinal = ties.some((t) => t.stage === 'FINAL')
  let verdict
  if (champion) verdict = 'Champions of Europe'
  else if (reachedFinal) verdict = 'Runners-up'
  else if (exitRound === 'group stage') verdict = 'Out in the group stage'
  else verdict = `Out in the ${exitRound}`

  return { userStrength, group, matches, ties, champion, exitRound: champion ? null : exitRound, verdict, totals }
}
