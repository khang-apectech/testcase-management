"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { AssignTesters } from "@/components/test-cases/assign-testers"
import { useAuth } from "@/contexts/auth-context"

interface TestCase {
  id: string
  hang_muc: string
  tinh_nang: string
  mo_ta: string
  so_lan_phai_test: number
  priority: "cao" | "trung bình" | "thấp"
  created_by: {
    id: string
    name: string
    email: string
  }
  assigned_testers: Array<{
    id: string
    name: string
    email: string
  }>
  executions: Array<{
    id: string
    tester: {
      id: string
      name: string
      email: string
    }
    so_lan_da_test: number
    cam_nhan: string
    loi: string
    execution_date: string
  }>
}

export default function TestCaseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [loading, setLoading] = useState(true)
  const { fetchWithAuth, user } = useAuth()

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

  async function handleDelete() {
    if (!confirm("Bạn có chắc chắn muốn xóa test case này?")) {
      return
    }

    try {
      const response = await fetch(`/api/test-cases/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test case deleted successfully",
        })
        router.push("/dashboard/test-cases")
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete test case",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete test case",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!testCase) {
    return <div>Test case not found</div>
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={testCase.tinh_nang}
        text={`Chi tiết và lịch sử test của ${testCase.tinh_nang}`}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/test-cases")}>
            <Icons.back className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          {user?.role === "admin" && (
            <AssignTesters testCaseId={params.id as string} onAssigned={loadTestCase} />
          )}
          {user?.role === "admin" && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/test-cases/${params.id}/edit`)}>
              <Icons.edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
          )}
          {user?.role === "admin" && (
            <Button variant="destructive" onClick={handleDelete}>
              <Icons.delete className="mr-2 h-4 w-4" />
              Xóa
            </Button>
          )}
        </div>
      </DashboardHeader>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="executions">Lịch sử test</TabsTrigger>
          <TabsTrigger value="testers">Người test</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
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
                <CardTitle>Yêu cầu test</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium">Số lần phải test</dt>
                    <dd>{testCase.so_lan_phai_test}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Độ ưu tiên</dt>
                    <dd>
                      <Badge variant="outline" className="mt-1">
                        {testCase.priority}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Người tạo</dt>
                    <dd>{testCase.created_by.name}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="font-medium">Số lần đã test</dt>
                    <dd>{testCase.executions.length}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Số lỗi phát hiện</dt>
                    <dd>
                      {testCase.executions.filter((e) => e.loi?.trim()).length}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Số người test</dt>
                    <dd>{Array.isArray(testCase.assigned_testers) ? testCase.assigned_testers.length : 0}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử test</CardTitle>
              <CardDescription>
                Chi tiết các lần thực hiện test case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Người test</TableHead>
                    <TableHead>Lần test thứ</TableHead>
                    <TableHead>Cảm nhận</TableHead>
                    <TableHead>Lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testCase.executions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        {new Date(execution.execution_date).toLocaleString()}
                      </TableCell>
                      <TableCell>{execution.tester.name}</TableCell>
                      <TableCell>{execution.so_lan_da_test}</TableCell>
                      <TableCell>{execution.cam_nhan}</TableCell>
                      <TableCell>
                        {execution.loi ? (
                          <Badge variant="destructive">
                            {execution.loi}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Không có lỗi</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testers">
          <Card>
            <CardHeader>
              <CardTitle>Người test được phân công</CardTitle>
              <CardDescription>
                Danh sách người test được giao test case này
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số lần đã test</TableHead>
                    <TableHead>Lỗi phát hiện</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(testCase.assigned_testers ?? []).map((tester) => {
                    const testerExecutions = testCase.executions.filter(
                      (e) => e.tester.id === tester.id
                    )
                    return (
                      <TableRow key={tester.id}>
                        <TableCell>{tester.name}</TableCell>
                        <TableCell>{tester.email}</TableCell>
                        <TableCell>{testerExecutions.length}</TableCell>
                        <TableCell>
                          {testerExecutions.filter((e) => e.loi?.trim()).length}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
} 