'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Eye, Edit, Play, Target, User, Calendar, Activity, TrendingUp, Search, Filter, ChevronLeft, ChevronRight, Users, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { AssignTesters } from '@/components/test-cases/assign-testers'

interface TestCasePageProps {
  params: Promise<{ project_id: string }>
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
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getCardBorderColor(status: string, priority: string) {
  if (status?.toLowerCase() === 'passed') return 'border-l-green-400 hover:border-l-green-600'
  if (status?.toLowerCase() === 'failed') return 'border-l-red-400 hover:border-l-red-600'
  if (priority?.toLowerCase() === 'high') return 'border-l-red-400 hover:border-l-red-600'
  if (priority?.toLowerCase() === 'medium') return 'border-l-yellow-400 hover:border-l-yellow-600'
  return 'border-l-blue-400 hover:border-l-blue-600'
}

export default function TestCasePage({ params }: TestCasePageProps) {
  const { fetchWithAuth, user } = useAuth()
  const [testCases, setTestCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  
  // Unwrap params using React.use()
  const { project_id: projectId } = use(params)
  
  const fetchTestCases = async () => {
    try {
      console.log('Fetching test cases for project:', projectId)
      const response = await fetchWithAuth(`/api/projects/${projectId}/test-cases`)
      console.log('API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Test cases received:', data)
        setTestCases(data)
      } else {
        const errorData = await response.json()
        console.error('API error:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching test cases:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchTestCases()
  }, [projectId, fetchWithAuth])

  // Filter and pagination logic
  const filteredTestCases = testCases.filter(testCase => {
    const matchesSearch = testCase.hang_muc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testCase.tinh_nang?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || testCase.priority === priorityFilter
    const matchesPlatform = platformFilter === 'all' || testCase.platform === platformFilter
    const matchesStatus = statusFilter === 'all' || testCase.current_status === statusFilter
    
    return matchesSearch && matchesPriority && matchesPlatform && matchesStatus
  })

  const totalPages = Math.ceil(filteredTestCases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTestCases = filteredTestCases.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Danh sách Test Cases</h1>
          <p className="text-muted-foreground">
            Quản lý và thực thi các test case trong dự án này
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>Tổng số: {testCases.length}</span>
            <span>•</span>
            <span>Hiển thị: {filteredTestCases.length}</span>
            <span>•</span>
            <span>Đã thực thi: {testCases.filter(tc => tc.total_executions > 0).length}</span>
          </div>
        </div>
        {user?.role === 'admin' && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href={`/project/${projectId}/testcase/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo Test Case mới
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm kiếm test case..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        
        <Select value={platformFilter} onValueChange={(value) => {
          setPlatformFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả platform</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="app">Mobile App</SelectItem>
            <SelectItem value="cms">CMS</SelectItem>
            <SelectItem value="server">Server</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(value) => {
          setPriorityFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Độ ưu tiên" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="critical">Quan trọng</SelectItem>
            <SelectItem value="high">Cao</SelectItem>
            <SelectItem value="medium">Trung bình</SelectItem>
            <SelectItem value="low">Thấp</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="not_executed">Chưa thực thi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredTestCases.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {user?.role === 'admin' ? 'No test cases found' : 'No test cases assigned'}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {user?.role === 'admin' 
                    ? 'Create your first test case to get started.'
                    : 'No test cases have been assigned to you in this project.'
                  }
                </p>
                {user?.role === 'admin' && (
                  <Button asChild className="mt-4">
                    <Link href={`/project/${projectId}/testcase/new`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Test Case
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          paginatedTestCases.map((testCase: any) => (
            <Card key={testCase.id} className={`hover:shadow-lg transition-all duration-300 border-l-4 ${getCardBorderColor(testCase.current_status, testCase.priority)}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">
                      <Link 
                        href={`/project/${projectId}/testcase/${testCase.id}`}
                        className="hover:underline text-blue-700 hover:text-blue-900"
                      >
                        {testCase.hang_muc || testCase.title || 'Chưa có tiêu đề'}
                      </Link>
                    </CardTitle>
                    {testCase.tinh_nang && (
                      <div className="text-sm text-gray-700 bg-blue-50 px-3 py-1 rounded-md border-l-4 border-blue-400">
                        <span className="font-medium">Tính năng:</span> {testCase.tinh_nang}
                      </div>
                    )}
                    <CardDescription className="text-gray-600">
                      {testCase.description || 'Chưa có mô tả chi tiết'}
                    </CardDescription>
                    
                    {/* New fields preview */}
                    <div className="space-y-2 mt-3">
                      {testCase.preconditions && (
                        <div className="text-sm bg-amber-50 px-3 py-2 rounded-md border-l-4 border-amber-400">
                          <span className="font-medium text-amber-800">Điều kiện tiên quyết:</span>
                          <pre className="text-amber-700 mt-1 whitespace-pre-wrap text-xs">
                            {testCase.preconditions}
                          </pre>
                        </div>
                      )}
                      
                      {testCase.steps && (
                        <div className="text-sm bg-green-50 px-3 py-2 rounded-md border-l-4 border-green-400">
                          <span className="font-medium text-green-800">Các bước thực hiện:</span>
                          <pre className="text-green-700 mt-1 whitespace-pre-wrap text-xs">
                            {testCase.steps}
                          </pre>
                        </div>
                      )}
                      
                      {testCase.expected_result && (
                        <div className="text-sm bg-purple-50 px-3 py-2 rounded-md border-l-4 border-purple-400">
                          <span className="font-medium text-purple-800">Kết quả mong đợi:</span>
                          <pre className="text-purple-700 mt-1 whitespace-pre-wrap text-xs">
                            {testCase.expected_result}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getPriorityColor(testCase.priority)}>
                      {testCase.priority || 'Medium'}
                    </Badge>
                    <Badge className={getStatusColor(testCase.current_status)}>
                      {testCase.current_status === 'not_executed' ? 'Chưa thực thi' : 
                       testCase.current_status === 'passed' ? 'Passed' :
                       testCase.current_status === 'failed' ? 'Failed' : 'Pending'}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50">
                      {testCase.platform === 'web' && '🌐 Web'}
                      {testCase.platform === 'app' && '📱 Mobile App'}
                      {testCase.platform === 'cms' && '⚙️ CMS'}
                      {testCase.platform === 'server' && '🖥️ Server'}
                      {!testCase.platform && '🌐 Web'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Key Metrics Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800">Số lần test</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900">
                        {testCase.so_lan_phai_test || 1}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-800">Đã thực thi</span>
                      </div>
                      <div className="text-lg font-bold text-green-900">
                        {testCase.total_executions || 0}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-800">Tester</span>
                      </div>
                      <div className="text-lg font-bold text-purple-900">
                        {testCase.assigned_tester_count || 0}
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-800">Tiến độ</span>
                      </div>
                      <div className="text-lg font-bold text-orange-900 mb-2">
                        {testCase.so_lan_phai_test ? 
                          Math.round(((testCase.total_executions || 0) / testCase.so_lan_phai_test) * 100) : 0}%
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${testCase.so_lan_phai_test ? 
                              Math.min(((testCase.total_executions || 0) / testCase.so_lan_phai_test) * 100, 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Pass/Fail Statistics */}
                  {testCase.total_executions > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-800">Passed</span>
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          {testCase.passed_executions || 0}
                        </div>
                        <div className="text-xs text-green-700">
                          {testCase.total_executions > 0 ? 
                            Math.round(((testCase.passed_executions || 0) / testCase.total_executions) * 100) : 0}%
                        </div>
                      </div>
                      
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-xs font-medium text-red-800">Failed</span>
                        </div>
                        <div className="text-lg font-bold text-red-900">
                          {testCase.failed_executions || 0}
                        </div>
                        <div className="text-xs text-red-700">
                          {testCase.total_executions > 0 ? 
                            Math.round(((testCase.failed_executions || 0) / testCase.total_executions) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Info Row */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t border-gray-100">
                    {testCase.created_at && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Tạo lúc:</span>
                        <span>{new Date(testCase.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                    {testCase.updated_at && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Cập nhật:</span>
                        <span>{new Date(testCase.updated_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                    <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 hover:border-blue-300">
                      <Link href={`/project/${projectId}/testcase/${testCase.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Xem chi tiết
                      </Link>
                    </Button>
                    {testCase.total_executions > 0 && (
                      <Button variant="outline" size="sm" asChild className="hover:bg-purple-50 hover:border-purple-300">
                        <Link href={`/project/${projectId}/testcase/${testCase.id}/stats`}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Thống kê
                        </Link>
                      </Button>
                    )}
                    {user?.role === 'admin' && (
                      <>
                        <Button variant="outline" size="sm" asChild className="hover:bg-orange-50 hover:border-orange-300">
                          <Link href={`/project/${projectId}/testcase/${testCase.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </Link>
                        </Button>
                        <AssignTesters 
                          testCaseId={testCase.id} 
                          projectId={projectId}
                          onAssigned={() => {
                            // Reload test cases to get updated assignments
                            fetchTestCases()
                          }}
                        />
                      </>
                    )}
                    <Button size="sm" asChild className="bg-green-600 hover:bg-green-700 shadow-sm">
                      <Link href={`/project/${projectId}/testcase/${testCase.id}/execute`}>
                        <Play className="mr-2 h-4 w-4" />
                        Thực thi ngay
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTestCases.length)} trong {filteredTestCases.length} kết quả
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
    </div>
  )
}