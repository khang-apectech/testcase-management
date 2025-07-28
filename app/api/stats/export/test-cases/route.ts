import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import * as XLSX from 'xlsx'
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Xác thực người dùng từ query parameter, cookie hoặc header
    const tokenFromQuery = request.nextUrl.searchParams.get("token")
    const token = tokenFromQuery || 
                  request.cookies.get("token")?.value || 
                  request.headers.get("Authorization")?.split(" ")[1]
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Kết nối database
    const sql = await getDbConnection()
    console.log("✅ Database connected")

    try {
      // Get detailed test case stats
      const testCaseStats = await sql`
        WITH 
        execution_counts AS (
          SELECT 
            test_case_id,
            COUNT(*) as total_executions,
            COUNT(DISTINCT tester_id) as unique_testers,
            MAX(execution_date) as last_execution_date
          FROM test_executions
          GROUP BY test_case_id
        ),
        issue_counts AS (
          SELECT 
            test_case_id,
            COUNT(*) as total_issues
          FROM test_executions
          WHERE loi != ''
          GROUP BY test_case_id
        )
        SELECT 
          tc.id,
          tc.hang_muc,
          tc.tinh_nang,
          tc.so_lan_phai_test,
          COALESCE(ec.total_executions, 0) as total_executions,
          COALESCE(ec.unique_testers, 0) as unique_testers,
          COALESCE(ic.total_issues, 0) as total_issues,
          ec.last_execution_date,
          CASE 
            WHEN ec.total_executions IS NULL THEN 0
            WHEN ec.total_executions >= tc.so_lan_phai_test THEN 100
            ELSE ROUND((ec.total_executions::float / tc.so_lan_phai_test::float) * 100)
          END as completion_percentage
        FROM test_cases tc
        LEFT JOIN execution_counts ec ON ec.test_case_id = tc.id
        LEFT JOIN issue_counts ic ON ic.test_case_id = tc.id
        ORDER BY tc.hang_muc, tc.tinh_nang
      `

      // Chuyển đổi dữ liệu để xuất Excel
      const excelData = testCaseStats.map(tc => ({
        'Hạng mục': tc.hang_muc,
        'Tính năng': tc.tinh_nang,
        'Số lần phải test': Number(tc.so_lan_phai_test),
        'Số lần đã test': Number(tc.total_executions),
        'Số tester tham gia': Number(tc.unique_testers),
        'Số lỗi phát hiện': Number(tc.total_issues),
        'Lần test cuối': tc.last_execution_date ? new Date(tc.last_execution_date).toLocaleDateString('vi-VN') : 'Chưa test',
        'Tiến độ (%)': Number(tc.completion_percentage)
      }))

      // Tạo workbook và worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo test case')

      // Tạo buffer từ workbook
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      // Trả về file Excel
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="bao-cao-test-case.xlsx"'
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
    console.error("❌ Error exporting test cases:", error)
    return NextResponse.json(
      { 
        error: "Server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}