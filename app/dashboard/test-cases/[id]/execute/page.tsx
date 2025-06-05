"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface TestCase {
  id: string
  hang_muc: string
  tinh_nang: string
  mo_ta: string
  so_lan_phai_test: number
  priority: "cao" | "trung bình" | "thấp"
  executions: Array<{
    id: string
    so_lan_da_test: number
    cam_nhan: string
    loi: string
    tester?: {
      id: string
    }
    tester_id?: string
  }>
}

export default function ExecuteTestCasePage() {
  const params = useParams()
  const router = useRouter()
  const { fetchWithAuth, user } = useAuth()
  const { toast } = useToast()
  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    loadTestCase()
  }, [])

  async function loadTestCase() {
    try {
      const response = await fetchWithAuth(`/api/test-cases/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setTestCase(data.testCase)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load test case",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load test case",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setExecuting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const response = await fetchWithAuth(`/api/test-cases/${params.id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cam_nhan: formData.get("cam_nhan"),
          loi: formData.get("loi"),
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "Test execution recorded successfully",
        })
        router.push(`/dashboard/test-cases/${params.id}`)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to record test execution",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record test execution",
        variant: "destructive",
      })
    } finally {
      setExecuting(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!testCase) {
    return <div>Test case not found</div>
  }

  // Lọc số lần đã test của user hiện tại (hỗ trợ cả trường hợp API trả về tester hoặc tester_id)
  const myExecutions = testCase.executions.filter(e => (e.tester?.id === user?.id) || (e.tester_id === user?.id))
  const myTestCount = myExecutions.length
  const remainingExecutions = testCase.so_lan_phai_test - myTestCount

  if (remainingExecutions <= 0) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Thực thi Test Case"
          text="Ghi nhận kết quả test"
        >
          <Button variant="outline" onClick={() => router.push(`/dashboard/test-cases/${params.id}`)}>
            <Icons.back className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </DashboardHeader>

        <Card>
          <CardHeader>
            <CardTitle>Đã hoàn thành test</CardTitle>
            <CardDescription>
              Bạn đã test đủ số lần yêu cầu ({testCase.so_lan_phai_test} lần)
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Thực thi Test Case"
        text="Ghi nhận kết quả test"
      >
        <Button variant="outline" onClick={() => router.push(`/dashboard/test-cases/${params.id}`)}>
          <Icons.back className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </DashboardHeader>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Test Case</CardTitle>
            <CardDescription>
              Lần test thứ {myTestCount + 1}/{testCase.so_lan_phai_test}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="font-medium">Hạng mục</dt>
                <dd>{testCase.hang_muc}</dd>
              </div>
              <div>
                <dt className="font-medium">Tính năng</dt>
                <dd>{testCase.tinh_nang}</dd>
              </div>
              <div>
                <dt className="font-medium">Mô tả</dt>
                <dd>{testCase.mo_ta}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kết quả Test</CardTitle>
            <CardDescription>
              Nhập kết quả sau khi test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cam_nhan">Cảm nhận</Label>
                <Textarea
                  id="cam_nhan"
                  name="cam_nhan"
                  placeholder="Nhập cảm nhận của bạn về tính năng này"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loi">Lỗi phát hiện</Label>
                <Textarea
                  id="loi"
                  name="loi"
                  placeholder="Mô tả lỗi nếu phát hiện (để trống nếu không có lỗi)"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={executing}>
                  {executing && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Ghi nhận kết quả
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
} 