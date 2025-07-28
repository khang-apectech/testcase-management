import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart, Download, FileText, TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface ReportsPageProps {
  params: Promise<{ project_id: string }>
}

async function getProjectReports(projectId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/projects/${projectId}/reports`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return {
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
      }
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching reports:', error)
    return {
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
    }
  }
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { project_id } = await params
  const reports = await getProjectReports(project_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Reports</h1>
          <p className="text-muted-foreground">
            View testing progress and generate reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Test Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.summary.totalTestCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executed Test Cases</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.summary.executedTestCases}</div>
            <p className="text-xs text-muted-foreground">
              {reports.summary.totalTestCases > 0 
                ? `${Math.round((reports.summary.executedTestCases / reports.summary.totalTestCases) * 100)}%`
                : '0%'
              } of total test cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.summary.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              All test runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed Executions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reports.summary.passedExecutions}</div>
            <p className="text-xs text-muted-foreground">
              {reports.summary.passRate.toFixed(1)}% pass rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Executions</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reports.summary.failedExecutions}</div>
            <p className="text-xs text-muted-foreground">
              {reports.summary.totalExecutions > 0 
                ? `${Math.round((reports.summary.failedExecutions / reports.summary.totalExecutions) * 100)}%`
                : '0%'
              } of total executions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Executions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Executions</CardTitle>
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
            <CardTitle>Test Coverage</CardTitle>
            <CardDescription>
              Test execution coverage by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.coverage.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No coverage data available</p>
                </div>
              ) : (
                reports.coverage.map((item: any, index: number) => {
                  const colors = ['bg-blue-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600', 'bg-red-600']
                  const color = colors[index % colors.length]
                  
                  return (
                    <div key={item.platform || 'unknown'} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.platform || 'Unknown Platform'}</span>
                        <span>{item.coveragepercentage || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${color} h-2 rounded-full`} 
                          style={{width: `${item.coveragepercentage || 0}%`}}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.executedtestcases || 0} / {item.totaltestcases || 0} test cases executed
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