"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { 
  Save, 
  Loader2, 
  FileText, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  User,
  Calendar
} from 'lucide-react'

interface TestCase {
  id?: string
  title?: string
  hang_muc: string
  description?: string
  tinh_nang: string
  so_lan_phai_test: number
  platform?: 'web' | 'app' | 'cms' | 'server'
  preconditions?: string
  steps?: string
  expected_result?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  status?: string
  assigned_tester?: string
  created_at?: string
  updated_at?: string
}

interface TestCaseFormProps {
  projectId: string
  testCase?: TestCase
  isEditing?: boolean
}

export function TestCaseForm({ projectId, testCase, isEditing = false }: TestCaseFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { fetchWithAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    hang_muc: testCase?.hang_muc || testCase?.title || '',
    tinh_nang: testCase?.tinh_nang || testCase?.description || '',
    so_lan_phai_test: testCase?.so_lan_phai_test || 1,
    platform: testCase?.platform || 'web' as const,
    priority: testCase?.priority || 'medium' as const,
    preconditions: testCase?.preconditions || '',
    steps: testCase?.steps || '',
    expected_result: testCase?.expected_result || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.hang_muc || !formData.tinh_nang) {
      toast({
        title: "Lỗi",
        description: "Hạng mục và tính năng là bắt buộc",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      const url = isEditing 
        ? `/api/projects/${projectId}/test-cases/${testCase?.id}`
        : `/api/projects/${projectId}/test-cases`
      
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetchWithAuth(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Thành công",
          description: isEditing ? "Đã cập nhật test case thành công" : "Đã tạo test case thành công",
        })
        
        if (isEditing) {
          router.push(`/project/${projectId}/testcase/${testCase?.id}`)
        } else {
          router.push(`/project/${projectId}/testcase/${result.id}`)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Lỗi",
          description: error.error || "Không thể lưu test case",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving test case:', error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi không mong muốn",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === 'so_lan_phai_test') {
      setFormData(prev => ({ ...prev, [field]: parseInt(value) || 1 }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with current test case info if editing */}
      {isEditing && testCase && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">{testCase.hang_muc || testCase.title}</h3>
                  <p className="text-sm text-blue-700">ID: {testCase.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {testCase.assigned_tester && (
                  <Badge variant="secondary">
                    <User className="mr-1 h-3 w-3" />
                    {testCase.assigned_tester}
                  </Badge>
                )}
                {testCase.updated_at && (
                  <Badge variant="outline">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(testCase.updated_at).toLocaleDateString('vi-VN')}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isEditing ? 'Chỉnh sửa Test Case' : 'Tạo Test Case mới'}
          </CardTitle>
          <CardDescription>
            {isEditing ? 'Cập nhật thông tin chi tiết của test case' : 'Điền đầy đủ thông tin cho test case mới'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hang_muc" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Hạng mục *
                  </Label>
                  <Input
                    id="hang_muc"
                    value={formData.hang_muc}
                    onChange={(e) => handleInputChange('hang_muc', e.target.value)}
                    placeholder="Nhập hạng mục test case"
                    className="h-11"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="so_lan_phai_test">Số lần phải test *</Label>
                  <Input
                    id="so_lan_phai_test"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.so_lan_phai_test}
                    onChange={(e) => handleInputChange('so_lan_phai_test', e.target.value)}
                    placeholder="1"
                    className="h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tinh_nang">Tính năng *</Label>
                <Textarea
                  id="tinh_nang"
                  value={formData.tinh_nang}
                  onChange={(e) => handleInputChange('tinh_nang', e.target.value)}
                  placeholder="Mô tả chi tiết tính năng cần test..."
                  rows={4}
                  className="resize-none"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Chọn platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Web
                        </div>
                      </SelectItem>
                      <SelectItem value="app">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Mobile App
                        </div>
                      </SelectItem>
                      <SelectItem value="cms">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          CMS
                        </div>
                      </SelectItem>
                      <SelectItem value="server">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Server
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Độ ưu tiên</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Chọn độ ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Thấp
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Trung bình
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Cao
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Quan trọng
                      </div>
                    </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Detailed Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-lg">Chi tiết thực thi</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preconditions">Điều kiện tiên quyết</Label>
                  <Textarea
                    id="preconditions"
                    value={formData.preconditions}
                    onChange={(e) => handleInputChange('preconditions', e.target.value)}
                    placeholder="Mô tả các điều kiện cần có trước khi thực hiện test..."
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ví dụ: Người dùng đã đăng nhập, dữ liệu test đã được chuẩn bị...
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="steps">Các bước thực hiện</Label>
                  <Textarea
                    id="steps"
                    value={formData.steps}
                    onChange={(e) => handleInputChange('steps', e.target.value)}
                    placeholder="Mô tả từng bước thực hiện test case..."
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mô tả chi tiết từng bước, sử dụng số thứ tự để dễ theo dõi
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_result">Kết quả mong đợi</Label>
                  <Textarea
                    id="expected_result"
                    value={formData.expected_result}
                    onChange={(e) => handleInputChange('expected_result', e.target.value)}
                    placeholder="Mô tả kết quả mong đợi sau khi thực hiện test..."
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mô tả rõ ràng kết quả mong đợi để dễ dàng so sánh khi test
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Các trường có dấu * là bắt buộc</span>
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
                <Button type="submit" disabled={loading} className="min-w-[140px]">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}