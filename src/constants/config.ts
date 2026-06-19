export const MAX_TOTAL_DURATION = 480;

export const MIN_TRANSITION_DURATION = 3;

export const MAX_FORMATION_REPEAT = 3;

export const DEFAULT_FORMATIONS = ['一字', '螺旋', 'S形', '圆形', '方阵', '龙摆尾'];

export const FORMATION_COLORS: Record<string, string> = {
  '一字': '#C8102E',
  '螺旋': '#D4AF37',
  'S形': '#2E8B57',
  '圆形': '#4169E1',
  '方阵': '#8B4513',
  '龙摆尾': '#9932CC',
};

export const getFormationColor = (formation: string): string => {
  return FORMATION_COLORS[formation] || '#6B7280';
};

export const SWITCH_MODE_LABELS: Record<string, string> = {
  march: '齐步',
  run: '跑步',
};
