'use client'

import { Suspense, useEffect, useState, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Edit, 
  Play, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Target,
  Settings,
  Activity,
  TrendingUp,
  Copy,
  Share2,
  Shield,
  ListChecks,
  CheckSquare
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { AssignTesters } from '@/components/test-cases/assign-testers'

interface TestCaseDetailPageProps {
  params: Promise<{ 
    project_id: string
    testcase_id: string 
  }>
}



function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'passed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'pending':
    case 'not_executed':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case 'passed':
      return <CheckCircle className="h-3 w-3" />
    case 'failed':
      return <XCircle className="h-3 w-3" />
    case 'in_progress':
      return <Clock className="h-3 w-3" />
    default:
      return <Clock className="h-3 w-3" />
  }
}

function getStatusText(status: string) {
  switch (status?.toLowerCase()) {
    case 'passed':
      return 'Đã Pass'
    case 'failed':
      return 'Failed'
    case 'in_progress':
      return 'Đang thực hiện'
    case 'pending':
      return 'Chờ thực hiện'
    default:
      return 'Chưa thực hiện'
  }
}

function getPriorityText(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return 'Quan trọng'
    case 'high':
      return 'Cao'
    case 'medium':
      return 'Trung bình'
    case 'low':
      return 'Thấp'
    default:
      return 'Trung bình'
  }
}

export default function TestCaseDetailPage({ params }: TestCaseDetailPageProps) {
  const { fetchWithAuth, user } = useAuth()
  const { project_id, testcase_id } = use(params)
  const [testCase, setTestCase] = useState<any>(null)
  const [executions, setExecutions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testCaseResponse, executionsResponse] = await Promise.all([
          fetchWithAuth(`/api/projects/${project_id}/test-cases/${testcase_id}`),
          fetchWithAuth(`/api/projects/${project_id}/test-cases/${testcase_id}/executions`)
        ])

        if (testCaseResponse.ok) {
          const testCaseData = await testCaseResponse.json()
          setTestCase(testCaseData)
        }

        if (executionsResponse.ok) {
          const executionsData = await executionsResponse.json()
          setExecutions(executionsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [project_id, testcase_id, fetchWithAuth])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Đang tải...</div>
      </div>
    )
  }

  if (!testCase) {
    notFound()
  }

  // Calculate execution statistics
  const totalExecutions = executions.length
  const passedExecutions = executions.filter((e: any) => e.status === 'passed').length
  const failedExecutions = executions.filter((e: any) => e.status === 'failed').length
  const successRate = totalExecutions > 0 ? Math.round((passedExecutions / totalExecutions) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/project/${project_id}/testcase`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{testCase.hang_muc || testCase.title}</h1>
            <p className="text-sm text-muted-foreground">Chi tiết test case</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" />
            Copy ID
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/project/${project_id}/testcase/${testcase_id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>
          {user?.role === 'admin' && (
            <AssignTesters 
              testCaseId={testcase_id} 
              projectId={project_id}
              onAssigned={() => {
                // Reload test case data to get updated assignments
                window.location.reload()
              }}
            />
          )}
          <Button asChild>
            <Link href={`/project/${project_id}/testcase/${testcase_id}/execute`}>
              <Play className="mr-2 h-4 w-4" />
              Thực thi Test
            </Link>
          </Button>
        </div>
      </div>

      {/* Status and Priority Badges */}
      <div className="flex items-center gap-3">
        <Badge className={getStatusColor(testCase.status)} variant="outline">
          {getStatusIcon(testCase.status)}
          <span className="ml-1">{getStatusText(testCase.status)}</span>
        </Badge>
        <Badge className={getPriorityColor(testCase.priority)} variant="outline">
          <Target className="mr-1 h-3 w-3" />
          {getPriorityText(testCase.priority)} Priority
        </Badge>
        {testCase.assigned_tester && (
          <Badge variant="secondary">
            <User className="mr-1 h-3 w-3" />
            {testCase.assigned_tester}
          </Badge>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng lần test</p>
                <p className="text-2xl font-bold">{totalExecutions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">{passedExecutions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failedExecutions}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tỷ lệ thành công</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Chi tiết
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Lịch sử thực thi
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Phân tích
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Cài đặt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Thông tin Test Case
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Tính năng
                    </h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm">
                        {testCase.tinh_nang || testCase.description || 'Chưa có mô tả'}
                      </p>
                    </div>
                  </div>

                  {testCase.so_lan_phai_test && (
                    <div>
                      <h4 className="font-semibold mb-2">Số lần phải test</h4>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {testCase.so_lan_phai_test} lần
                      </Badge>
                    </div>
                  )}

                  {testCase.preconditions && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        Điều kiện tiên quyết
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap text-blue-800">
                          {testCase.preconditions}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-gray-600" />
                      Các bước thực hiện
                    </h4>
                    <div className="bg-gray-50 border p-4 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap">
                        {testCase.steps || 'Chưa có các bước thực hiện'}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-green-600" />
                      Kết quả mong đợi
                    </h4>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap text-green-800">
                        {testCase.expected_result || 'Chưa có kết quả mong đợi'}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin chi tiết</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {testCase.assigned_testers && testCase.assigned_testers.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium">Tester được phân công ({testCase.assigned_testers.length})</p>
                      </div>
                      <div className="space-y-2">
                        {testCase.assigned_testers.map((tester: any) => (
                          <div key={tester.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <User className="h-4 w-4 text-blue-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{tester.name}</p>
                              <p className="text-xs text-muted-foreground">{tester.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Phân công: {new Date(tester.assigned_at).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {(!testCase.assigned_testers || testCase.assigned_testers.length === 0) && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Chưa có tester được phân công</p>
                        <p className="text-xs text-muted-foreground">Liên hệ admin để phân công tester</p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Ngày tạo</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(testCase.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {testCase.updated_at && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Cập nhật lần cuối</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(testCase.updated_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-sm font-medium mb-3">Thao tác nhanh</p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <Link href={`/project/${project_id}/testcase/${testcase_id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa Test Case
                        </Link>
                      </Button>
                      <Button size="sm" className="w-full justify-start" asChild>
                        <Link href={`/project/${project_id}/testcase/${testcase_id}/execute`}>
                          <Play className="mr-2 h-4 w-4" />
                          Thực thi Test
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Lịch sử thực thi
              </CardTitle>
              <CardDescription>
                Danh sách các lần thực thi test case này
              </CardDescription>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Chưa có lần thực thi nào</p>
                  <Button asChild>
                    <Link href={`/project/${project_id}/testcase/${testcase_id}/execute`}>
                      <Play className="mr-2 h-4 w-4" />
                      Thực thi Test Case đầu tiên
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {executions.map((execution: any, index: number) => (
                    <div key={execution.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(execution.status)}>
                            {getStatusIcon(execution.status)}
                            <span className="ml-1">{getStatusText(execution.status)}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Lần {index + 1}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(execution.executed_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="h-4 w-4" />
                        <span>Thực hiện bởi: {execution.executed_by || 'Không xác định'}</span>
                      </div>
                      {execution.comments && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Cảm nhận:</p>
                          <p className="text-sm">{execution.comments}</p>
                        </div>
                      )}
                      {execution.bug_report && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-red-600 font-medium mb-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Báo cáo lỗi:</span>
                          </div>
                          <p className="text-sm text-red-700">{execution.bug_report}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tỷ lệ thành công</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Tiến độ</span>
                    <span>{successRate}%</span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-green-600 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Passed
                      </div>
                      <div className="text-lg font-bold text-green-700">{passedExecutions}</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-red-600 font-medium">
                        <XCircle className="h-4 w-4" />
                        Failed
                      </div>
                      <div className="text-lg font-bold text-red-700">{failedExecutions}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thống kê thực thi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tổng số lần thực thi</span>
                    <Badge variant="outline">{totalExecutions}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Số lần cần thực hiện</span>
                    <Badge variant="outline">{testCase.so_lan_phai_test}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Còn lại</span>
                    <Badge variant={testCase.so_lan_phai_test - totalExecutions > 0 ? "destructive" : "default"}>
                      {Math.max(0, testCase.so_lan_phai_test - totalExecutions)}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="text-center">
                    {testCase.so_lan_phai_test - totalExecutions > 0 ? (
                      <Button asChild className="w-full">
                        <Link href={`/project/${project_id}/testcase/${testcase_id}/execute`}>
                          <Play className="mr-2 h-4 w-4" />
                          Tiếp tục thực thi
                        </Link>
                      </Button>
                    ) : (
                      <div className="text-green-600 font-medium">
                        ✅ Đã hoàn thành đủ số lần test
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cài đặt Test Case
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái hiện tại</label>
                  <Badge className={getStatusColor(testCase.status)} variant="outline">
                    {getStatusIcon(testCase.status)}
                    <span className="ml-1">{getStatusText(testCase.status)}</span>
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Độ ưu tiên</label>
                  <Badge className={getPriorityColor(testCase.priority)} variant="outline">
                    <Target className="mr-1 h-3 w-3" />
                    {getPriorityText(testCase.priority)}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Thao tác</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button variant="outline" asChild>
                    <Link href={`/project/${project_id}/testcase/${testcase_id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </Link>
                  </Button>
                  <Button variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    Sao chép Test Case
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}