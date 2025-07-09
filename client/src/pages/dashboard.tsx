import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type DepartmentWithEmployees } from '@shared/schema';
import { DepartmentCard } from '@/components/department-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { WS_MESSAGE_TYPES } from '@/lib/constants';
import { apiRequest } from '@/lib/queryClient';
import { 
  LogIn, 
  LogOut, 
  Edit, 
  TrendingUp,
  Search 
} from 'lucide-react';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  const { data: departments, isLoading } = useQuery<DepartmentWithEmployees[]>({
    queryKey: ['/api/departments'],
  });

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === WS_MESSAGE_TYPES.STATUS_UPDATE) {
        queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
        toast({
          title: "ステータス更新",
          description: "社員のステータスが更新されました",
        });
      } else if (lastMessage.type === WS_MESSAGE_TYPES.ATTENDANCE_UPDATE) {
        queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
        toast({
          title: "勤怠更新",
          description: "勤怠記録が更新されました",
        });
      }
    }
  }, [lastMessage, queryClient, toast]);

  const clockInMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/attendance/clock-in', data);
    },
    onSuccess: () => {
      toast({
        title: "出社打刻完了",
        description: "出社時刻が記録されました",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "出社打刻に失敗しました",
        variant: "destructive",
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/attendance/clock-out', data);
    },
    onSuccess: () => {
      toast({
        title: "退社打刻完了",
        description: "退社時刻が記録されました",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "退社打刻に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleClockIn = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      clockInMutation.mutate({
        employeeId: 1, // This should come from user context
        status: 'on-site',
        clockInLocation: `${position.coords.latitude}, ${position.coords.longitude}`,
        clockInLatitude: position.coords.latitude.toString(),
        clockInLongitude: position.coords.longitude.toString(),
      });
    } catch (error) {
      toast({
        title: "位置情報エラー",
        description: "位置情報の取得に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleClockOut = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      clockOutMutation.mutate({
        employeeId: 1, // This should come from user context
        clockOutLocation: `${position.coords.latitude}, ${position.coords.longitude}`,
        clockOutLatitude: position.coords.latitude.toString(),
        clockOutLongitude: position.coords.longitude.toString(),
      });
    } catch (error) {
      toast({
        title: "位置情報エラー",
        description: "位置情報の取得に失敗しました",
        variant: "destructive",
      });
    }
  };

  const filteredDepartments = departments?.map(dept => ({
    ...dept,
    employees: dept.employees.filter(emp => 
      emp.firstNameJa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastNameJa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.positionJa.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(dept => dept.employees.length > 0);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Search Bar - Mobile */}
      <div className="mb-6 md:hidden">
        <div className="relative">
          <Input
            type="text"
            placeholder="社員名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Organization Tree */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredDepartments?.map((department) => (
          <DepartmentCard key={department.id} department={department} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto space-y-2"
                onClick={handleClockIn}
                disabled={clockInMutation.isPending}
              >
                <LogIn className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">出社打刻</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto space-y-2"
                onClick={handleClockOut}
                disabled={clockOutMutation.isPending}
              >
                <LogOut className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">退社打刻</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto space-y-2"
              >
                <Edit className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">ステータス更新</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto space-y-2"
              >
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">レポート確認</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
