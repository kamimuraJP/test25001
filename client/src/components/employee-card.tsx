import { type EmployeeWithStatus } from '@shared/schema';
import { StatusBadge } from './status-badge';
import { formatTime, cn } from '@/lib/utils';
import { type StatusType } from '@/lib/constants';

interface EmployeeCardProps {
  employee: EmployeeWithStatus;
  variant?: 'default' | 'large-display';
}

export function EmployeeCard({ employee, variant = 'default' }: EmployeeCardProps) {
  const isLargeDisplay = variant === 'large-display';
  
  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors',
      isLargeDisplay && 'p-4 bg-gray-700 text-white hover:bg-gray-600'
    )}>
      <div className="flex items-center space-x-3">
        <img
          src={employee.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.firstNameJa + employee.lastNameJa)}&background=random`}
          alt={`${employee.firstNameJa} ${employee.lastNameJa}`}
          className={cn(
            'rounded-full object-cover',
            isLargeDisplay ? 'w-12 h-12' : 'w-10 h-10'
          )}
        />
        <div>
          <div className={cn(
            'font-medium',
            isLargeDisplay ? 'text-lg text-white' : 'text-gray-900'
          )}>
            {employee.firstNameJa} {employee.lastNameJa}
          </div>
          <div className={cn(
            'text-xs',
            isLargeDisplay ? 'opacity-75 text-gray-300' : 'text-gray-500'
          )}>
            {employee.positionJa}
          </div>
          {employee.status?.comment && (
            <div className={cn(
              'text-xs mt-1 italic',
              isLargeDisplay ? 'text-blue-200' : 'text-blue-600'
            )}>
              "{employee.status.comment}"
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <StatusBadge 
          status={(employee.status?.status as StatusType) || 'offline'} 
          size={isLargeDisplay ? 'lg' : 'md'}
        />
        {employee.status?.lastUpdated && (
          <span className={cn(
            'text-xs',
            isLargeDisplay ? 'text-lg opacity-75 text-gray-300' : 'text-gray-500'
          )}>
            {formatTime(employee.status.lastUpdated)}
          </span>
        )}
      </div>
    </div>
  );
}
