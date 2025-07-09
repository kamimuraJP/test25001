import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type DepartmentWithEmployees, type StatusType } from '@shared/schema';
import { DepartmentCard } from '@/components/department-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/status-badge';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { WS_MESSAGE_TYPES, STATUS_TYPES } from '@/lib/constants';
import { apiRequest } from '@/lib/queryClient';
import { 
  Edit, 
  TrendingUp,
  Search,
  MessageSquare,
  Building,
  UserX,
  MapPin,
  Home,
  CalendarX
} from 'lucide-react';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedStatus, setSelectedStatus] = useState<StatusType>('on-site');
  const [statusComment, setStatusComment] = useState('');
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
      }
    }
  }, [lastMessage, queryClient, toast]);



  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: StatusType; comment: string }) => {
      await apiRequest('POST', '/api/employees/71/status', {
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



  const handleStatusUpdate = () => {
    if (statusComment.length > 20) {
      toast({
        title: "エラー",
        description: "コメントは20文字以内で入力してください",
        variant: "destructive",
      });
      return;
    }
    updateStatusMutation.mutate({
      status: selectedStatus,
      comment: statusComment,
    });
  };

  // Get current user's status
  const currentUser = departments
    ?.flatMap(dept => dept.employees)
    .find(emp => emp.id === 71); // Taro Tanaka

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
      {/* Quick Actions */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
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
          <Button
            variant={selectedStatus === 'off' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setSelectedStatus('off')}
          >
            <CalendarX className="h-4 w-4" />
            休み
          </Button>
        </div>
        
        {/* Status Comment Input */}
        <div className="max-w-md">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            ステータスコメント (20文字以内)
          </label>
          <div className="flex gap-2">
            <Textarea
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              placeholder="状況や連絡事項を入力..."
              maxLength={20}
              className="resize-none flex-1"
              rows={1}
            />
            <Button 
              size="sm"
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending}
              className="px-4"
            >
              {updateStatusMutation.isPending ? '更新中...' : '更新'}
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {statusComment.length}/20文字
          </div>
        </div>
      </div>

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




    </div>
  );
}
