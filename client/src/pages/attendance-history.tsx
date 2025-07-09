import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type AttendanceRecord } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';
import { useToast } from '@/hooks/use-toast';
import { formatTime, formatDate, formatWorkHours, downloadCSV } from '@/lib/utils';
import { type StatusType } from '@/lib/constants';
import { Download, Edit } from 'lucide-react';

export default function AttendanceHistory() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const { toast } = useToast();

  const { data: attendanceRecords, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/employees/1/attendance', { year: selectedYear, month: selectedMonth }],
  });

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch(
        `/api/employees/1/attendance/export?year=${selectedYear}&month=${selectedMonth}`
      );
      
      if (!response.ok) throw new Error('Failed to download CSV');
      
      const csvData = await response.text();
      downloadCSV(csvData, `attendance-${selectedYear}-${selectedMonth}.csv`);
      
      toast({
        title: "ダウンロード完了",
        description: "勤怠データのCSVファイルをダウンロードしました",
      });
    } catch (error) {
      toast({
        title: "ダウンロードエラー",
        description: "CSVファイルのダウンロードに失敗しました",
        variant: "destructive",
      });
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">勤怠履歴</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {month}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleDownloadCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            CSVダウンロード
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedYear}年{selectedMonth}月の勤怠記録
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceRecords && attendanceRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>出社時刻</TableHead>
                    <TableHead>退社時刻</TableHead>
                    <TableHead>勤務時間</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell>
                        {formatDate(record.date)}
                      </TableCell>
                      <TableCell>
                        {record.clockInTime ? formatTime(record.clockInTime) : '-'}
                      </TableCell>
                      <TableCell>
                        {record.clockOutTime ? formatTime(record.clockOutTime) : '-'}
                      </TableCell>
                      <TableCell>
                        {record.workHours ? formatWorkHours(record.workHours) : '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={record.status as StatusType} size="sm" />
                        {record.isModified && (
                          <span className="ml-2 text-xs text-orange-600">
                            (修正済み)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              この期間の勤怠記録はありません
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {attendanceRecords && attendanceRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {attendanceRecords.filter(r => r.clockInTime).length}
                </div>
                <div className="text-sm text-gray-600">出勤日数</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(
                    attendanceRecords
                      .filter(r => r.workHours)
                      .reduce((sum, r) => sum + (r.workHours || 0), 0) / 60
                  )}
                </div>
                <div className="text-sm text-gray-600">総勤務時間</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {attendanceRecords.filter(r => r.status === 'remote').length}
                </div>
                <div className="text-sm text-gray-600">テレワーク日数</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
