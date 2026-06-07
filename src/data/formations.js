// Pitch coordinate system: x 0–100 (left→right), y 0–100 (opponent goal → own goal).
// GK sits near y≈90 (bottom, own goal); forwards near the top (y≈18).

// Which player positions are accepted in a given slot role.
export const ACCEPTS = {
  GK: ['GK'],
  CB: ['CB', 'SW'],
  SW: ['SW', 'CB'],
  LB: ['LB', 'LWB', 'LM'],
  RB: ['RB', 'RWB', 'RM'],
  LWB: ['LWB', 'LB', 'LM'],
  RWB: ['RWB', 'RB', 'RM'],
  CDM: ['CDM', 'CM'],
  CM: ['CM', 'CDM', 'CAM'],
  CAM: ['CAM', 'CM', 'CF'],
  LM: ['LM', 'LW', 'LWB', 'LB'],
  RM: ['RM', 'RW', 'RWB', 'RB'],
  LW: ['LW', 'LM', 'ST', 'CF'],
  RW: ['RW', 'RM', 'ST', 'CF'],
  ST: ['ST', 'CF', 'LW', 'RW'],
  CF: ['CF', 'ST', 'CAM'],
}

// A player fits a slot if any of their positions is accepted by that slot's role.
export function playerFitsRole(player, role) {
  const ok = ACCEPTS[role] || [role]
  return player.positions.some((p) => ok.includes(p))
}

const slot = (id, role, x, y) => ({ id, role, x, y })

export const FORMATIONS = {
  '4-3-3': [
    slot('gk', 'GK', 50, 90),
    slot('lb', 'LB', 15, 72),
    slot('lcb', 'CB', 38, 77),
    slot('rcb', 'CB', 62, 77),
    slot('rb', 'RB', 85, 72),
    slot('cdm', 'CDM', 50, 60),
    slot('lcm', 'CM', 30, 50),
    slot('rcm', 'CM', 70, 50),
    slot('lw', 'LW', 20, 24),
    slot('st', 'ST', 50, 17),
    slot('rw', 'RW', 80, 24),
  ],
  '4-4-2': [
    slot('gk', 'GK', 50, 90),
    slot('lb', 'LB', 14, 72),
    slot('lcb', 'CB', 37, 77),
    slot('rcb', 'CB', 63, 77),
    slot('rb', 'RB', 86, 72),
    slot('lm', 'LM', 16, 48),
    slot('lcm', 'CM', 40, 52),
    slot('rcm', 'CM', 60, 52),
    slot('rm', 'RM', 84, 48),
    slot('lst', 'ST', 38, 20),
    slot('rst', 'ST', 62, 20),
  ],
  '4-2-3-1': [
    slot('gk', 'GK', 50, 90),
    slot('lb', 'LB', 14, 72),
    slot('lcb', 'CB', 37, 77),
    slot('rcb', 'CB', 63, 77),
    slot('rb', 'RB', 86, 72),
    slot('ldm', 'CDM', 36, 60),
    slot('rdm', 'CDM', 64, 60),
    slot('lam', 'LW', 18, 38),
    slot('cam', 'CAM', 50, 40),
    slot('ram', 'RW', 82, 38),
    slot('st', 'ST', 50, 17),
  ],
  '3-5-2': [
    slot('gk', 'GK', 50, 90),
    slot('lcb', 'CB', 27, 77),
    slot('ccb', 'CB', 50, 79),
    slot('rcb', 'CB', 73, 77),
    slot('lwb', 'LWB', 11, 50),
    slot('lcm', 'CM', 34, 54),
    slot('cdm', 'CDM', 50, 60),
    slot('rcm', 'CM', 66, 54),
    slot('rwb', 'RWB', 89, 50),
    slot('lst', 'ST', 38, 20),
    slot('rst', 'ST', 62, 20),
  ],
}

export const FORMATION_NAMES = Object.keys(FORMATIONS)
