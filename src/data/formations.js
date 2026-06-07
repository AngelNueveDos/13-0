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

// Short labels shown on the pitch (CDM→DM, CAM→AM read cleaner).
export const SHORT_LABEL = { CDM: 'DM', CAM: 'AM' }
export const labelFor = (role) => SHORT_LABEL[role] || role

// A player fits a slot if any of their positions is accepted by that slot's role.
export function playerFitsRole(player, role) {
  const ok = ACCEPTS[role] || [role]
  return player.positions.some((p) => ok.includes(p))
}

const slot = (id, role, x, y) => ({ id, role, x, y })

export const FORMATIONS = {
  '4-3-3': [
    slot('gk', 'GK', 50, 90),
    slot('lb', 'LB', 15, 72), slot('lcb', 'CB', 38, 77), slot('rcb', 'CB', 62, 77), slot('rb', 'RB', 85, 72),
    slot('cdm', 'CDM', 50, 60), slot('lcm', 'CM', 30, 50), slot('rcm', 'CM', 70, 50),
    slot('lw', 'LW', 20, 24), slot('st', 'ST', 50, 17), slot('rw', 'RW', 80, 24),
  ],
  '4-4-2': [
    slot('gk', 'GK', 50, 90),
    slot('lb', 'LB', 14, 72), slot('lcb', 'CB', 37, 77), slot('rcb', 'CB', 63, 77), slot('rb', 'RB', 86, 72),
    slot('lm', 'LM', 16, 48), slot('lcm', 'CM', 40, 52), slot('rcm', 'CM', 60, 52), slot('rm', 'RM', 84, 48),
    slot('lst', 'ST', 38, 20), slot('rst', 'ST', 62, 20),
  ],
  '4-2-3-1': [
    slot('gk', 'GK', 50, 90),
    slot('lb', 'LB', 14, 72), slot('lcb', 'CB', 37, 77), slot('rcb', 'CB', 63, 77), slot('rb', 'RB', 86, 72),
    slot('ldm', 'CDM', 36, 60), slot('rdm', 'CDM', 64, 60),
    slot('lam', 'LW', 18, 38), slot('cam', 'CAM', 50, 40), slot('ram', 'RW', 82, 38),
    slot('st', 'ST', 50, 17),
  ],
  '4-2-4': [
    slot('gk', 'GK', 50, 90),
    slot('lb', 'LB', 14, 72), slot('lcb', 'CB', 37, 77), slot('rcb', 'CB', 63, 77), slot('rb', 'RB', 86, 72),
    slot('lcm', 'CM', 35, 55), slot('rcm', 'CM', 65, 55),
    slot('lw', 'LW', 15, 26), slot('lst', 'ST', 40, 18), slot('rst', 'ST', 60, 18), slot('rw', 'RW', 85, 26),
  ],
  '3-5-2': [
    slot('gk', 'GK', 50, 90),
    slot('lcb', 'CB', 27, 77), slot('ccb', 'CB', 50, 79), slot('rcb', 'CB', 73, 77),
    slot('lwb', 'LWB', 11, 50), slot('lcm', 'CM', 34, 54), slot('cdm', 'CDM', 50, 60), slot('rcm', 'CM', 66, 54), slot('rwb', 'RWB', 89, 50),
    slot('lst', 'ST', 38, 20), slot('rst', 'ST', 62, 20),
  ],
  '5-3-2': [
    slot('gk', 'GK', 50, 90),
    slot('lwb', 'LWB', 10, 62), slot('lcb', 'CB', 30, 78), slot('ccb', 'CB', 50, 80), slot('rcb', 'CB', 70, 78), slot('rwb', 'RWB', 90, 62),
    slot('lcm', 'CM', 32, 52), slot('cdm', 'CDM', 50, 58), slot('rcm', 'CM', 68, 52),
    slot('lst', 'ST', 38, 20), slot('rst', 'ST', 62, 20),
  ],
  '4-5-1': [
    slot('gk', 'GK', 50, 90),
    slot('lb', 'LB', 14, 72), slot('lcb', 'CB', 37, 77), slot('rcb', 'CB', 63, 77), slot('rb', 'RB', 86, 72),
    slot('lm', 'LM', 13, 50), slot('lcm', 'CM', 37, 55), slot('cdm', 'CDM', 50, 60), slot('rcm', 'CM', 63, 55), slot('rm', 'RM', 87, 50),
    slot('st', 'ST', 50, 18),
  ],
  '3-4-3': [
    slot('gk', 'GK', 50, 90),
    slot('lcb', 'CB', 28, 77), slot('ccb', 'CB', 50, 79), slot('rcb', 'CB', 72, 77),
    slot('lm', 'LM', 13, 52), slot('lcm', 'CM', 38, 55), slot('rcm', 'CM', 62, 55), slot('rm', 'RM', 87, 52),
    slot('lw', 'LW', 20, 22), slot('st', 'ST', 50, 17), slot('rw', 'RW', 80, 22),
  ],
}

export const FORMATION_NAMES = Object.keys(FORMATIONS)
