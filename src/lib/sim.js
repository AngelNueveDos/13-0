// ─────────────────────────────────────────────────────────────────────────────
//  13—0 · TOURNAMENT ENGINE
//
//  1. GROUP STAGE — user + 3 opponents from 3 DIFFERENT leagues (UEFA rule).
//     Double round-robin (home & away) → 12 matches, full standings table.
//     Top 2 advance.
//  2. KNOCKOUTS — Round of 16, Quarter-final, Semi-final: two legs vs one club,
//     decided on aggregate (penalty shootout if level). Group winners get the
//     second leg at home; runners-up host the first leg.
//  3. FINAL — single match on neutral ground.
//
//  Strength = average rating of a club's best XI. The user's strength is the
//  average rating of their *selected* eleven.
// ─────────────────────────────────────────────────────────────────────────────

import { average } from './util.js'

export function bestXIStrength(team) {
  const top = [...team.players].sort((a, b) => b.rating - a.rating).slice(0, 11)
  return average(top.map((p) => p.rating))
}

// Knuth Poisson sampler.
function poisson(lambda) {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

// Single match: returns [homeGoals, awayGoals].
function playMatch(strHome, strAway, neutral = false) {
  const K = 0.06 // goals per rating point of superiority
  const BASE = 1.32
  const homeBonus = neutral ? 0 : 0.35
  const diff = strHome - strAway
  const expH = clamp(BASE + diff * K + homeBonus, 0.2, 5)
  const expA = clamp(BASE - diff * K - homeBonus * 0.5, 0.18, 4.6)
  return [poisson(expH), poisson(expA)]
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

// Weighted coin flip for shootouts — stronger side slightly favoured.
function shootoutWinnerIsA(strA, strB) {
  const pA = 0.5 + clamp((strA - strB) * 0.012, -0.18, 0.18)
  return Math.random() < pA
}

function blankRow(team, strength) {
  return { club: team.club, league: team.league, strength, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }
}

function applyResult(row, gf, ga) {
  row.P++
  row.GF += gf
  row.GA += ga
  if (gf > ga) { row.W++; row.Pts += 3 } else if (gf === ga) { row.D++; row.Pts += 1 } else row.L++
}

// ── Opponent selection ───────────────────────────────────────────────────────
function pickGroupOpponents(userTeam, pool, strengthOf) {
  const userLeague = userTeam.league
  const byLeague = {}
  for (const t of pool) {
    if (t.club === userTeam.club) continue
    if (t.league === userLeague) continue
    ;(byLeague[t.league] ||= []).push(t)
  }
  const leagues = shuffle(Object.keys(byLeague)).slice(0, 3)
  // Fallback: if fewer than 3 other leagues exist, allow repeats by league.
  const chosen = []
  for (const lg of leagues) chosen.push(pickRandom(byLeague[lg]))
  while (chosen.length < 3) {
    const others = pool.filter((t) => t.club !== userTeam.club && !chosen.includes(t))
    if (!others.length) break
    chosen.push(pickRandom(others))
  }
  return chosen.map((t) => ({ team: t, strength: strengthOf(t) }))
}

function pickKnockoutOpponents(used, pool, strengthOf, count) {
  let avail = pool.filter((t) => !used.has(t.club))
  if (avail.length < count) avail = pool.filter((t) => !used.has(t.club) || true)
  const picked = shuffle(avail).slice(0, count).map((t) => ({ team: t, strength: strengthOf(t) }))
  // Escalate drama: strongest opponent saved for the latest round.
  picked.sort((a, b) => a.strength - b.strength)
  return picked
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
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ── Group stage ──────────────────────────────────────────────────────────────
function runGroup(userTeam, userStrength, opponents) {
  const entries = [{ team: userTeam, strength: userStrength, isUser: true }, ...opponents.map((o) => ({ team: o.team, strength: o.strength }))]
  const rows = entries.map((e) => blankRow(e.team, e.strength))
  const rowOf = (club) => rows.find((r) => r.club === club)
  const userMatches = []

  // Double round-robin: every ordered pair plays once (home team = first).
  for (let i = 0; i < entries.length; i++) {
    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue
      const home = entries[i]
      const away = entries[j]
      const [hg, ag] = playMatch(home.strength, away.strength)
      applyResult(rowOf(home.team.club), hg, ag)
      applyResult(rowOf(away.team.club), ag, hg)
      if (home.isUser) userMatches.push({ opponent: away.team.club, venue: 'H', gf: hg, ga: ag })
      if (away.isUser) userMatches.push({ opponent: home.team.club, venue: 'A', gf: ag, ga: hg })
    }
  }

  rows.sort((a, b) => b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF || Math.random() - 0.5)
  const userRank = rows.findIndex((r) => r.club === userTeam.club) + 1
  return { rows, userRank, qualified: userRank <= 2, userMatches }
}

// ── Two-legged tie ───────────────────────────────────────────────────────────
function runTwoLegged(userStrength, opp, firstLegHome) {
  // leg order: firstLegHome === true → user hosts leg 1.
  const legs = []
  const order = firstLegHome ? ['H', 'A'] : ['A', 'H']
  let aggFor = 0
  let aggAgainst = 0
  for (const venue of order) {
    const userHome = venue === 'H'
    const [hg, ag] = userHome
      ? playMatch(userStrength, opp.strength)
      : playMatch(opp.strength, userStrength)
    const gf = userHome ? hg : ag
    const ga = userHome ? ag : hg
    aggFor += gf
    aggAgainst += ga
    legs.push({ venue, gf, ga })
  }
  let advanced = aggFor > aggAgainst
  let decidedOn = 'aggregate'
  if (aggFor === aggAgainst) {
    advanced = shootoutWinnerIsA(userStrength, opp.strength)
    decidedOn = 'penalties'
  }
  return { legs, aggFor, aggAgainst, advanced, decidedOn }
}

// ── Final ────────────────────────────────────────────────────────────────────
function runFinal(userStrength, opp) {
  let [gf, ga] = playMatch(userStrength, opp.strength, true)
  let decidedOn = 'normal time'
  let won = gf > ga
  if (gf === ga) {
    won = shootoutWinnerIsA(userStrength, opp.strength)
    decidedOn = 'penalties'
  }
  return { gf, ga, won, decidedOn }
}

const ROUND_NAMES = ['Round of 16', 'Quarter-final', 'Semi-final', 'Final']

// ── Orchestrator ─────────────────────────────────────────────────────────────
export function runTournament(userTeam, userXI, pool) {
  const userStrength = average(userXI.map((p) => p.rating))
  const strengthCache = new Map()
  const strengthOf = (t) => {
    if (!strengthCache.has(t.club)) strengthCache.set(t.club, bestXIStrength(t))
    return strengthCache.get(t.club)
  }

  const opponents = pickGroupOpponents(userTeam, pool, strengthOf)
  const group = runGroup(userTeam, userStrength, opponents)

  const totals = { GF: 0, GA: 0, W: 0, D: 0, L: 0, P: 0 }
  const tallyMatch = (gf, ga) => {
    totals.GF += gf; totals.GA += ga; totals.P++
    if (gf > ga) totals.W++; else if (gf === ga) totals.D++; else totals.L++
  }
  group.userMatches.forEach((m) => tallyMatch(m.gf, m.ga))

  const rounds = []
  let exitRound = group.qualified ? null : 'Group stage'
  let champion = false

  if (group.qualified) {
    const used = new Set([userTeam.club, ...opponents.map((o) => o.team.club)])
    const koOpponents = pickKnockoutOpponents(used, pool, strengthOf, 4)

    for (let r = 0; r < ROUND_NAMES.length; r++) {
      const name = ROUND_NAMES[r]
      const opp = koOpponents[r] || pickKnockoutOpponents(used, pool, strengthOf, 1)[0]
      used.add(opp.team.club)

      if (name === 'Final') {
        const res = runFinal(userStrength, opp)
        tallyMatch(res.gf, res.ga)
        rounds.push({
          name, opponent: opp.team.club, opponentLeague: opp.team.league,
          single: { gf: res.gf, ga: res.ga }, decidedOn: res.decidedOn, advanced: res.won,
        })
        if (res.won) { champion = true } else { exitRound = name }
        break
      }

      // Leg order: group winners host leg 2 (first leg away); runners-up host leg 1.
      const firstLegHome = r === 0 ? group.userRank === 2 : Math.random() < 0.5
      const tie = runTwoLegged(userStrength, opp, firstLegHome)
      tie.legs.forEach((l) => tallyMatch(l.gf, l.ga))
      rounds.push({
        name, opponent: opp.team.club, opponentLeague: opp.team.league,
        legs: tie.legs, aggFor: tie.aggFor, aggAgainst: tie.aggAgainst,
        decidedOn: tie.decidedOn, advanced: tie.advanced,
      })
      if (!tie.advanced) { exitRound = name; break }
    }
  }

  const reachedFinal = rounds.some((r) => r.name === 'Final')
  let verdict
  if (champion) verdict = 'Champions of Europe'
  else if (reachedFinal) verdict = 'Runners-up'
  else if (exitRound === 'Group stage') verdict = 'Out in the group stage'
  else verdict = `Out in the ${exitRound}`

  return {
    userStrength,
    group,
    rounds,
    champion,
    exitRound: champion ? null : exitRound,
    verdict,
    totals,
  }
}
