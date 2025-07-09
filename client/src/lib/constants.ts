export const STATUS_TYPES = {
  'on-site': {
    label: '在席',
    labelEn: 'On-site',
    icon: 'building',
    color: 'bg-green-500 text-white',
  },
  'absent': {
    label: '離席',
    labelEn: 'Absent',
    icon: 'user-x',
    color: 'bg-yellow-500 text-white',
  },
  'out': {
    label: '外出中',
    labelEn: 'Out',
    icon: 'map-pin',
    color: 'bg-orange-500 text-white',
  },
  'remote': {
    label: 'テレワーク',
    labelEn: 'Remote',
    icon: 'home',
    color: 'bg-blue-500 text-white',
  },
  'off': {
    label: '休み',
    labelEn: 'Off',
    icon: 'calendar-x',
    color: 'bg-gray-500 text-white',
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
