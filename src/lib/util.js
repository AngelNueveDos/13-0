// Two-/three-letter monogram for the pitch tokens.
export function initials(name) {
  const parts = name
    .replace(/[.'’]/g, '')
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 3).toUpperCase()
  }
  const first = parts[0][0]
  const last = parts[parts.length - 1][0]
  return (first + last).toUpperCase()
}

// Short 3-letter club code for match rows (e.g. "Bayern München" → "BAY").
const CLUB_PREFIXES = ['FC', 'AC', 'AS', 'CF', 'SC', 'CD', 'SS', 'SV', 'RC']
export function clubCode(club) {
  const words = club.split(/\s+/).filter((w) => !CLUB_PREFIXES.includes(w.toUpperCase()))
  const base = (words[0] || club).replace(/[^A-Za-zÀ-ÿ]/g, '')
  return base.slice(0, 3).toUpperCase()
}

// Surname-ish label for the pitch token.
export function shortName(name) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  // keep a particle with the surname when the last word is tiny (e.g. "da")
  if (last.length <= 3 && parts.length >= 2) return parts.slice(-2).join(' ')
  return last
}

export function average(nums) {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function weightedPick(entries) {
  // entries: [{ key, weight }]
  const total = entries.reduce((s, e) => s + e.weight, 0)
  let roll = Math.random() * total
  for (const e of entries) {
    roll -= e.weight
    if (roll <= 0) return e.key
  }
  return entries[entries.length - 1].key
}

function tierWeights(avg) {
  if (avg >= 89) return [
    { key: 'win', weight: 52 }, { key: 'final', weight: 24 },
    { key: 'semi', weight: 14 }, { key: 'qf', weight: 7 }, { key: 'r16', weight: 3 },
  ]
  if (avg >= 87) return [
    { key: 'win', weight: 38 }, { key: 'final', weight: 26 },
    { key: 'semi', weight: 20 }, { key: 'qf', weight: 11 }, { key: 'r16', weight: 5 },
  ]
  if (avg >= 85) return [
    { key: 'win', weight: 24 }, { key: 'final', weight: 24 },
    { key: 'semi', weight: 26 }, { key: 'qf', weight: 18 }, { key: 'r16', weight: 8 },
  ]
  if (avg >= 83) return [
    { key: 'win', weight: 14 }, { key: 'final', weight: 20 },
    { key: 'semi', weight: 26 }, { key: 'qf', weight: 24 }, { key: 'r16', weight: 16 },
  ]
  return [
    { key: 'win', weight: 7 }, { key: 'final', weight: 14 },
    { key: 'semi', weight: 22 }, { key: 'qf', weight: 28 }, { key: 'r16', weight: 29 },
  ]
}

const TIER_META = {
  win:   { label: 'Champions of Europe', tag: 'WINNERS',        rounds: 7 },
  final: { label: 'Runners-up',          tag: 'FINALISTS',      rounds: 7 },
  semi:  { label: 'Semi-finalists',      tag: 'SEMI-FINAL',     rounds: 6 },
  qf:    { label: 'Quarter-finalists',   tag: 'QUARTER-FINAL',  rounds: 5 },
  r16:   { label: 'Eliminated · Round of 16', tag: 'ROUND OF 16', rounds: 4 },
}

function winScore() {
  return ['2–1', '1–0', '3–1', '2–0', '4–1', '3–2'][randInt(0, 5)]
}
function loseScore() {
  return ['0–1', '1–2', '0–2', '1–3', '2–3'][randInt(0, 4)]
}

const TIER_LABEL = {
  win: 'the final', final: 'the final', semi: 'the semi-final',
  qf: 'the quarter-final', r16: 'the round of 16',
}

export function simulate(players) {
  const ratings = players.map((p) => p.rating)
  const avg = average(ratings)
  const tier = weightedPick(tierWeights(avg))
  const meta = TIER_META[tier]

  // Goals across the campaign scale with attacking weight + how far they go.
  const attackBias = Math.max(0, avg - 82) / 6 // 0…~3
  const goalsFor = Math.round(meta.rounds * (1.4 + attackBias * 0.7) + randInt(0, 4))
  const goalsAgainst = Math.round(meta.rounds * (0.7 + (90 - avg) * 0.04) + randInt(0, 3))

  const decided = tier === 'win' ? winScore() : loseScore()

  let verdictLine
  if (tier === 'win') {
    verdictLine = `Your XI lifts the trophy, winning ${decided} in the final.`
  } else if (tier === 'final') {
    verdictLine = `So close — beaten ${decided} in the final.`
  } else {
    verdictLine = `The run ends in ${TIER_LABEL[tier]}, losing ${decided}.`
  }

  let band
  if (avg >= 88) band = 'Pre-tournament favourites'
  else if (avg >= 86) band = 'Genuine contenders'
  else if (avg >= 84) band = 'Dark horses'
  else band = 'Plucky underdogs'

  return {
    avg,
    tier,
    verdict: meta.label,
    tag: meta.tag,
    band,
    finalScore: decided,
    goalsFor,
    goalsAgainst,
    matches: meta.rounds,
    verdictLine,
    isWin: tier === 'win',
  }
}
