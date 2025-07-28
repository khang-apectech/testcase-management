import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/export/apec-space - Export APEC SPACE test results to CSV
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can export test results" },
        { status: 403 }
      )
    }

    const sql = await getDbConnection()
    
    // First, find the APEC SPACE project
    const projectResult = await sql`
      SELECT id, name FROM projects WHERE name LIKE ${'%Apec Space%'} OR name LIKE ${'%APEC SPACE%'} OR name LIKE ${'%APEC-SPACE%'} LIMIT 1
    `
    
    if (projectResult.length === 0) {
      return NextResponse.json(
        { error: "APEC SPACE project not found" },
        { status: 404 }
      )
    }
    
    const projectId = projectResult[0].id
    const projectName = projectResult[0].name
    
    // Get all test cases and their executions for the APEC SPACE project
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
        te.id as execution_id,
        te.so_lan_da_test,
        te.cam_nhan,
        te.loi,
        te.execution_date,
        u.name as tester_name,
        u.email as tester_email
      FROM test_cases tc
      LEFT JOIN test_executions te ON te.test_case_id = tc.id
      LEFT JOIN users u ON te.tester_id = u.id
      WHERE tc.project_id = ${projectId}
      ORDER BY tc.hang_muc, tc.tinh_nang, te.execution_date DESC
    `
    
    if (testResults.length === 0) {
      return NextResponse.json(
        { error: "No test results found for APEC SPACE project" },
        { status: 404 }
      )
    }
    
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
      "Số lần đã test",
      "Cảm nhận",
      "Lỗi",
      "Ngày test",
      "Người test",
      "Email người test"
    ]
    
    // Add BOM for UTF-8
    let csvContent = "\uFEFF" + headers.join(",") + "\n"
    
    testResults.forEach(result => {
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
        `"${result.so_lan_da_test || ""}"`,
        `"${(result.cam_nhan || "").replace(/"/g, '""')}"`,
        `"${(result.loi || "").replace(/"/g, '""')}"`,
        `"${result.execution_date ? new Date(result.execution_date).toLocaleDateString('vi-VN') : ""}"`,
        `"${(result.tester_name || "").replace(/"/g, '""')}"`,
        `"${(result.tester_email || "").replace(/"/g, '""')}"`,
      ]
      
      csvContent += row.join(",") + "\n"
    })
    
    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="APEC-SPACE-test-results-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
    
  } catch (error) {
    console.error("Export APEC SPACE test results error:", error)
    return NextResponse.json(
      { error: "Failed to export APEC SPACE test results", details: error.message },
      { status: 500 }
    )
  }
}