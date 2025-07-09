import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { StatusBadge } from '@/components/status-badge';
import { type StatusType, STATUS_TYPES } from '@/lib/constants';
import { 
  MapPin, 
  Home, 
  UserX,
  CalendarX,
  Building,
  Edit
} from 'lucide-react';

export default function MobileClockIn() {
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('on-site');
  const [statusComment, setStatusComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();



  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: StatusType; comment: string }) => {
      await apiRequest('POST', '/api/employees/2/status', {
        status: data.status,
        comment: data.comment,
        location: null,
        latitude: null,
        longitude: null,
      });
    },
    onSuccess: () => {
      toast({
        title: "ステータス更新完了",
        description: "ステータスが更新されました",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setStatusComment('');
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "ステータス更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (status: StatusType) => {
    if (statusComment.length > 20) {
      toast({
        title: "エラー",
        description: "コメントは20文字以内で入力してください",
        variant: "destructive",
      });
      return;
    }
    updateStatusMutation.mutate({
      status,
      comment: statusComment,
    });
  };

  return (
    <div className="p-4 pb-24">
      <div className="max-w-sm mx-auto">
        <Card className="overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center">
            <CardTitle className="text-xl font-bold">ステータス更新</CardTitle>
            <div className="text-sm opacity-90">
              {formatDate(new Date())}
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-4">
            {/* Comment Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                コメント (20文字以内)
              </label>
              <Textarea
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="状況や連絡事項を入力..."
                maxLength={20}
                className="resize-none"
                rows={2}
              />
              <div className="text-xs text-gray-500 mt-1">
                {statusComment.length}/20文字
              </div>
            </div>

            {/* Status Selection */}
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 mb-3">ステータス選択</div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedStatus === 'on-site' ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setSelectedStatus('on-site')}
                  >
                    <Building className="h-4 w-4" />
                    在席
                  </Button>
                  <Button
                    variant={selectedStatus === 'absent' ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setSelectedStatus('absent')}
                  >
                    <UserX className="h-4 w-4" />
                    離席
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedStatus === 'out' ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setSelectedStatus('out')}
                  >
                    <MapPin className="h-4 w-4" />
                    外出中
                  </Button>
                  <Button
                    variant={selectedStatus === 'remote' ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setSelectedStatus('remote')}
                  >
                    <Home className="h-4 w-4" />
                    テレワーク
                  </Button>
                </div>
                <div className="flex justify-center">
                  <Button
                    variant={selectedStatus === 'off' ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2 w-full"
                    onClick={() => setSelectedStatus('off')}
                  >
                    <CalendarX className="h-4 w-4" />
                    休み
                  </Button>
                </div>
              </div>
            </div>

            {/* Update Button */}
            <div className="pt-4">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => handleStatusUpdate(selectedStatus)}
                disabled={updateStatusMutation.isPending}
              >
                <Edit className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? '更新中...' : 'ステータスを更新'}
              </Button>
            </div>

            {/* Current Status */}
            <div className="text-center pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2">選択中のステータス</div>
              <StatusBadge status={selectedStatus} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
