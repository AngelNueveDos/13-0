// ─────────────────────────────────────────────────────────────────────────────
//  13—0 · TOURNAMENT ENGINE
//
//  Two formats:
//
//  GROUP STAGE (classic) — user + 3 opponents from 3 DIFFERENT leagues, double
//  round-robin (6 user matches), top 2 advance, then two-legged R16/QF/SF + final.
//
//  LEAGUE PHASE (current UEFA Swiss model, 2024-25→) — one 36-team table, each
//  team plays 8 matches (4 home / 4 away) against 8 different opponents. Final
//  standings: ranks 1–8 go STRAIGHT to the Round of 16, ranks 9–24 contest a
//  two-legged knockout play-off, ranks 25–36 are eliminated. Then R16/QF/SF +
//  final. The field/cutoffs scale to the database size and snap to the exact
//  36 / 8 / 8–24 format once ≥36 clubs exist.
//
//  Knockouts: aggregate → away goals → penalty shootout (5 + sudden death);
//  final is a single neutral match (shootout if drawn). Opponents get stronger
//  each round. Every user match carries scoreline AND goalscorers.
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
  const K = 0.072
  const BASE = 1.32
  const homeBonus = neutral ? 0 : 0.35
  const diff = strHome - strAway
  const expH = clamp(BASE + diff * K + homeBonus, 0.2, 5)
  const expA = clamp(BASE - diff * K - homeBonus * 0.5, 0.18, 4.6)
  return [poisson(expH), poisson(expA)]
}

function shootout(strA, strB) {
  const pa = clamp(0.76 + (strA - strB) * 0.004, 0.6, 0.92)
  const pb = clamp(0.76 + (strB - strA) * 0.004, 0.6, 0.92)
  let a = 0, b = 0
  for (let i = 0; i < 5; i++) { if (Math.random() < pa) a++; if (Math.random() < pb) b++ }
  while (a === b) { if (Math.random() < pa) a++; if (Math.random() < pb) b++ }
  return { a, b, winnerA: a > b }
}

// ── Goalscorer attribution ───────────────────────────────────────────────────
const ATTACK_WEIGHT = {
  ST: 10, CF: 9, LW: 7, RW: 7, CAM: 6, LM: 3.2, RM: 3.2, CM: 2.4, CDM: 1,
  LWB: 1.2, RWB: 1.2, LB: 0.9, RB: 0.9, CB: 0.5, SW: 0.5, GK: 0.03,
}
const scorerWeight = (p) => Math.max(...p.positions.map((pos) => ATTACK_WEIGHT[pos] ?? 1)) * Math.pow(p.rating / 78, 2)
function weightedSample(items, weights) {
  const total = weights.reduce((s, w) => s + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i] }
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

function makeRecord(stage, oppTeam, venue, gf, ga, userXI, oppXI, extra = {}) {
  return {
    stage,
    opponent: { club: oppTeam.club, edition: oppTeam.edition, league: oppTeam.league, code: clubCode(oppTeam.club) },
    venue, gf, ga,
    result: gf > ga ? 'W' : gf === ga ? 'D' : 'L',
    scorers: attributeGoals(userXI, gf),
    conceded: attributeGoals(oppXI, ga),
    ...extra,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const newRow = (t) => ({ club: t.club, edition: t.edition, league: t.league, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 })
function applyRow(row, gf, ga) {
  row.P++; row.GF += gf; row.GA += ga
  if (gf > ga) { row.W++; row.Pts += 3 } else if (gf === ga) { row.D++; row.Pts++ } else row.L++
}

// ── Opponent selection ───────────────────────────────────────────────────────
function pickGroupOpponents(userTeam, pool, strengthOf) {
  const byLeague = {}
  for (const t of pool) {
    if (t.club === userTeam.club) continue
    if (userTeam.league && t.league === userTeam.league) continue
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

// One opponent per knockout round, getting stronger as rounds progress.
function pickKnockoutOpponents(userTeam, usedClubs, pool, strengthOf, nRounds) {
  const avail = pool
    .filter((t) => t.club !== userTeam.club && !usedClubs.has(t.club))
    .map((t) => ({ team: t, strength: strengthOf(t) }))
    .sort((a, b) => a.strength - b.strength)
  if (!avail.length) return []
  const usedIdx = new Set()
  const out = []
  for (let r = 0; r < nRounds; r++) {
    const pc = nRounds === 1 ? 0.6 : 0.2 + (0.8 - 0.2) * (r / (nRounds - 1))
    let idx = clamp(Math.round(pc * (avail.length - 1)) + (Math.floor(Math.random() * 3) - 1), 0, avail.length - 1)
    let guard = 0
    while (usedIdx.has(idx) && guard++ < avail.length) idx = clamp(idx + 1, 0, avail.length - 1)
    usedIdx.add(idx)
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
  const rows = entries.map((e) => newRow(e.team))
  const rowOf = (club) => rows.find((r) => r.club === club)
  const userMatches = []
  for (let i = 0; i < entries.length; i++) {
    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue
      const home = entries[i], away = entries[j]
      const [hg, ag] = playMatch(home.strength, away.strength)
      applyRow(rowOf(home.team.club), hg, ag)
      applyRow(rowOf(away.team.club), ag, hg)
      if (home.isUser) userMatches.push(makeRecord('GROUPS', away.team, 'H', hg, ag, home.xi, away.xi))
      if (away.isUser) userMatches.push(makeRecord('GROUPS', home.team, 'A', ag, hg, away.xi, home.xi))
    }
  }
  rows.sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF || Math.random() - 0.5)
  const userRank = rows.findIndex((r) => r.club === userTeam.club) + 1
  return { rows, userRank, qualified: userRank <= 2, userMatches }
}

// ── League phase (Swiss model) ───────────────────────────────────────────────
function runLeaguePhase(userTeam, userXI, userStrength, pool, strengthOf) {
  const FULL = 36
  const others = pool.filter((t) => t.club !== userTeam.club)
  const leagueSize = Math.min(FULL, others.length + 1)
  const fieldSize = leagueSize - 1
  const field = shuffle(others).slice(0, fieldSize).map((t) => ({ team: t, strength: strengthOf(t), xi: bestXI(t) }))
  const matchesPerTeam = Math.min(8, fieldSize)

  // user's real matches (alternating home/away)
  const userRow = newRow(userTeam)
  const userMatches = []
  shuffle(field).slice(0, matchesPerTeam).forEach((opp, i) => {
    const home = i % 2 === 0
    const [hg, ag] = home ? playMatch(userStrength, opp.strength) : playMatch(opp.strength, userStrength)
    const gf = home ? hg : ag, ga = home ? ag : hg
    applyRow(userRow, gf, ga)
    userMatches.push(makeRecord('LEAGUE', opp.team, home ? 'H' : 'A', gf, ga, userXI, opp.xi, { matchday: i + 1 }))
  })

  // other teams' records (independent approximation, table only)
  const rows = [userRow]
  field.forEach((ft) => {
    const row = newRow(ft.team)
    shuffle(field.filter((x) => x !== ft)).slice(0, matchesPerTeam).forEach((opp, i) => {
      const home = i % 2 === 0
      const [hg, ag] = home ? playMatch(ft.strength, opp.strength) : playMatch(opp.strength, ft.strength)
      applyRow(row, home ? hg : ag, home ? ag : hg)
    })
    rows.push(row)
  })

  rows.sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF || Math.random() - 0.5)
  const userRank = rows.findIndex((r) => r.club === userTeam.club && r.edition === userTeam.edition) + 1
  const directCount = Math.max(1, Math.round((leagueSize * 8) / 36))
  const playoffMax = Math.max(directCount + 1, Math.round((leagueSize * 24) / 36))
  const status = userRank <= directCount ? 'direct' : userRank <= playoffMax ? 'playoff' : 'out'
  return { rows, userRank, userMatches, directCount, playoffMax, leagueSize, status }
}

// ── Knockout ties ────────────────────────────────────────────────────────────
function runTie(stage, userXI, userStrength, opp, firstLegHome) {
  const order = firstLegHome ? ['H', 'A'] : ['A', 'H']
  const matches = []
  let aggFor = 0, aggAgainst = 0, userAway = 0, oppAway = 0
  order.forEach((venue, idx) => {
    const userHome = venue === 'H'
    const [hg, ag] = userHome ? playMatch(userStrength, opp.strength) : playMatch(opp.strength, userStrength)
    const gf = userHome ? hg : ag, ga = userHome ? ag : hg
    aggFor += gf; aggAgainst += ga
    if (!userHome) userAway += gf
    if (userHome) oppAway += ga
    matches.push(makeRecord(stage, opp.team, venue, gf, ga, userXI, opp.xi, { leg: idx + 1 }))
  })
  let advanced, decidedOn, pens = null
  if (aggFor !== aggAgainst) { advanced = aggFor > aggAgainst; decidedOn = 'aggregate' }
  else if (userAway !== oppAway) { advanced = userAway > oppAway; decidedOn = 'away goals' }
  else { const s = shootout(userStrength, opp.strength); advanced = s.winnerA; decidedOn = 'penalties'; pens = { user: s.a, opp: s.b } }
  return { matches, aggFor, aggAgainst, advanced, decidedOn, pens }
}

function runFinal(userXI, userStrength, opp) {
  let [gf, ga] = playMatch(userStrength, opp.strength, true)
  let decidedOn = 'normal time', pens = null, won = gf > ga
  if (gf === ga) { const s = shootout(userStrength, opp.strength); won = s.winnerA; decidedOn = 'penalties'; pens = { user: s.a, opp: s.b } }
  const record = makeRecord('FINAL', opp.team, 'N', gf, ga, userXI, opp.xi, { pens, decidedOn, advanced: won })
  return { record, won }
}

const KO_STAGES = ['ROUND OF 16', 'QUARTERS', 'SEMIS', 'FINAL']
const STAGE_EXIT = {
  'PLAY-OFF': 'play-off round', 'ROUND OF 16': 'round of 16',
  QUARTERS: 'quarters', SEMIS: 'semis', FINAL: 'final',
}

function runKnockouts(stages, userTeam, userXI, userStrength, pool, strengthOf, usedClubs, firstLegHomeR16, tally) {
  const opps = pickKnockoutOpponents(userTeam, usedClubs, pool, strengthOf, stages.length)
  const matches = [], ties = []
  let champion = false, exitRound = null
  for (let r = 0; r < stages.length; r++) {
    const stage = stages[r]
    const opp = opps[r] || pickKnockoutOpponents(userTeam, usedClubs, pool, strengthOf, 1)[0]
    if (!opp) break
    usedClubs.add(opp.team.club)
    if (stage === 'FINAL') {
      const { record, won } = runFinal(userXI, userStrength, opp)
      tally(record); matches.push(record)
      ties.push({ stage, opponent: record.opponent, advanced: won, decidedOn: record.decidedOn, pens: record.pens, single: true })
      if (won) champion = true; else exitRound = 'final'
      break
    }
    const firstLegHome = stage === 'ROUND OF 16' ? firstLegHomeR16 : Math.random() < 0.5
    const tie = runTie(stage, userXI, userStrength, opp, firstLegHome)
    tie.matches.forEach((m) => { tally(m); matches.push(m) })
    ties.push({ stage, opponent: tie.matches[0].opponent, advanced: tie.advanced, decidedOn: tie.decidedOn, pens: tie.pens, aggFor: tie.aggFor, aggAgainst: tie.aggAgainst })
    if (!tie.advanced) { exitRound = STAGE_EXIT[stage]; break }
  }
  return { champion, exitRound, matches, ties }
}

// ── Orchestrator ─────────────────────────────────────────────────────────────
export function runTournament(userTeam, userXI, pool, options = {}) {
  const format = options.format === 'league' ? 'league' : 'group'
  const userStrength = average(userXI.map((p) => p.rating))
  const cache = new Map()
  const strengthOf = (t) => {
    const k = t.club + t.edition
    if (!cache.has(k)) cache.set(k, bestXIStrength(t))
    return cache.get(k)
  }

  const totals = { P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0 }
  const tally = (rec) => {
    totals.P++; totals.GF += rec.gf; totals.GA += rec.ga
    if (rec.result === 'W') totals.W++; else if (rec.result === 'D') totals.D++; else totals.L++
  }

  let matches = []
  let ties = []
  let champion = false
  let exitRound = null
  let standings

  if (format === 'league') {
    const lp = runLeaguePhase(userTeam, userXI, userStrength, pool, strengthOf)
    lp.userMatches.forEach(tally)
    matches = [...lp.userMatches]
    standings = { mode: 'league', rows: lp.rows, userRank: lp.userRank, directCount: lp.directCount, playoffMax: lp.playoffMax, leagueSize: lp.leagueSize, status: lp.status }
    if (lp.status === 'out') {
      exitRound = 'league phase'
    } else {
      const usedClubs = new Set([userTeam.club])
      const stages = lp.status === 'playoff' ? ['PLAY-OFF', ...KO_STAGES] : [...KO_STAGES]
      const ko = runKnockouts(stages, userTeam, userXI, userStrength, pool, strengthOf, usedClubs, Math.random() < 0.5, tally)
      matches = matches.concat(ko.matches); ties = ko.ties; champion = ko.champion; exitRound = ko.exitRound
    }
  } else {
    const groupOpps = pickGroupOpponents(userTeam, pool, strengthOf)
    const group = runGroup(userTeam, userXI, userStrength, groupOpps)
    group.userMatches.forEach(tally)
    matches = [...group.userMatches]
    standings = { mode: 'group', rows: group.rows, userRank: group.userRank, qualified: group.qualified }
    if (!group.qualified) {
      exitRound = 'group stage'
    } else {
      const usedClubs = new Set([userTeam.club, ...groupOpps.map((o) => o.team.club)])
      const ko = runKnockouts([...KO_STAGES], userTeam, userXI, userStrength, pool, strengthOf, usedClubs, group.userRank === 2, tally)
      matches = matches.concat(ko.matches); ties = ko.ties; champion = ko.champion; exitRound = ko.exitRound
    }
  }

  const reachedFinal = ties.some((t) => t.stage === 'FINAL')
  let verdict
  if (champion) verdict = 'Champions of Europe'
  else if (reachedFinal) verdict = 'Runners-up'
  else if (exitRound === 'group stage') verdict = 'Out in the group stage'
  else if (exitRound === 'league phase') verdict = 'Out in the league phase'
  else verdict = `Out in the ${exitRound}`

  const cleanSheets = matches.filter((m) => m.ga === 0).length
  const scorerTally = new Map()
  matches.forEach((m) => m.scorers.forEach((s) => scorerTally.set(s.name, (scorerTally.get(s.name) || 0) + s.count)))
  let topScorer = null
  for (const [name, goals] of scorerTally) if (!topScorer || goals > topScorer.goals) topScorer = { name, goals }

  return { format, userStrength, standings, matches, ties, champion, exitRound: champion ? null : exitRound, verdict, totals, cleanSheets, topScorer }
}
