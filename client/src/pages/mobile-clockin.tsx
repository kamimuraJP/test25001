import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { StatusBadge } from '@/components/status-badge';
import { type StatusType } from '@/lib/constants';
import { 
  LogIn, 
  LogOut, 
  MapPin, 
  Home, 
  Route,
  RefreshCw
} from 'lucide-react';

export default function MobileClockIn() {
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('on-site');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { position, error, loading, refreshLocation } = useGeolocation();

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
    onError: () => {
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
    onError: () => {
      toast({
        title: "エラー",
        description: "退社打刻に失敗しました",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: StatusType) => {
      const data = {
        status,
        location: position ? `${position.coords.latitude}, ${position.coords.longitude}` : null,
        latitude: position?.coords.latitude.toString(),
        longitude: position?.coords.longitude.toString(),
      };
      await apiRequest('POST', '/api/employees/1/status', data);
    },
    onSuccess: () => {
      toast({
        title: "ステータス更新完了",
        description: "ステータスが更新されました",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "ステータス更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleClockIn = () => {
    if (!position) {
      toast({
        title: "位置情報エラー",
        description: "位置情報を取得してください",
        variant: "destructive",
      });
      return;
    }

    clockInMutation.mutate({
      employeeId: 1,
      status: selectedStatus,
      clockInLocation: `${position.coords.latitude}, ${position.coords.longitude}`,
      clockInLatitude: position.coords.latitude.toString(),
      clockInLongitude: position.coords.longitude.toString(),
    });
  };

  const handleClockOut = () => {
    if (!position) {
      toast({
        title: "位置情報エラー",
        description: "位置情報を取得してください",
        variant: "destructive",
      });
      return;
    }

    clockOutMutation.mutate({
      employeeId: 1,
      clockOutLocation: `${position.coords.latitude}, ${position.coords.longitude}`,
      clockOutLatitude: position.coords.latitude.toString(),
      clockOutLongitude: position.coords.longitude.toString(),
    });
  };

  const handleStatusUpdate = (status: StatusType) => {
    setSelectedStatus(status);
    updateStatusMutation.mutate(status);
  };

  return (
    <div className="p-4 pb-24">
      <div className="max-w-sm mx-auto">
        <Card className="overflow-hidden">
          <div className="bg-blue-600 text-white p-6 text-center">
            <h2 className="text-xl font-bold mb-2">勤怠打刻</h2>
            <div className="text-sm opacity-90">
              {formatDate(new Date())}
            </div>
          </div>
          
          <CardContent className="p-6 space-y-4">
            {/* Location Info */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2 flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                現在の位置情報
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshLocation}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="flex items-center justify-center text-gray-800">
                {loading && <span className="text-sm">位置情報を取得中...</span>}
                {error && (
                  <span className="text-sm text-red-600">
                    位置情報の取得に失敗しました
                  </span>
                )}
                {position && (
                  <span className="text-sm">
                    {position.coords.latitude.toFixed(4)}, {position.coords.longitude.toFixed(4)}
                  </span>
                )}
              </div>
            </div>

            {/* Clock In/Out Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="flex flex-col items-center p-4 h-auto space-y-2 bg-green-600 hover:bg-green-700"
                onClick={handleClockIn}
                disabled={clockInMutation.isPending || !position}
              >
                <LogIn className="h-6 w-6" />
                <span className="font-medium">出社</span>
              </Button>
              <Button
                className="flex flex-col items-center p-4 h-auto space-y-2 bg-red-600 hover:bg-red-700"
                onClick={handleClockOut}
                disabled={clockOutMutation.isPending || !position}
              >
                <LogOut className="h-6 w-6" />
                <span className="font-medium">退社</span>
              </Button>
            </div>

            {/* Status Selection */}
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 mb-3">ステータス変更</div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedStatus === 'on-site' ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleStatusUpdate('on-site')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <i className="fas fa-building" />
                    出社
                  </Button>
                  <Button
                    variant={selectedStatus === 'remote' ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleStatusUpdate('remote')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Home className="h-4 w-4" />
                    テレワーク
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedStatus === 'direct-commute' ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleStatusUpdate('direct-commute')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Route className="h-4 w-4" />
                    直行
                  </Button>
                  <Button
                    variant={selectedStatus === 'direct-return' ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleStatusUpdate('direct-return')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Route className="h-4 w-4" />
                    直帰
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="text-center pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2">現在のステータス</div>
              <StatusBadge status={selectedStatus} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
