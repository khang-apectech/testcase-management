'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { TestCaseForm } from '@/components/forms/test-case-form'
import { useAuth } from '@/contexts/auth-context'

interface EditTestCasePageProps {
  params: { 
    project_id: string
    testcase_id: string 
  }
}

export default function EditTestCasePage({ params }: EditTestCasePageProps) {
  const { fetchWithAuth } = useAuth()
  const { project_id, testcase_id } = params
  const [testCase, setTestCase] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTestCase = async () => {
      try {
        const response = await fetchWithAuth(`/api/projects/${project_id}/test-cases/${testcase_id}`)
        
        if (response.ok) {
          const data = await response.json()
          setTestCase(data)
        }
      } catch (error) {
        console.error('Error fetching test case:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTestCase()
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/project/${project_id}/testcase/${testcase_id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Test Case
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Test Case</h1>
          <p className="text-muted-foreground">
            Update test case: {testCase.hang_muc || testCase.title || 'Untitled'}
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Đang tải...</div>}>
        <TestCaseForm 
          projectId={project_id} 
          testCase={testCase}
          isEditing={true}
        />
      </Suspense>
    </div>
  )
}