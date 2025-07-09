import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Clock, 
  MapPin, 
  BarChart3, 
  Monitor 
} from 'lucide-react';

const navItems = [
  {
    path: '/',
    label: 'ダッシュボード',
    icon: LayoutDashboard,
  },
  {
    path: '/attendance',
    label: '勤怠管理',
    icon: Clock,
  },
  {
    path: '/mobile-clockin',
    label: 'モバイル打刻',
    icon: Clock,
  },
  {
    path: '/large-display',
    label: '大型ディスプレイ',
    icon: Monitor,
  },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 hidden lg:block">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <a className={cn(
                'flex items-center space-x-3 p-3 rounded-lg transition-colors',
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
