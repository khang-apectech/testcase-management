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
      // Lấy danh sách các lỗi
      const issuesList = await sql`
        SELECT 
          te.id as execution_id,
          tc.hang_muc,
          tc.tinh_nang,
          te.loi,
          u.name as tester_name,
          te.execution_date
        FROM test_executions te
        JOIN test_cases tc ON tc.id = te.test_case_id
        JOIN users u ON u.id = te.tester_id
        WHERE te.loi != ''
        ORDER BY te.execution_date DESC
      `

      // Chuyển đổi dữ liệu để xuất Excel
      const excelData = issuesList.map(issue => ({
        'Hạng mục': issue.hang_muc,
        'Tính năng': issue.tinh_nang,
        'Mô tả lỗi': issue.loi,
        'Tester phát hiện': issue.tester_name,
        'Ngày phát hiện': new Date(issue.execution_date).toLocaleDateString('vi-VN')
      }))

      // Tạo workbook và worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo lỗi')

      // Tạo buffer từ workbook
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      // Trả về file Excel
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="bao-cao-loi.xlsx"'
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
    console.error("❌ Error exporting issues:", error)
    return NextResponse.json(
      { 
        error: "Server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}