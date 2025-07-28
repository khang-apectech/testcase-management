import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import * as XLSX from 'xlsx'
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Xác thực người dùng
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Kết nối database
    const sql = await getDbConnection()
    console.log("✅ Database connected")

    try {
      // Get tester stats
      const testerStats = await sql`
        WITH 
        test_counts AS (
          SELECT 
            tester_id,
            COUNT(*) as total_executions
          FROM test_executions
          GROUP BY tester_id
        ),
        issue_counts AS (
          SELECT 
            tester_id,
            COUNT(*) as total_issues
          FROM test_executions
          WHERE loi != ''
          GROUP BY tester_id
        ),
        test_case_counts AS (
          SELECT 
            tester_id,
            COUNT(DISTINCT test_case_id) as unique_test_cases
          FROM test_executions
          GROUP BY tester_id
        ),
        latest_activity AS (
          SELECT 
            tester_id,
            MAX(execution_date) as last_execution_date
          FROM test_executions
          GROUP BY tester_id
        )
        SELECT 
          u.id,
          u.name,
          u.email,
          COALESCE(tc.total_executions, 0) as total_executions,
          COALESCE(ic.total_issues, 0) as total_issues,
          COALESCE(tcc.unique_test_cases, 0) as unique_test_cases,
          la.last_execution_date,
          CASE 
            WHEN la.last_execution_date IS NULL THEN 'Chưa hoạt động'
            WHEN la.last_execution_date > NOW() - INTERVAL '7 days' THEN 'Đang hoạt động'
            ELSE 'Không hoạt động'
          END as status
        FROM users u
        LEFT JOIN test_counts tc ON tc.tester_id = u.id
        LEFT JOIN issue_counts ic ON ic.tester_id = u.id
        LEFT JOIN test_case_counts tcc ON tcc.tester_id = u.id
        LEFT JOIN latest_activity la ON la.tester_id = u.id
        WHERE u.role = 'tester'
        ORDER BY total_executions DESC
      `

      // Chuyển đổi dữ liệu để xuất Excel
      const excelData = testerStats.map(tester => ({
        'Tên': tester.name,
        'Email': tester.email,
        'Số lần test': Number(tester.total_executions),
        'Số lỗi tìm thấy': Number(tester.total_issues),
        'Test cases đã test': Number(tester.unique_test_cases),
        'Lần test cuối': tester.last_execution_date ? new Date(tester.last_execution_date).toLocaleDateString('vi-VN') : 'Chưa test',
        'Trạng thái': tester.status
      }))

      // Tạo workbook và worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo tester')

      // Tạo buffer từ workbook
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      // Trả về file Excel
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="bao-cao-tester.xlsx"'
        }
      })
    } catch (dbError) {
      console.error("❌ Database error:", dbError)
      return NextResponse.json(
        { 
          error: "Database error",
          details: dbError instanceof Error ? dbError.message : String(dbError)
        }, 
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("❌ Error exporting testers:", error)
    return NextResponse.json(
      { 
        error: "Server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}