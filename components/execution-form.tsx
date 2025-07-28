'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ExecutionFormProps {
  projectId: string
  testCase: any
}

export function ExecutionForm({ projectId, testCase }: ExecutionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    status: '',
    comments: '',
    bug_report: '',
    actual_result: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.status) {
      toast({
        title: 'Status required',
        description: 'Please select a test execution status.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/test-cases/${testCase.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          executed_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to record test execution')
      }

      toast({
        title: 'Test execution recorded',
        description: `Test case "${testCase.title}" has been executed and recorded.`,
      })

      router.push(`/project/${projectId}/testcase/${testCase.id}`)
    } catch (error) {
      console.error('Error recording execution:', error)
      toast({
        title: 'Error',
        description: 'Failed to record test execution. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Execute Test Case</CardTitle>
              <CardDescription>
                Record test execution results and findings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái thực thi *</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kết quả thực thi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Thành công
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Failed
                      </div>
                    </SelectItem>
                    <SelectItem value="blocked">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Blocked
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual_result">Actual Result</Label>
                <Textarea
                  id="actual_result"
                  value={formData.actual_result}
                  onChange={(e) => handleChange('actual_result', e.target.value)}
                  placeholder="Mô tả những gì thực sự xảy ra khi bạn thực thi test"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  placeholder="Thêm ghi chú, quan sát hoặc chi tiết bổ sung về việc thực thi test"
                  rows={3}
                />
              </div>

              {formData.status === 'failed' && (
                <div className="space-y-2">
                  <Label htmlFor="bug_report">Bug Report / Issue Details</Label>
                  <Textarea
                    id="bug_report"
                    value={formData.bug_report}
                    onChange={(e) => handleChange('bug_report', e.target.value)}
                    placeholder="Mô tả lỗi hoặc vấn đề phát hiện. Bao gồm các bước tái tạo, thông báo lỗi, ảnh chụp màn hình, v.v."
                    rows={4}
                  />
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {formData.status && getStatusIcon(formData.status)}
                  <span className="ml-2">Record Execution</span>
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Test Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">Title</h4>
              <p className="text-sm">{testCase.title}</p>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-sm mb-1">Priority</h4>
              <Badge variant="outline">{testCase.priority || 'Medium'}</Badge>
            </div>

            <Separator />

            {testCase.preconditions && (
              <>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Preconditions</h4>
                  <div className="bg-muted p-2 rounded text-xs">
                    <pre className="whitespace-pre-wrap">{testCase.preconditions}</pre>
                  </div>
                </div>
                <Separator />
              </>
            )}

            <div>
              <h4 className="font-semibold text-sm mb-2">Test Steps</h4>
              <div className="bg-muted p-2 rounded text-xs max-h-40 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{testCase.steps}</pre>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-sm mb-2">Expected Result</h4>
              <div className="bg-muted p-2 rounded text-xs max-h-32 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{testCase.expected_result}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}