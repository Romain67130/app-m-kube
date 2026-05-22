export const COLORS = {
  primary: '#1F3864',
  secondary: '#2E75B6',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#DDE3EE',
  text: '#1A1A2E',
  textSecondary: '#6B7A99',
  textLight: '#FFFFFF',

  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  info: '#3498DB',

  statusPlanned: '#2E75B6',
  statusInProgress: '#27AE60',
  statusDone: '#6B7A99',
  statusCancelled: '#E74C3C',

  absenceCP: '#9B59B6',
  absenceMaladie: '#E74C3C',
  absenceRTT: '#3498DB',
  absenceFormation: '#F39C12',
  absenceAutre: '#95A5A6',

  weekendBg: '#F0F2F7',
  todayBg: '#EBF2FA',

  soustraitantAccent: '#E67E22',
  soustraitantBg: '#FFF6ED',
  soustraitantPlanningBg: '#FEF3E2',
};

export const STATUS_COLORS: Record<string, string> = {
  Planifié: COLORS.statusPlanned,
  'En cours': COLORS.statusInProgress,
  Terminé: COLORS.statusDone,
  Annulé: COLORS.statusCancelled,
};

export const ABSENCE_COLORS: Record<string, string> = {
  'Congé payé': COLORS.absenceCP,
  Maladie: COLORS.absenceMaladie,
  RTT: COLORS.absenceRTT,
  Formation: COLORS.absenceFormation,
  Autre: COLORS.absenceAutre,
};
