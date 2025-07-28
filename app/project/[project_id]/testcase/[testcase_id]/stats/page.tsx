'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Activity, 
  TrendingUp, 
  Users, 
  Calendar,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  User,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface TestCaseStatsPageProps {
  params: Promise<{ 
    project_id: string
    testcase_id: string 
  }>
}

export default function TestCaseStatsPage({ params }: TestCaseStatsPageProps) {
  const { fetchWithAuth } = useAuth()
  const { project_id, testcase_id } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetchWithAuth(`/api/test-cases/${testcase_id}/stats`)
        if (response.ok) {
          const statsData = await response.json()
          setData(statsData)
        }
      } catch (error) {
        console.error('Error fetching test case stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [testcase_id, fetchWithAuth])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Đang tải thống kê...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center">Không thể tải thống kê test case</div>
      </div>
    )
  }

  const { test_case, stats, execution_history, tester_stats, trend_data, assigned_testers } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/project/${project_id}/testcase/${testcase_id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại chi tiết
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{test_case.hang_muc}</h1>
            <p className="text-sm text-muted-foreground">Thống kê chi tiết test case</p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_executions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.remaining_executions} còn lại
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.pass_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.passed_executions} passed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed_executions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_executions > 0 ? Math.round((stats.failed_executions / stats.total_executions) * 100) : 0}% tổng số
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {test_case.so_lan_phai_test} lần yêu cầu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unique_testers}</div>
            <p className="text-xs text-muted-foreground">
              {assigned_testers.length} được assign
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Tiến độ Test Case
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Hoàn thành</span>
              <span>{stats.completion_rate}%</span>
            </div>
            <Progress value={stats.completion_rate} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-center flex-wrap">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm">Passed</span>
                </div>
                <div className="font-semibold text-sm sm:text-base">{stats.passed_executions}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center flex-wrap">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm">Failed</span>
                </div>
                <div className="font-semibold text-sm sm:text-base">{stats.failed_executions}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center flex-wrap">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm">Remaining</span>
                </div>
                <div className="font-semibold text-sm sm:text-base">{stats.remaining_executions}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed stats */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="history">Lịch sử thực thi</TabsTrigger>
          <TabsTrigger value="testers">Thống kê Tester</TabsTrigger>
          <TabsTrigger value="trends">Xu hướng</TabsTrigger>
          <TabsTrigger value="assignments">Phân công</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Lịch sử thực thi gần đây
              </CardTitle>
              <CardDescription>
                20 lần thực thi gần nhất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {execution_history.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Chưa có lịch sử thực thi
                  </div>
                ) : (
                  execution_history.map((execution: any, index: number) => (
                    <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {execution.loi ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          <Badge variant={execution.loi ? 'destructive' : 'default'}>
                            {execution.loi ? 'Failed' : 'Passed'}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium">{execution.tester_name || 'Unknown Tester'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(execution.execution_date).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {execution.cam_nhan && (
                          <p className="text-sm text-green-600 mb-1">✓ {execution.cam_nhan}</p>
                        )}
                        {execution.loi && (
                          <p className="text-sm text-red-600">✗ {execution.loi}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Thống kê theo Tester
              </CardTitle>
              <CardDescription>
                Hiệu suất của từng tester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tester_stats.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Chưa có dữ liệu tester
                  </div>
                ) : (
                  tester_stats.map((tester: any, index: number) => {
                    const passRate = tester.total_executions > 0 
                      ? Math.round((tester.passed_executions / tester.total_executions) * 100) 
                      : 0;
                    
                    return (
                      <div key={tester.tester_email} className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{tester.tester_name}</p>
                              <p className="text-sm text-muted-foreground">{tester.tester_email}</p>
                            </div>
                          </div>
                          <Badge variant={passRate >= 80 ? 'default' : passRate >= 50 ? 'secondary' : 'destructive'}>
                            {passRate}% pass rate
                          </Badge>
                        </div>
                        <Progress value={passRate} className="h-2" />
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{tester.total_executions}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{tester.passed_executions}</div>
                            <div className="text-xs text-muted-foreground">Passed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-red-600">{tester.failed_executions}</div>
                            <div className="text-xs text-muted-foreground">Failed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-600">
                              {tester.last_execution ? new Date(tester.last_execution).toLocaleDateString('vi-VN') : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">Last Test</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Xu hướng thực thi (30 ngày qua)
              </CardTitle>
              <CardDescription>
                Biểu đồ pass/fail theo ngày
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trend_data.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Chưa có dữ liệu xu hướng
                  </div>
                ) : (
                  trend_data.map((day: any) => {
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
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Danh sách Tester được phân công
              </CardTitle>
              <CardDescription>
                Các tester được assign cho test case này
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assigned_testers.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p>Chưa có tester nào được phân công</p>
                  </div>
                ) : (
                  assigned_testers.map((assignment: any) => (
                    <div key={assignment.tester_email} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{assignment.tester_name}</p>
                          <p className="text-sm text-muted-foreground">{assignment.tester_email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Assigned: {new Date(assignment.assigned_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}