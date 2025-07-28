"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Play,
  FileText,
  Target,
  User,
  Clock,
  Bug,
  MessageSquare,
  TrendingUp
} from 'lucide-react'

interface TestCase {
  id: string
  title?: string
  hang_muc: string
  description?: string
  tinh_nang: string
  so_lan_phai_test: number
  preconditions?: string
  steps?: string
  expected_result?: string
  priority?: string
  status?: string
  assigned_tester_name?: string
}

interface ExecutionFormProps {
  projectId: string
  testCase: TestCase
}

export function ExecutionForm({ projectId, testCase }: ExecutionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    so_lan_da_test: 1,
    cam_nhan: '',
    loi: '',
    status: 'passed' as 'passed' | 'failed' | 'blocked',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cam_nhan && !formData.loi) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập cảm nhận hoặc báo cáo lỗi",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/projects/${projectId}/test-cases/${testCase.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test execution recorded successfully",
        })
        router.push(`/project/${projectId}/testcase/${testCase.id}`)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to record test execution",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error recording execution:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'blocked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Calculate progress
  const progressPercentage = Math.round((formData.so_lan_da_test / testCase.so_lan_phai_test) * 100)

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'blocked':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Test Case Overview */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="h-5 w-5" />
            Thông tin Test Case
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold text-xl text-blue-900">{testCase.hang_muc || testCase.title}</h3>
            {(testCase.tinh_nang || testCase.description) && (
              <p className="text-blue-700 mt-2">{testCase.tinh_nang || testCase.description}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <Label className="text-sm font-medium text-blue-900">Số lần phải test</Label>
                <Badge variant="outline" className="mt-1 bg-white">
                  {testCase.so_lan_phai_test} lần
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
              <User className="h-4 w-4 text-blue-600" />
              <div>
                <Label className="text-sm font-medium text-blue-900">Tester phụ trách</Label>
                <Badge variant="outline" className="mt-1 bg-white">
                  {testCase.assigned_tester_name || 'Chưa phân công'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <Label className="text-sm font-medium text-blue-900">Tiến độ hiện tại</Label>
                <div className="mt-1">
                  <Progress value={progressPercentage} className="h-2" />
                  <span className="text-xs text-blue-700">{progressPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Case Details for Reference */}
      <div className="grid gap-6 lg:grid-cols-2">
        {testCase.preconditions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Điều kiện tiên quyết
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap text-orange-800">
                  {testCase.preconditions}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {testCase.steps && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-500" />
                Các bước thực hiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap text-blue-800">
                  {testCase.steps}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {testCase.expected_result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Kết quả mong đợi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap text-green-800">
                {testCase.expected_result}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Form */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Play className="h-5 w-5" />
            Ghi nhận kết quả thực thi
          </CardTitle>
          <CardDescription>
            Ghi lại kết quả và nhận xét sau khi thực hiện test case
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="so_lan_da_test" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Lần thực hiện *
                </Label>
                <Select 
                  value={formData.so_lan_da_test.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, so_lan_da_test: parseInt(value) }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: testCase.so_lan_phai_test }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Lần {num} / {testCase.so_lan_phai_test}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Kết quả *
                </Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value: 'passed' | 'failed' | 'blocked') => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Passed - Test thành công</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>Failed - Test thất bại</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="blocked">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span>Blocked - Bị chặn</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="cam_nhan" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Cảm nhận và nhận xét
              </Label>
              <Textarea
                id="cam_nhan"
                value={formData.cam_nhan}
                onChange={(e) => setFormData(prev => ({ ...prev, cam_nhan: e.target.value }))}
                placeholder="Chia sẻ cảm nhận, nhận xét của bạn về test case này..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Mô tả chi tiết quá trình thực hiện, những điều bạn nhận thấy...
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loi" className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-500" />
                Báo cáo lỗi (nếu có)
              </Label>
              <Textarea
                id="loi"
                value={formData.loi}
                onChange={(e) => setFormData(prev => ({ ...prev, loi: e.target.value }))}
                placeholder="Mô tả chi tiết lỗi nếu phát hiện..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Ghi rõ các bước tái hiện lỗi, ảnh hưởng, mức độ nghiêm trọng...
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Vui lòng kiểm tra kỹ trước khi lưu</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className={`min-w-[160px] ${
                    formData.status === 'passed' ? 'bg-green-600 hover:bg-green-700' :
                    formData.status === 'failed' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {getStatusIcon(formData.status)}
                  <span className="ml-2">Lưu kết quả</span>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}