"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { TestCaseWithExecution, TestExecution } from "@/lib/db"
import { TestCaseDialog } from "@/components/test-case-dialog"
import { ExecutionDialog } from "@/components/execution-dialog"
import { AdminStats } from "@/components/admin-stats"
import { CalendarDays, FileText, LogOut, Target, TestTube, Activity, Users, Bug } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { useToast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface DashboardStats {
  totalTestCases: number
  totalExecutions: number
  totalUsers: number
  totalIssues: number
  executionTrend: {
    date: string
    executions: number
  }[]
  statusDistribution: {
    name: string
    value: number
  }[]
  userPerformance: {
    name: string
    executions: number
    issues: number
  }[]
  recentActivity: {
    id: string
    type: string
    user: string
    description: string
    date: string
  }[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function DashboardPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [testCases, setTestCases] = useState<TestCaseWithExecution[]>([])
  const [executions, setExecutions] = useState<TestExecution[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchTestCases()
      fetchExecutions()
    }
  }, [user])

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const fetchTestCases = async () => {
    try {
      const response = await fetch("/api/test-cases")
      if (response.ok) {
        const data = await response.json()
        setTestCases(data.testCases)
      }
    } catch (error) {
      console.error("Failed to fetch test cases:", error)
    }
  }

  const fetchExecutions = async () => {
    try {
      const response = await fetch("/api/test-executions")
      if (response.ok) {
        const data = await response.json()
        setExecutions(data.executions)
      }
    } catch (error) {
      console.error("Failed to fetch executions:", error)
    } finally {
      setLoadingData(false)
    }
  }

  async function loadDashboardStats() {
    try {
      console.log("Fetching dashboard stats...")
      const token = localStorage.getItem("token")
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      })
    }
  }

  const getProgressBadge = (current: number, required: number) => {
    const percentage = required > 0 ? Math.round((current / required) * 100) : 0

    if (percentage >= 100) {
      return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>
    } else if (percentage >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">Đang thực hiện</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Chưa đủ</Badge>
    }
  }

  // Group test cases by hang_muc
  const groupedTestCases = testCases.reduce(
    (acc, testCase) => {
      const hangMuc = testCase.hang_muc
      if (!acc[hangMuc]) {
        acc[hangMuc] = []
      }
      acc[hangMuc].push(testCase)
      return acc
    },
    {} as Record<string, TestCaseWithExecution[]>,
  )

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Tổng quan về hoạt động test case"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Test Cases
            </CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTestCases}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số test case trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lượt Test
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số lần test được thực hiện
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Người Dùng
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Số lượng người dùng hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lỗi
            </CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Số lượng lỗi được phát hiện
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Số Lượt Test Theo Thời Gian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.executionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="executions"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Phân Bố Trạng Thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats?.statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Hiệu Suất Người Dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats?.userPerformance.map((user) => (
                <div key={user.name} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.executions} lượt test / {user.issues} lỗi
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {user.executions > 0 && user.issues >0 ?  ((user.issues / user.executions) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Hoạt Động Gần Đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.user}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <div className="ml-auto text-sm text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
