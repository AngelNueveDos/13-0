// ─────────────────────────────────────────────────────────────────────────────
//  Outcome media — a different visual for each way the campaign can end.
//
//  Paste a GIF (or image) URL per outcome to show it on the result screen.
//  Leave '' to use the built-in animated scene. If a URL fails to load, the
//  scene is shown automatically. Outcomes:
//    CHAMPION · RUNNER_UP · OUT_SF · OUT_QF · OUT_R16 · OUT_PLAYOFF ·
//    OUT_GROUP · OUT_LEAGUE
// ─────────────────────────────────────────────────────────────────────────────
export const OUTCOME_GIFS = {
  CHAMPION: '',
  RUNNER_UP: '',
  OUT_SF: '',
  OUT_QF: '',
  OUT_R16: '',
  OUT_PLAYOFF: '',
  OUT_GROUP: '',
  OUT_LEAGUE: '',
}

// Built-in fallback scenes (emoji + accent) used when no GIF URL is set.
export const OUTCOME_SCENE = {
  CHAMPION: { emoji: '🏆', accent: 'gold', glow: true },
  RUNNER_UP: { emoji: '🥈', accent: 'silver' },
  OUT_SF: { emoji: '😤', accent: 'dim' },
  OUT_QF: { emoji: '😣', accent: 'dim' },
  OUT_R16: { emoji: '😞', accent: 'dim' },
  OUT_PLAYOFF: { emoji: '😔', accent: 'dim' },
  OUT_GROUP: { emoji: '🚪', accent: 'dim' },
  OUT_LEAGUE: { emoji: '🚪', accent: 'dim' },
}
