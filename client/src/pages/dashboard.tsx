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
  MessageSquare
} from 'lucide-react';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
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
      setIsStatusDialogOpen(false);
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
    .find(emp => emp.id === 2); // Hanako Sato

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
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">

              <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center p-4 h-auto space-y-2"
                  >
                    <Edit className="h-6 w-6 text-green-600" />
                    <span className="text-sm">ステータス変更</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>ステータス変更</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">現在のステータス</label>
                      {currentUser?.status && (
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={currentUser.status.status as StatusType} />
                          {currentUser.status.comment && (
                            <span className="text-sm text-gray-600">
                              - {currentUser.status.comment}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">新しいステータス</label>
                      <Select value={selectedStatus} onValueChange={(value: StatusType) => setSelectedStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_TYPES).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className={`w-3 h-3 rounded-full ${value.bgColor}`}
                                ></div>
                                <span>{value.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsStatusDialogOpen(false);
                          setStatusComment('');
                        }}
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={handleStatusUpdate}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? '更新中...' : '更新'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto space-y-2"
                asChild
              >
                <a href="/attendance">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                  <span className="text-sm">ステータス履歴</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
