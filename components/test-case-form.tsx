'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface TestCaseFormProps {
  projectId: string
  testCase?: any
  isEditing?: boolean
}

export function TestCaseForm({ projectId, testCase, isEditing = false }: TestCaseFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: testCase?.title || '',
    description: testCase?.description || '',
    preconditions: testCase?.preconditions || '',
    steps: testCase?.steps || '',
    expected_result: testCase?.expected_result || '',
    priority: testCase?.priority || 'medium',
    status: testCase?.status || 'not_executed',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing 
        ? `/api/projects/${projectId}/test-cases/${testCase.id}`
        : `/api/projects/${projectId}/test-cases`
      
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save test case')
      }

      const result = await response.json()
      
      toast({
        title: isEditing ? 'Test case updated' : 'Test case created',
        description: `Test case "${formData.title}" has been ${isEditing ? 'updated' : 'created'} successfully.`,
      })

      router.push(`/project/${projectId}/testcase/${result.id || testCase?.id}`)
    } catch (error) {
      console.error('Error saving test case:', error)
      toast({
        title: 'Error',
        description: 'Failed to save test case. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Test Case' : 'Create New Test Case'}</CardTitle>
          <CardDescription>
            {isEditing ? 'Update the test case details below.' : 'Fill in the details to create a new test case.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter test case title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Độ ưu tiên</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what this test case validates"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preconditions">Preconditions</Label>
            <Textarea
              id="preconditions"
              value={formData.preconditions}
              onChange={(e) => handleChange('preconditions', e.target.value)}
              placeholder="List any setup or conditions required before running this test"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">Test Steps *</Label>
            <Textarea
              id="steps"
              value={formData.steps}
              onChange={(e) => handleChange('steps', e.target.value)}
              placeholder="1. Step one&#10;2. Step two&#10;3. Step three..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_result">Expected Result *</Label>
            <Textarea
              id="expected_result"
              value={formData.expected_result}
              onChange={(e) => handleChange('expected_result', e.target.value)}
              placeholder="Describe the expected outcome when the test steps are executed correctly"
              rows={4}
              required
            />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_executed">Chưa thực thi</SelectItem>
                  <SelectItem value="passed">Thành công</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                  <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Test Case' : 'Create Test Case'}
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
  )
}