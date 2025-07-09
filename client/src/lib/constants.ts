export const STATUS_TYPES = {
  'on-site': {
    label: '在席',
    labelEn: 'On-site',
    icon: 'building',
    color: 'bg-green-500 text-white',
    bgColor: 'bg-green-500',
  },
  'absent': {
    label: '離席',
    labelEn: 'Absent',
    icon: 'user-x',
    color: 'bg-yellow-500 text-white',
    bgColor: 'bg-yellow-500',
  },
  'out': {
    label: '外出中',
    labelEn: 'Out',
    icon: 'map-pin',
    color: 'bg-orange-500 text-white',
    bgColor: 'bg-orange-500',
  },
  'remote': {
    label: 'テレワーク',
    labelEn: 'Remote',
    icon: 'home',
    color: 'bg-blue-500 text-white',
    bgColor: 'bg-blue-500',
  },
  'off': {
    label: '休み',
    labelEn: 'Off',
    icon: 'calendar-x',
    color: 'bg-gray-500 text-white',
    bgColor: 'bg-gray-500',
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
