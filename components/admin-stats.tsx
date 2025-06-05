"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Users, FileText, Activity } from "lucide-react"

interface DashboardStats {
  totalTestCases: number
  totalUsers: number
  totalExecutions: number
  statusStats: Array<{ status: string; count: string }>
  testerStats: Array<{
    tester_name: string
    total_executions: string
    passed: string
    failed: string
  }>
}

export function AdminStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const getStatusStats = () => {
    const statusMap = stats.statusStats.reduce(
      (acc, item) => {
        acc[item.status] = Number.parseInt(item.count)
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      pass: statusMap.pass || 0,
      fail: statusMap.fail || 0,
      blocked: statusMap.blocked || 0,
      not_run: statusMap.not_run || 0,
    }
  }

  const statusStats = getStatusStats()
  const passRate = stats.totalExecutions > 0 ? Math.round((statusStats.pass / stats.totalExecutions) * 100) : 0

  return (
    <div className="mb-8">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Test Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTestCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Testers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lần Test</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ Pass</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố trạng thái Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pass</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${stats.totalExecutions > 0 ? (statusStats.pass / stats.totalExecutions) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{statusStats.pass}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Fail</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${stats.totalExecutions > 0 ? (statusStats.fail / stats.totalExecutions) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{statusStats.fail}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Blocked</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${stats.totalExecutions > 0 ? (statusStats.blocked / stats.totalExecutions) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{statusStats.blocked}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tester Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Hiệu suất Tester</CardTitle>
            <CardDescription>Số lượng test và tỷ lệ thành công</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.testerStats.slice(0, 5).map((tester) => {
                const total = Number.parseInt(tester.total_executions)
                const passed = Number.parseInt(tester.passed)
                const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

                return (
                  <div key={tester.tester_name} className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{tester.tester_name}</div>
                      <div className="text-xs text-gray-500">{total} tests</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{passRate}%</div>
                      <div className="text-xs text-gray-500">
                        {passed}/{total}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
