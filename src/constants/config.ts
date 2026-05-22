export const WEEK_HOURS_TARGET = 35;
export const WEEK_HOURS_MAX = 48;
export const DAY_START_DEFAULT = '07:30';
export const DAY_END_DEFAULT = '17:00';
export const BREAK_DEFAULT = 45;

export const ABSENCE_TYPES = [
  'Congé payé',
  'Maladie',
  'RTT',
  'Formation',
  'Autre',
] as const;

export const CHANTIER_STATUSES = [
  'Planifié',
  'En cours',
  'Terminé',
  'Annulé',
] as const;

export type AbsenceType = typeof ABSENCE_TYPES[number];
export type ChantierStatus = typeof CHANTIER_STATUSES[number];
