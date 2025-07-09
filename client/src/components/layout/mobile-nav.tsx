import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Clock, 
  BarChart3, 
  MapPin,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    path: '/',
    label: 'ホーム',
    icon: Home,
  },
  {
    path: '/mobile-clockin',
    label: '打刻',
    icon: Clock,
  },
  {
    path: '/attendance',
    label: '勤怠',
    icon: BarChart3,
  },
  {
    path: '/location',
    label: '位置',
    icon: MapPin,
  },
];

interface MobileNavProps {
  onQuickClockIn: () => void;
}

export function MobileNav({ onQuickClockIn }: MobileNavProps) {
  const [location] = useLocation();

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={cn(
                  'flex flex-col items-center py-2 transition-colors cursor-pointer',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}>
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <Button
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg"
        onClick={onQuickClockIn}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </>
  );
}
