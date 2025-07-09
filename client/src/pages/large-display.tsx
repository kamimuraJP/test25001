import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type DepartmentWithEmployees } from '@shared/schema';
import { DepartmentCard } from '@/components/department-card';
import { useWebSocket } from '@/hooks/use-websocket';
import { formatDate } from '@/lib/utils';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function LargeDisplay() {
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(30);
  const [activeTab, setActiveTab] = useState<string>('');
  const [, setLocation] = useLocation();
  const { lastMessage } = useWebSocket();

  const { data: departments, isLoading, refetch } = useQuery<DepartmentWithEmployees[]>({
    queryKey: ['/api/departments'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Set first department as active tab on data load
  useEffect(() => {
    if (departments && departments.length > 0 && !activeTab) {
      setActiveTab(departments[0].id.toString());
    }
  }, [departments, activeTab]);

  // Auto-refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoRefreshCountdown((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      refetch();
      setAutoRefreshCountdown(30); // Reset countdown on manual update
    }
  }, [lastMessage, refetch]);

  if (isLoading) {
    return (
      <div className="p-8 bg-white text-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl">データを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!departments || departments.length === 0) {
    return (
      <div className="p-8 bg-white text-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">部署データがありません</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white text-gray-900 min-h-screen relative">
      {/* Back to Dashboard Button */}
      <Button
        onClick={() => setLocation('/')}
        variant="outline"
        size="icon"
        className="absolute top-6 right-6 border-gray-300 hover:bg-gray-100 text-gray-700"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">在席状況一覧</h1>
        <div className="text-lg text-gray-600">
          {formatDate(new Date())}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="grid grid-cols-5 bg-gray-100 rounded-lg mb-6 border border-gray-200">
          {departments.map((department) => (
            <button
              key={department.id}
              onClick={() => setActiveTab(department.id.toString())}
              className={`flex flex-col items-center justify-center p-4 h-20 transition-colors first:rounded-l-lg last:rounded-r-lg border-r border-gray-200 last:border-r-0 ${
                activeTab === department.id.toString()
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <div className="text-base font-medium">{department.nameJa}</div>
              <div className="text-sm opacity-75">
                {department.employees.length}名
              </div>
            </button>
          ))}
        </div>
        
        {/* Department Content */}
        {departments.map((department) => (
          activeTab === department.id.toString() && (
            <div key={department.id} className="flex justify-center">
              <DepartmentCard 
                department={department} 
                variant="large-display"
              />
            </div>
          )
        ))}
      </div>

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-6 right-6 bg-gray-100 border border-gray-200 rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <RefreshCw className={`h-4 w-4 text-blue-600 ${autoRefreshCountdown <= 5 ? 'animate-spin' : ''}`} />
          <span>自動更新: {autoRefreshCountdown}秒</span>
        </div>
      </div>

      {/* Tab navigation instruction */}
      <div className="fixed bottom-6 left-6 bg-gray-100 border border-gray-200 rounded-lg p-3 shadow-lg">
        <div className="text-sm text-gray-600">
          各部署のタブをクリックして表示切り替え
        </div>
      </div>
    </div>
  );
}
