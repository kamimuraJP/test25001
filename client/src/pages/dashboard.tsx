import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type DepartmentWithEmployees, type StatusType } from '@shared/schema';
import { DepartmentCard } from '@/components/department-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('on-site');
  const [statusComment, setStatusComment] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StatusType | null>(null);
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
      setIsDialogOpen(false);
      setPendingStatus(null);
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "ステータス更新に失敗しました",
        variant: "destructive",
      });
    },
  });



  const handleStatusClick = (status: StatusType) => {
    setPendingStatus(status);
    setSelectedStatus(status);
    setIsDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (statusComment.length > 20) {
      toast({
        title: "エラー",
        description: "コメントは20文字以内で入力してください",
        variant: "destructive",
      });
      return;
    }
    if (!pendingStatus) return;
    
    updateStatusMutation.mutate({
      status: pendingStatus,
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

  // Calculate status statistics
  const statusStats = departments?.reduce((stats, dept) => {
    dept.employees.forEach(emp => {
      const status = emp.status?.status || 'off';
      stats[status] = (stats[status] || 0) + 1;
    });
    return stats;
  }, {} as Record<string, number>);

  // Prepare chart data
  const chartData = Object.entries(statusStats || {}).map(([status, count]) => ({
    name: STATUS_TYPES[status as StatusType]?.label || status,
    value: count,
    color: STATUS_TYPES[status as StatusType]?.chartColor || '#8884d8',
  }));

  const totalEmployees = chartData.reduce((sum, item) => sum + item.value, 0);

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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">自分のステータス</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => handleStatusClick('on-site')}
          >
            <Building className="h-4 w-4" />
            在席
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => handleStatusClick('absent')}
          >
            <UserX className="h-4 w-4" />
            離席
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => handleStatusClick('out')}
          >
            <MapPin className="h-4 w-4" />
            外出中
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => handleStatusClick('remote')}
          >
            <Home className="h-4 w-4" />
            テレワーク
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => handleStatusClick('off')}
          >
            <CalendarX className="h-4 w-4" />
            休み
          </Button>
        </div>
      </div>

      {/* Status Statistics */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ステータス統計</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}人`, '人数']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-2">詳細統計</div>
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {item.value}人 ({totalEmployees > 0 ? ((item.value / totalEmployees) * 100).toFixed(1) : 0}%)
                </div>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">合計</span>
                <span className="text-sm font-medium text-gray-900">{totalEmployees}人</span>
              </div>
            </div>
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

      {/* Status Comment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              ステータス変更: {pendingStatus && STATUS_TYPES[pendingStatus]?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                コメント (20文字以内、任意)
              </label>
              <Textarea
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="状況や連絡事項を入力..."
                maxLength={20}
                className="resize-none"
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">
                {statusComment.length}/20文字
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setStatusComment('');
                setPendingStatus(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? '更新中...' : 'ステータス更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
