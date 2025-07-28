import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { TestCaseForm } from '@/components/forms/test-case-form'

interface NewTestCasePageProps {
  params: { project_id: string }
}

export default async function NewTestCasePage({ params }: NewTestCasePageProps) {
  const { project_id } = await params
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/project/${project_id}/testcase`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách Test Case
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tạo Test Case mới</h1>
          <p className="text-muted-foreground">
            Thêm test case mới vào dự án này
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Đang tải...</div>}>
        <TestCaseForm projectId={project_id} />
      </Suspense>
    </div>
  )
}