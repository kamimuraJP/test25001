export const STATUS_TYPES = {
  'on-site': {
    label: '出社',
    labelEn: 'On-site',
    icon: 'building',
    color: 'bg-green-500 text-white',
  },
  'remote': {
    label: 'テレワーク',
    labelEn: 'Remote',
    icon: 'home',
    color: 'bg-blue-500 text-white',
  },
  'direct-commute': {
    label: '直行',
    labelEn: 'Direct commute',
    icon: 'route',
    color: 'bg-orange-500 text-white',
  },
  'direct-return': {
    label: '直帰',
    labelEn: 'Direct return',
    icon: 'route',
    color: 'bg-purple-500 text-white',
  },
  'offline': {
    label: '退社',
    labelEn: 'Offline',
    icon: 'sign-out-alt',
    color: 'bg-gray-400 text-white',
  },
} as const;

export type StatusType = keyof typeof STATUS_TYPES;

export const CLOCK_ACTIONS = {
  CLOCK_IN: 'clock-in',
  CLOCK_OUT: 'clock-out',
} as const;

export const WS_MESSAGE_TYPES = {
  STATUS_UPDATE: 'STATUS_UPDATE',
  ATTENDANCE_UPDATE: 'ATTENDANCE_UPDATE',
} as const;
