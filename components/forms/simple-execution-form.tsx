"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  hang_muc: string
  tinh_nang?: string
  so_lan_phai_test: number
  dieu_kien_tien_quyet?: string
  cac_buoc_thuc_hien?: string
  ket_qua_mong_doi?: string
  priority?: string
  status?: string
}

interface ExecutionFormProps {
  projectId: string
  testCase: TestCase
}

export function SimpleExecutionForm({ projectId, testCase }: ExecutionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    so_lan_da_test: 1,
    status: '',
    cam_nhan: '',
    loi: ''
  })

  // Calculate progress
  const progressPercentage = Math.round((formData.so_lan_da_test / testCase.so_lan_phai_test) * 100)

  // Helper function to get status color
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        // Show success message
        alert('Đã ghi nhận kết quả thực thi thành công!')
        router.push(`/project/${projectId}/testcase/${testCase.id}`)
      } else {
        throw new Error('Không thể gửi kết quả thực thi')
      }
    } catch (error) {
      console.error('Error submitting execution:', error)
      alert('Có lỗi xảy ra khi ghi nhận kết quả')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Test Case Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                {testCase.hang_muc}
              </CardTitle>
              {testCase.tinh_nang && (
                <CardDescription className="mt-2">
                  <span className="font-medium">Tính năng:</span> {testCase.tinh_nang}
                </CardDescription>
              )}
            </div>
            <Badge className={getStatusColor(testCase.status || 'pending')}>
              {testCase.status || 'Chưa thực thi'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{testCase.so_lan_phai_test}</div>
                <div className="text-sm text-blue-800">Số lần phải test</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formData.so_lan_da_test}</div>
                <div className="text-sm text-green-800">Lần thực thi hiện tại</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{progressPercentage}%</div>
                <div className="text-sm text-orange-800">Tiến độ hoàn thành</div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Tiến độ thực thi</Label>
              <Progress value={progressPercentage} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testCase.dieu_kien_tien_quyet && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-5 w-5" />
                Điều kiện tiên quyết
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {testCase.dieu_kien_tien_quyet}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {testCase.cac_buoc_thuc_hien && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <FileText className="h-5 w-5" />
                Các bước thực hiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {testCase.cac_buoc_thuc_hien}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {testCase.ket_qua_mong_doi && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Kết quả mong đợi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-gray-700 whitespace-pre-wrap">
                {testCase.ket_qua_mong_doi}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-purple-600" />
            Ghi nhận kết quả thực thi
          </CardTitle>
          <CardDescription>
            Vui lòng thực hiện theo các bước hướng dẫn ở trên và ghi nhận kết quả
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Kết quả thực thi *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kết quả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Passed - Thành công</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>Failed - Thất bại</span>
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

              <div className="space-y-2">
                <Label htmlFor="so_lan_da_test">Lần thực thi thứ</Label>
                <Select 
                  value={formData.so_lan_da_test.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, so_lan_da_test: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: testCase.so_lan_phai_test }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Lần thứ {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cam_nhan">Cảm nhận và nhận xét</Label>
              <Textarea
                id="cam_nhan"
                placeholder="Ghi lại cảm nhận, nhận xét về quá trình thực thi..."
                value={formData.cam_nhan}
                onChange={(e) => setFormData(prev => ({ ...prev, cam_nhan: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loi">Báo cáo lỗi (nếu có)</Label>
              <Textarea
                id="loi"
                placeholder="Mô tả chi tiết lỗi gặp phải (nếu có)..."
                value={formData.loi}
                onChange={(e) => setFormData(prev => ({ ...prev, loi: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={!formData.status || loading}
                className={`${
                  formData.status === 'passed' ? 'bg-green-600 hover:bg-green-700' :
                  formData.status === 'failed' ? 'bg-red-600 hover:bg-red-700' :
                  formData.status === 'blocked' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang ghi nhận...
                  </>
                ) : (
                  <>
                    {getStatusIcon(formData.status)}
                    <span className="ml-2">Ghi nhận kết quả</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}