'use client'

import { Suspense, useState, useEffect, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart, Download, FileText, TrendingUp, TrendingDown, Activity, PieChart, Target, Users, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface ReportsPageProps {
  params: Promise<{ project_id: string }>
}

export default function ReportsPage({ params }: ReportsPageProps) {
  const { fetchWithAuth } = useAuth()
  const { project_id } = use(params)
  const [reports, setReports] = useState({
    summary: {
      totalTestCases: 0,
      executedTestCases: 0,
      totalExecutions: 0,
      passedExecutions: 0,
      failedExecutions: 0,
      passRate: 0
    },
    trends: [],
    recentExecutions: [],
    coverage: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetchWithAuth(`/api/projects/${project_id}/reports`)
        
        if (response.ok) {
          const data = await response.json()
          setReports(data)
        }
      } catch (error) {
        console.error('Error fetching reports:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [project_id, fetchWithAuth])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Đang tải báo cáo...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo Dự án</h1>
          <p className="text-muted-foreground">
            Xem tiến độ testing và tạo báo cáo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => window.open(`/api/export/project-report/${project_id}?format=pdf`, '_blank')}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open(`/api/export/project-report/${project_id}?format=excel`, '_blank')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open(`/api/export/apec-space`, '_blank')}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Test Case</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.summary.totalTestCases || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Case đã thực thi</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.summary.executedTestCases || 0}</div>
            <p className="text-xs text-muted-foreground">
              {Number(reports.summary.totalTestCases || 0) > 0 
                ? `${Math.round((Number(reports.summary.executedTestCases || 0) / Number(reports.summary.totalTestCases || 1)) * 100)}%`
                : '0%'
              } of total test cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lần thực thi</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.summary.totalExecutions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả lần chạy test
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lần thực thi thành công</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reports.summary.passedExecutions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {Number(reports.summary.passRate || 0).toFixed(1)}% tỷ lệ thành công
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lần thực thi thất bại</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reports.summary.failedExecutions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {Number(reports.summary.totalExecutions || 0) > 0 
                ? `${Math.round((Number(reports.summary.failedExecutions || 0) / Number(reports.summary.totalExecutions || 1)) * 100)}%`
                : '0%'
              } tổng số lần thực thi
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Executions */}
        <Card>
          <CardHeader>
            <CardTitle>Lần thực thi gần đây</CardTitle>
            <CardDescription>
              Latest test case executions in this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.recentExecutions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No recent executions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.recentExecutions.slice(0, 5).map((execution: any) => (
                  <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{execution.test_case_title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {execution.executed_by} • {new Date(execution.executed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={execution.status === 'passed' ? 'default' : 
                               execution.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {execution.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-4 w-4" />
              Test Coverage
            </CardTitle>
            <CardDescription>
              Test execution coverage by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.coverage.length === 0 ? (
                <div className="text-center py-6">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No coverage data available</p>
                </div>
              ) : (
                reports.coverage.map((item: any, index: number) => {
                  const colors = ['bg-blue-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600', 'bg-red-600']
                  const color = colors[index % colors.length]
                  const coverage = Number(item.coveragepercentage || 0);
                  
                  return (
                    <div key={item.platform || 'unknown'} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${color} rounded-full`}></div>
                          <span className="font-medium">
                            {item.platform === 'web' && '🌐 Web'}
                            {item.platform === 'app' && '📱 Mobile App'}
                            {item.platform === 'cms' && '⚙️ CMS'}
                            {item.platform === 'server' && '🖥️ Server'}
                            {!['web', 'app', 'cms', 'server'].includes(item.platform) && (item.platform || 'Unknown Platform')}
                          </span>
                        </div>
                        <Badge variant={coverage >= 80 ? 'default' : coverage >= 50 ? 'secondary' : 'destructive'}>
                          {coverage}%
                        </Badge>
                      </div>
                      <Progress value={coverage} className="h-3" />
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{item.executedtestcases || 0}</div>
                          <div className="text-xs text-muted-foreground">Executed</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-600">{(item.totaltestcases || 0) - (item.executedtestcases || 0)}</div>
                          <div className="text-xs text-muted-foreground">Remaining</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">{item.totaltestcases || 0}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Detailed Reports</CardTitle>
          <CardDescription>
            Create comprehensive reports for stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              <span>Executive Summary</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart className="h-6 w-6 mb-2" />
              <span>Test Execution Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>Progress Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}