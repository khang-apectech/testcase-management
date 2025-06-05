"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface DetailedStats {
  // Thống kê theo thời gian
  timeStats: {
    daily: {
      date: string
      executions: number
      issues: number
    }[]
    weekly: {
      week: string
      executions: number
      issues: number
    }[]
    monthly: {
      month: string
      executions: number
      issues: number
    }[]
  }
  // Thống kê theo hạng mục
  categoryStats: {
    hang_muc: string
    total_cases: number
    completed: number
    in_progress: number
    not_started: number
    issues: number
  }[]
  // Thống kê theo độ ưu tiên
  priorityStats: {
    priority: string
    count: number
    completed: number
    issues: number
  }[]
  // Thống kê người dùng chi tiết
  userStats: {
    name: string
    total_assigned: number
    completed: number
    in_progress: number
    issues_found: number
    avg_time_per_test: number
  }[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function StatsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DetailedStats | null>(null)
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">("daily")

  useEffect(() => {
    loadDetailedStats()
  }, [])

  async function loadDetailedStats() {
    try {
      console.log("Fetching detailed stats...")
      const token = localStorage.getItem("token")
      const response = await fetch("/api/stats/detailed", {
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
          description: "Failed to load detailed statistics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading detailed stats:", error)
      toast({
        title: "Error",
        description: "Failed to load detailed statistics",
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

  if (!stats) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Thống kê chi tiết"
        text="Phân tích chi tiết về hoạt động test case"
      />

      <Tabs defaultValue="time" className="space-y-4">
        <TabsList>
          <TabsTrigger value="time">Theo thời gian</TabsTrigger>
          <TabsTrigger value="category">Theo hạng mục</TabsTrigger>
          <TabsTrigger value="priority">Theo độ ưu tiên</TabsTrigger>
          <TabsTrigger value="users">Theo người dùng</TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="space-y-4">
          <div className="flex justify-end space-x-2 mb-4">
            <TabsList>
              <TabsTrigger 
                value="daily"
                onClick={() => setTimeRange("daily")}
                className={timeRange === "daily" ? "bg-primary" : ""}
              >
                Ngày
              </TabsTrigger>
              <TabsTrigger 
                value="weekly"
                onClick={() => setTimeRange("weekly")}
                className={timeRange === "weekly" ? "bg-primary" : ""}
              >
                Tuần
              </TabsTrigger>
              <TabsTrigger 
                value="monthly"
                onClick={() => setTimeRange("monthly")}
                className={timeRange === "monthly" ? "bg-primary" : ""}
              >
                Tháng
              </TabsTrigger>
            </TabsList>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Số lượng test và lỗi theo thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.timeStats[timeRange]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey={timeRange === "daily" ? "date" : timeRange === "weekly" ? "week" : "month"}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="executions"
                      name="Số lần test"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="issues"
                      name="Số lỗi"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phân bố theo hạng mục</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hang_muc" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Hoàn thành" fill="#4CAF50" stackId="a" />
                    <Bar dataKey="in_progress" name="Đang test" fill="#2196F3" stackId="a" />
                    <Bar dataKey="not_started" name="Chưa test" fill="#FFC107" stackId="a" />
                    <Bar dataKey="issues" name="Lỗi" fill="#F44336" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố theo độ ưu tiên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.priorityStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {stats.priorityStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tỷ lệ hoàn thành theo độ ưu tiên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.priorityStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="priority" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Đã hoàn thành" fill="#4CAF50" />
                      <Bar dataKey="issues" name="Có lỗi" fill="#F44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hiệu suất người dùng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.userStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Hoàn thành" fill="#4CAF50" />
                    <Bar dataKey="in_progress" name="Đang test" fill="#2196F3" />
                    <Bar dataKey="issues_found" name="Lỗi tìm thấy" fill="#F44336" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thời gian trung bình mỗi test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.userStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg_time_per_test" name="Phút" fill="#9C27B0" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
} 