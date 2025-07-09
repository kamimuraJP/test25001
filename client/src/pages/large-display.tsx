import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type DepartmentWithEmployees } from '@shared/schema';
import { DepartmentCard } from '@/components/department-card';
import { useWebSocket } from '@/hooks/use-websocket';
import { formatDate } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

export default function LargeDisplay() {
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(30);
  const { lastMessage } = useWebSocket();

  const { data: departments, isLoading, refetch } = useQuery<DepartmentWithEmployees[]>({
    queryKey: ['/api/departments'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

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
      <div className="p-8 bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-xl">データを読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">在席状況一覧</h1>
        <div className="text-xl opacity-75">
          {formatDate(new Date())}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {departments?.map((department) => (
          <DepartmentCard 
            key={department.id} 
            department={department} 
            variant="large-display"
          />
        ))}
      </div>

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-8 right-8 bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-sm">
          <RefreshCw className={`h-4 w-4 text-blue-400 ${autoRefreshCountdown <= 5 ? 'animate-spin' : ''}`} />
          <span>自動更新: {autoRefreshCountdown}秒</span>
        </div>
      </div>

      {/* Touch instruction for large displays */}
      <div className="fixed bottom-8 left-8 bg-gray-800 rounded-lg p-4 opacity-75">
        <div className="text-sm text-gray-300">
          <i className="fas fa-hand-pointer mr-2" />
          画面をタップして詳細表示
        </div>
      </div>
    </div>
  );
}
