import { STATUS_TYPES, type StatusType } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, showIcon = true, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_TYPES[status];
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.color,
      sizeClasses[size]
    )}>
      {showIcon && (
        <i className={cn('fas', `fa-${config.icon}`, size === 'sm' ? 'mr-1' : 'mr-2')} />
      )}
      {config.label}
    </span>
  );
}
