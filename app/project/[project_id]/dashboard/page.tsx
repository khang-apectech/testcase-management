"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  TestTube, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Target,
  AlertTriangle
} from "lucide-react";

interface ProjectStats {
  total_test_cases: number;
  passed_test_cases: number;
  failed_test_cases: number;
  pending_test_cases: number;
  total_testers: number;
  active_testers: number;
  total_executions: number;
  total_passed_executions: number;
  total_failed_executions: number;
  completion_rate: number;
  pass_rate: number;
  platform_stats: Array<{
    platform: string;
    total_cases: number;
    passed_cases: number;
    failed_cases: number;
  }>;
  priority_stats: Array<{
    priority: string;
    total_cases: number;
    passed_cases: number;
    failed_cases: number;
  }>;
  trend_data: Array<{
    date: string;
    passed: number;
    failed: number;
    total: number;
  }>;
}

interface RecentActivity {
  id: string;
  type: "test_case_created" | "test_case_executed" | "tester_assigned";
  description: string;
  user: string;
  timestamp: string;
}

export default function ProjectDashboard() {
  const params = useParams();
  const projectId = params.project_id as string;
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const activitiesPerPage = 10;

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetch(`/api/project/${projectId}/stats`),
        fetch(`/api/project/${projectId}/activities`)
      ]);

      const statsData = await statsResponse.json();
      const activitiesData = await activitiesResponse.json();

      setStats(statsData);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
    } catch (error) {
      console.error("Error fetching project data:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and pagination logic for activities
  const filteredActivities = Array.isArray(activities) ? activities.filter(activity => {
    if (activityFilter === "all") return true;
    return activity.type === activityFilter;
  }) : [];

  const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);
  const startIndex = (currentPage - 1) * activitiesPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + activitiesPerPage);

  if (loading) {
    return <div className="flex justify-center p-8">Đang tải...</div>;
  }

  if (!stats) {
    return <div className="flex justify-center p-8">Lỗi khi tải dữ liệu dự án</div>;
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold">Dashboard Dự án</h1>
          <p className="text-gray-600">Tổng quan về tiến độ và hoạt động của dự án</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Test Case Mới
          </Button>
          <Button className="w-full sm:w-auto">
            <Users className="w-4 h-4 mr-2" />
            Phân công Tester
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Test Cases</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_test_cases}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completion_rate}% hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành công</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passed_test_cases}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_test_cases > 0 ? Math.round((stats.passed_test_cases / stats.total_test_cases) * 100) : 0}% tổng số
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed_test_cases}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_test_cases > 0 ? Math.round((stats.failed_test_cases / stats.total_test_cases) * 100) : 0}% tổng số
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lần thực thi</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total_executions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pass_rate}% tỷ lệ thành công
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_testers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_testers} hoạt động 7 ngày qua
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Tiến độ Dự án
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Hoàn thành</span>
              <span>{stats.completion_rate}%</span>
            </div>
            <Progress value={stats.completion_rate} className="h-3" />
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-center flex-wrap">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm">Passed</span>
                </div>
                <div className="font-semibold text-sm sm:text-base">{stats.passed_test_cases}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center flex-wrap">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm">Thất bại</span>
                </div>
                <div className="font-semibold text-sm sm:text-base">{stats.failed_test_cases}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center flex-wrap">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm">Pending</span>
                </div>
                <div className="font-semibold text-sm sm:text-base">{stats.pending_test_cases}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Thống kê theo Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.platform_stats && stats.platform_stats.length > 0 ? (
                stats.platform_stats.map((platform, index) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
                  const color = colors[index % colors.length];
                  const passRate = platform.total_cases > 0 
                    ? Math.round((platform.passed_cases / platform.total_cases) * 100) 
                    : 0;
                  
                  return (
                    <div key={platform.platform} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${color} rounded-full`}></div>
                          <span className="font-medium">
                            {platform.platform === 'web' && '🌐 Web'}
                            {platform.platform === 'app' && '📱 Mobile App'}
                            {platform.platform === 'cms' && '⚙️ CMS'}
                            {platform.platform === 'server' && '🖥️ Server'}
                            {!['web', 'app', 'cms', 'server'].includes(platform.platform) && platform.platform}
                          </span>
                        </div>
                        <span className="text-muted-foreground">{passRate}% pass</span>
                      </div>
                      <Progress value={passRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Thành công: {platform.passed_cases}</span>
                        <span>Thất bại: {platform.failed_cases}</span>
                        <span>Tổng: {platform.total_cases}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Chưa có dữ liệu platform
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Priority Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Thống kê theo Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.priority_stats && stats.priority_stats.length > 0 ? (
                stats.priority_stats.map((priority, index) => {
                  const priorityColors = {
                    'critical': 'bg-red-600',
                    'high': 'bg-red-500',
                    'medium': 'bg-yellow-500',
                    'low': 'bg-green-500'
                  };
                  const color = priorityColors[priority.priority as keyof typeof priorityColors] || 'bg-gray-500';
                  const passRate = priority.total_cases > 0 
                    ? Math.round((priority.passed_cases / priority.total_cases) * 100) 
                    : 0;
                  
                  return (
                    <div key={priority.priority} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${color} rounded-full`}></div>
                          <span className="font-medium capitalize">
                            {priority.priority === 'critical' && '🔴 Critical'}
                            {priority.priority === 'high' && '🟠 High'}
                            {priority.priority === 'medium' && '🟡 Medium'}
                            {priority.priority === 'low' && '🟢 Low'}
                            {!['critical', 'high', 'medium', 'low'].includes(priority.priority) && priority.priority}
                          </span>
                        </div>
                        <span className="text-muted-foreground">{passRate}% pass</span>
                      </div>
                      <Progress value={passRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Thành công: {priority.passed_cases}</span>
                        <span>Thất bại: {priority.failed_cases}</span>
                        <span>Tổng: {priority.total_cases}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Chưa có dữ liệu priority
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      {stats.trend_data && stats.trend_data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Xu hướng Test Execution (7 ngày qua)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.trend_data.map((day, index) => {
                const passRate = day.total > 0 ? Math.round((day.passed / day.total) * 100) : 0;
                return (
                  <div key={day.date} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {new Date(day.date).toLocaleDateString('vi-VN')}
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-green-600">✓ {day.passed}</span>
                        <span className="text-red-600">✗ {day.failed}</span>
                        <span className="text-muted-foreground">({passRate}%)</span>
                      </div>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                      <div 
                        className="bg-green-500 transition-all duration-300"
                        style={{ width: `${day.total > 0 ? (day.passed / day.total) * 100 : 0}%` }}
                      ></div>
                      <div 
                        className="bg-red-500 transition-all duration-300"
                        style={{ width: `${day.total > 0 ? (day.failed / day.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Hoạt động Gần đây</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={activityFilter} onValueChange={(value) => {
                setActivityFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Lọc hoạt động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả hoạt động</SelectItem>
                  <SelectItem value="test_case_created">Test case tạo mới</SelectItem>
                  <SelectItem value="test_case_executed">Test case thực thi</SelectItem>
                  <SelectItem value="tester_assigned">Phân công tester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không có hoạt động nào
              </div>
            ) : (
              paginatedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {activity.type === "test_case_created" && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  {activity.type === "test_case_executed" && (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  {activity.type === "tester_assigned" && (
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    bởi {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Hiển thị {startIndex + 1}-{Math.min(startIndex + activitiesPerPage, filteredActivities.length)} trong {filteredActivities.length} hoạt động
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      </div>
                    ))
                  }
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}