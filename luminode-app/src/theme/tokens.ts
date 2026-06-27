// Luminode Design Tokens — translated from colors_and_type.css

export const Colors = {
  // Brand
  brandGlow:      '#14B8A6',
  brandGlowSoft:  '#5EEAD4',
  brandGlowDeep:  '#0F766E',
  brandNight:     '#0B1220',
  brandCivic:     '#1E40AF',
  brandAmber:     '#F59E0B',

  // Neutrals
  n0:   '#FFFFFF',
  n25:  '#FAFBFC',
  n50:  '#F4F6F8',
  n100: '#E8ECF0',
  n200: '#D4DAE0',
  n300: '#B5BEC7',
  n400: '#8A95A1',
  n500: '#5E6A78',
  n600: '#424E5C',
  n700: '#2C3744',
  n800: '#1A2330',
  n900: '#0B1220',

  // Surfaces
  bg:         '#F4F6F8',
  bgElevated: '#FFFFFF',
  bgSunken:   '#E8ECF0',
  bgCanvas:   '#F7F9FB',

  // Foreground
  fg1:      '#0B1220',
  fg2:      '#424E5C',
  fg3:      '#8A95A1',
  fgOnGlow: '#052E2A',

  // Borders
  border:      '#E8ECF0',
  borderStrong:'#D4DAE0',

  // Status
  statusOnline:  '#10B981',
  statusOffline: '#94A3B8',
  statusWarn:    '#F59E0B',
  statusAlarm:   '#EF4444',
  statusInfo:    '#3B82F6',
  statusMaint:   '#8B5CF6',

  // Status fills
  statusOnlineBg: '#D1FAE5',
  statusWarnBg:   '#FEF3C7',
  statusAlarmBg:  '#FEE2E2',
  statusInfoBg:   '#DBEAFE',
  statusMaintBg:  '#EDE9FE',

  // Data viz
  data1: '#14B8A6',
  data2: '#1E40AF',
  data3: '#F59E0B',
  data4: '#8B5CF6',
  data5: '#EF4444',
  data6: '#0EA5E9',

  // Energy ramp
  ramp0: '#ECFEFF',
  ramp1: '#A7F3D0',
  ramp2: '#5EEAD4',
  ramp3: '#14B8A6',
  ramp4: '#0F766E',
  ramp5: '#134E4A',
} as const;

export const Spacing = {
  sp1:  4,
  sp2:  8,
  sp3:  12,
  sp4:  16,
  sp5:  20,
  sp6:  24,
  sp8:  32,
  sp10: 40,
  sp12: 48,
  sp16: 64,
} as const;

export const Radius = {
  xs:   4,
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  pill: 999,
} as const;

export const FontSize = {
  xs:   11,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   22,
  '2xl': 28,
  '3xl': 36,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// Status helpers
export type StatusKey = 'online' | 'offline' | 'warn' | 'alarm' | 'maint';

export const statusColor: Record<StatusKey, string> = {
  online:  Colors.statusOnline,
  offline: Colors.statusOffline,
  warn:    Colors.statusWarn,
  alarm:   Colors.statusAlarm,
  maint:   Colors.statusMaint,
};

export const statusBg: Record<StatusKey, string> = {
  online:  Colors.statusOnlineBg,
  offline: Colors.bgSunken,
  warn:    Colors.statusWarnBg,
  alarm:   Colors.statusAlarmBg,
  maint:   Colors.statusMaintBg,
};

export const statusLabel: Record<StatusKey, { cn: string; en: string }> = {
  online:  { cn: '在线', en: 'Online' },
  offline: { cn: '离线', en: 'Offline' },
  warn:    { cn: '降级', en: 'Degraded' },
  alarm:   { cn: '故障', en: 'Fault' },
  maint:   { cn: '维护', en: 'Maint' },
};
