"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

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
import { useAuth } from "@/contexts/auth-context"

interface TestCase {
  id: string
  hang_muc: string
  tinh_nang: string
  so_lan_phai_test: number
  total_executions: number
  total_issues: number
  assigned_testers: string[]
  created_at: string
  my_executions?: number
  testers_tested: number
  testers_assigned: number
}

export default function TestCasesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading: authLoading, fetchWithAuth } = useAuth()
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [hangMuc, setHangMuc] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (!authLoading && user) {
      loadTestCases()
    }
    // eslint-disable-next-line
  }, [authLoading, user, hangMuc, page, pageSize, searchTerm])

  async function loadTestCases() {
    try {
      setLoading(true)
      let url = `/api/test-cases?hang_muc=${hangMuc}&page=${page}&pageSize=${pageSize}`
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`
      const response = await fetchWithAuth(url)
      const data = await response.json()
      if (response.ok) {
        setTestCases(data.testCases)
        setTotal(data.total)
      } else {
        toast({ title: "Error", description: data.error || "Failed to load test cases", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load test cases", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-8">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Test Cases"
        text="Quản lý danh sách test cases"
      >
        {user?.role === "admin" && (
          <Button onClick={() => router.push("/dashboard/test-cases/new")}> 
            <Icons.add className="mr-2 h-4 w-4" />
            Tạo Test Case
          </Button>
        )}
      </DashboardHeader>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo hạng mục hoặc tính năng..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
            />
          </div>
          <div>
            <select
              className="border rounded px-2 py-1"
              value={hangMuc}
              onChange={e => { setHangMuc(e.target.value); setPage(1) }}
            >
              <option value="all">Tất cả</option>
              <option value="App">App</option>
              <option value="CMS">CMS</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
            <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
            <span className="text-muted-foreground text-lg font-medium">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hạng mục</TableHead>
                  <TableHead>Tính năng</TableHead>
                  {user?.role === "admin" ? (
                    <>
                      <TableHead className="text-center">Số lần đã test</TableHead>
                      <TableHead className="text-center">Số tester đã test</TableHead>
                      <TableHead className="text-center">Số lần phải test</TableHead>
                    </>
                  ) : (
                    <TableHead className="text-center">Số lần test</TableHead>
                  )}
                  <TableHead className="text-center">Lỗi</TableHead>
                  <TableHead className="text-center">Người được giao</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testCases.length > 0 ? (
                  testCases.map((testCase) => (
                    <TableRow key={testCase.id}>
                      <TableCell>{testCase.hang_muc}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={testCase.tinh_nang}>
                          {testCase.tinh_nang}
                        </div>
                      </TableCell>
                      {user?.role === "admin" ? (
                        <>
                          <TableCell className="text-center">{testCase.total_executions}</TableCell>
                          <TableCell className="text-center">{testCase.testers_tested}</TableCell>
                          <TableCell className="text-center">{testCase.so_lan_phai_test}</TableCell>
                        </>
                      ) : (
                        <TableCell className="text-center">
                          {user?.role === "tester" && typeof testCase.my_executions === "number" ? (
                            <div className="text-xs text-muted-foreground">Bạn: {testCase.my_executions}/{testCase.so_lan_phai_test}</div>
                          ) : (
                            <>{testCase.total_executions}/{testCase.so_lan_phai_test}</>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        {testCase.total_issues}
                      </TableCell>
                      <TableCell className="text-center">
                        {Array.isArray(testCase.assigned_testers) 
                          ? testCase.assigned_testers.length 
                          : 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/test-cases/${testCase.id}`)}
                          >
                            Chi tiết
                          </Button>
                          {user?.role === "tester" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/test-cases/${testCase.id}/execute`)}
                            >
                              Test
                            </Button>
                          )}
                          {user?.role === "admin" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/test-cases/${testCase.id}/edit`)}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/test-cases/${testCase.id}`)}
                              >
                                Xóa
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      {searchTerm
                        ? "Không tìm thấy test case nào phù hợp"
                        : "Chưa có test case nào"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div>
            <span>
              Trang {page} / {Math.ceil(total / pageSize) || 1} (Tổng: {total})
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
            <select
              className="border rounded px-2 py-1 ml-2"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>{size}/trang</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
} 