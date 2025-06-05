"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "tester"
  created_at: string
  total_assigned_tests: number
  total_executions: number
}

interface TestCase {
  id: string
  hang_muc: string
  tinh_nang: string
  mo_ta: string
  so_lan_phai_test: number
  priority: "cao" | "trung bình" | "thấp"
  total_executions: number
  total_issues: number
}

interface TestExecution {
  id: string
  test_case_id: string
  hang_muc: string
  tinh_nang: string
  so_lan_da_test: number
  cam_nhan: string
  loi: string
  execution_date: string
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [assignedTests, setAssignedTests] = useState<TestCase[]>([])
  const [executions, setExecutions] = useState<TestExecution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [params?.id])

  async function loadUserData() {
    try {
      console.log("Fetching user data...")
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/users/${params.id}`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      })
      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        setUser(data.user)
        setAssignedTests(data.assignedTests || [])
        setExecutions(data.executions || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load user data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-8">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      </DashboardShell>
    )
  }

  if (!user) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">User not found</p>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/users")}
            className="mt-4"
          >
            Back to users
          </Button>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={user.name}
        text="Chi tiết người dùng"
      >
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/users")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </DashboardHeader>

      <div className="grid gap-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Test Cases được giao
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.total_assigned_tests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Số lần test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.total_executions}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="assigned" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assigned">Test Cases được giao</TabsTrigger>
            <TabsTrigger value="executions">Lịch sử test</TabsTrigger>
          </TabsList>
          <TabsContent value="assigned" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hạng mục</TableHead>
                    <TableHead>Tính năng</TableHead>
                    <TableHead>Độ ưu tiên</TableHead>
                    <TableHead className="text-center">Số lần test</TableHead>
                    <TableHead className="text-center">Lỗi</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedTests.length > 0 ? (
                    assignedTests.map((testCase) => (
                      <TableRow key={testCase.id}>
                        <TableCell>{testCase.hang_muc}</TableCell>
                        <TableCell>{testCase.tinh_nang}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              testCase.priority === "cao"
                                ? "destructive"
                                : testCase.priority === "trung bình"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {testCase.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {testCase.total_executions}/{testCase.so_lan_phai_test}
                        </TableCell>
                        <TableCell className="text-center">
                          {testCase.total_issues}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/test-cases/${testCase.id}`)}
                          >
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Chưa có test case nào được giao
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="executions" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hạng mục</TableHead>
                    <TableHead>Tính năng</TableHead>
                    <TableHead>Số lần test</TableHead>
                    <TableHead>Cảm nhận</TableHead>
                    <TableHead>Lỗi</TableHead>
                    <TableHead>Ngày test</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.length > 0 ? (
                    executions.map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell>{execution.hang_muc}</TableCell>
                        <TableCell>{execution.tinh_nang}</TableCell>
                        <TableCell>{execution.so_lan_da_test}</TableCell>
                        <TableCell>{execution.cam_nhan}</TableCell>
                        <TableCell>{execution.loi}</TableCell>
                        <TableCell>
                          {new Date(execution.execution_date).toLocaleDateString("vi-VN")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Chưa có lịch sử test nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
} 