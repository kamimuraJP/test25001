import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate, formatTime } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { StatusBadge } from '@/components/status-badge';

export default function AttendanceHistory() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Show employee status history instead of attendance records
  const { data: employeeStatuses = [], isLoading } = useQuery({
    queryKey: ['/api/employee-statuses'],
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-900">ステータス履歴</h1>
        <p className="text-gray-600 mt-1">全社員の現在のステータスを確認できます</p>
      </div>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Calendar Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">フィルター</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ja}
                  className="rounded-md border"
                />
                
                <div className="mt-4 space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, 'yyyy年M月', { locale: ja })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        locale={ja}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Records Section */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  現在のステータス一覧
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>社員ID</TableHead>
                          <TableHead>ステータス</TableHead>
                          <TableHead>コメント</TableHead>
                          <TableHead>最終更新</TableHead>
                          <TableHead>場所</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeStatuses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              ステータス記録がありません
                            </TableCell>
                          </TableRow>
                        ) : (
                          employeeStatuses.map((status: any) => (
                            <TableRow key={status.id}>
                              <TableCell className="font-medium">
                                {status.employeeId}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={status.status} size="sm" />
                              </TableCell>
                              <TableCell className="max-w-32 truncate">
                                {status.comment || '-'}
                              </TableCell>
                              <TableCell>
                                {status.lastUpdated ? formatTime(status.lastUpdated) : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {status.location || '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}