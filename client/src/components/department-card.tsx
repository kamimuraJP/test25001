import { type DepartmentWithEmployees } from '@shared/schema';
import { EmployeeCard } from './employee-card';
import { cn } from '@/lib/utils';

interface DepartmentCardProps {
  department: DepartmentWithEmployees;
  variant?: 'default' | 'large-display';
}

export function DepartmentCard({ department, variant = 'default' }: DepartmentCardProps) {
  const isLargeDisplay = variant === 'large-display';
  const onSiteCount = department.employees.filter(emp => emp.status?.status === 'on-site').length;
  const totalCount = department.employees.length;

  return (
    <div className={cn(
      'rounded-lg shadow-sm border overflow-hidden',
      isLargeDisplay ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    )}>
      <div className={cn(
        'p-4 border-b',
        isLargeDisplay ? 'border-gray-600' : 'border-gray-200'
      )}>
        <h2 className={cn(
          'font-semibold flex items-center',
          isLargeDisplay ? 'text-2xl text-white' : 'text-lg text-gray-900'
        )}>
          <i className={cn(
            'fas mr-2',
            `fa-${department.icon}`,
            isLargeDisplay ? 'text-blue-400 mr-3' : 'text-blue-600'
          )} />
          {department.nameJa}
          {isLargeDisplay && (
            <span className="ml-2 text-gray-300">({totalCount}/{totalCount})</span>
          )}
        </h2>
        {!isLargeDisplay && (
          <p className="text-sm text-gray-500">
            {totalCount}人中 {onSiteCount}人出社
          </p>
        )}
      </div>
      <div className="p-4 space-y-3">
        {department.employees.map((employee) => (
          <EmployeeCard 
            key={employee.id} 
            employee={employee} 
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}
