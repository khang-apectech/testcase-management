import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/export/project-report/[project_id] - Export project report
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    const { project_id: projectId } = await params
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv'
    
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can export reports" },
        { status: 403 }
      )
    }

    const sql = await getDbConnection()
    
    // Get project info
    const [project] = await sql`
      SELECT * FROM projects WHERE id = ${projectId}
    `
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Get comprehensive test case data with execution stats
    const testResults = await sql`
      SELECT 
        tc.id as test_case_id,
        tc.hang_muc,
        tc.tinh_nang,
        tc.mo_ta,
        tc.so_lan_phai_test,
        tc.priority,
        tc.platform,
        tc.preconditions,
        tc.steps,
        tc.expected_result,
        tc.created_at,
        COUNT(DISTINCT te.id) as total_executions,
        COUNT(CASE WHEN te.loi IS NULL OR te.loi = '' THEN 1 END) as passed_executions,
        COUNT(CASE WHEN te.loi IS NOT NULL AND te.loi != '' THEN 1 END) as failed_executions,
        COUNT(DISTINCT te.tester_id) as unique_testers,
        STRING_AGG(DISTINCT u.name, ', ') as tester_names,
        latest_execution.status as current_status,
        latest_execution.execution_date as last_execution_date,
        latest_execution.tester_name as last_tester
      FROM test_cases tc
      LEFT JOIN test_executions te ON te.test_case_id = tc.id
      LEFT JOIN users u ON te.tester_id = u.id
      LEFT JOIN (
        SELECT DISTINCT ON (te2.test_case_id) 
          te2.test_case_id,
          CASE 
            WHEN te2.loi IS NULL OR te2.loi = '' THEN 'passed'
            ELSE 'failed'
          END as status,
          te2.execution_date,
          u2.name as tester_name
        FROM test_executions te2
        LEFT JOIN users u2 ON te2.tester_id = u2.id
        ORDER BY te2.test_case_id, te2.execution_date DESC
      ) latest_execution ON tc.id = latest_execution.test_case_id
      WHERE tc.project_id = ${projectId}
      GROUP BY tc.id, latest_execution.status, latest_execution.execution_date, latest_execution.tester_name
      ORDER BY tc.hang_muc, tc.tinh_nang
    `

    if (format === 'csv') {
      // Generate CSV content with BOM for proper UTF-8 encoding in Excel
      const headers = [
        "ID",
        "Hạng mục",
        "Tính năng", 
        "Mô tả",
        "Số lần phải test",
        "Độ ưu tiên",
        "Nền tảng",
        "Điều kiện tiên quyết",
        "Các bước thực hiện",
        "Kết quả mong đợi",
        "Tổng lần test",
        "Passed",
        "Failed",
        "Pass Rate (%)",
        "Completion Rate (%)",
        "Số tester",
        "Tên testers",
        "Trạng thái hiện tại",
        "Lần test cuối",
        "Tester cuối",
        "Ngày tạo"
      ]
      
      // Add BOM for UTF-8
      let csvContent = "\uFEFF" + headers.join(",") + "\n"
      
      testResults.forEach(result => {
        const passRate = result.total_executions > 0 
          ? Math.round((result.passed_executions / result.total_executions) * 100) 
          : 0
        const completionRate = result.so_lan_phai_test > 0
          ? Math.min(Math.round((result.total_executions / result.so_lan_phai_test) * 100), 100)
          : 0
          
        const row = [
          `"${result.test_case_id || ""}"`,
          `"${(result.hang_muc || "").replace(/"/g, '""')}"`,
          `"${(result.tinh_nang || "").replace(/"/g, '""')}"`,
          `"${(result.mo_ta || "").replace(/"/g, '""')}"`,
          `"${result.so_lan_phai_test || ""}"`,
          `"${result.priority || ""}"`,
          `"${result.platform || ""}"`,
          `"${(result.preconditions || "").replace(/"/g, '""')}"`,
          `"${(result.steps || "").replace(/"/g, '""')}"`,
          `"${(result.expected_result || "").replace(/"/g, '""')}"`,
          `"${result.total_executions || 0}"`,
          `"${result.passed_executions || 0}"`,
          `"${result.failed_executions || 0}"`,
          `"${passRate}"`,
          `"${completionRate}"`,
          `"${result.unique_testers || 0}"`,
          `"${(result.tester_names || "").replace(/"/g, '""')}"`,
          `"${result.current_status || 'not_executed'}"`,
          `"${result.last_execution_date ? new Date(result.last_execution_date).toLocaleDateString('vi-VN') : ""}"`,
          `"${(result.last_tester || "").replace(/"/g, '""')}"`,
          `"${result.created_at ? new Date(result.created_at).toLocaleDateString('vi-VN') : ""}"`
        ]
        
        csvContent += row.join(",") + "\n"
      })
      
      // Return CSV file
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${project.name}-detailed-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // For other formats (PDF, Excel), return JSON data for now
    // In a real implementation, you would generate PDF/Excel files here
    return NextResponse.json({
      project: project.name,
      export_date: new Date().toISOString(),
      total_test_cases: testResults.length,
      data: testResults,
      summary: {
        total_executions: testResults.reduce((sum, tc) => sum + (tc.total_executions || 0), 0),
        total_passed: testResults.reduce((sum, tc) => sum + (tc.passed_executions || 0), 0),
        total_failed: testResults.reduce((sum, tc) => sum + (tc.failed_executions || 0), 0),
        unique_testers: new Set(testResults.flatMap(tc => tc.tester_names?.split(', ') || [])).size
      }
    })
    
  } catch (error) {
    console.error("Export project report error:", error)
    return NextResponse.json(
      { error: "Failed to export project report", details: error.message },
      { status: 500 }
    )
  }
}