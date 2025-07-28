import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/stats/issues - Lấy thống kê chi tiết về lỗi
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Getting issues stats...")
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    
    if (!currentUser || currentUser.role !== "admin") {
      console.log("❌ Unauthorized access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

      // Thống kê lỗi theo hạng mục
      const issuesByCategory = await sql`
        SELECT 
          tc.hang_muc,
          COUNT(*) as count
        FROM test_executions te
        JOIN test_cases tc ON tc.id = te.test_case_id
        WHERE te.loi != ''
        GROUP BY tc.hang_muc
        ORDER BY count DESC
      `

      // Thống kê lỗi theo tester
      const issuesByTester = await sql`
        SELECT 
          u.name as tester_name,
          COUNT(*) as count
        FROM test_executions te
        JOIN users u ON u.id = te.tester_id
        WHERE te.loi != ''
        GROUP BY u.name
        ORDER BY count DESC
      `

      return NextResponse.json({
        issuesList: issuesList.map(issue => ({
          execution_id: issue.execution_id,
          hang_muc: issue.hang_muc,
          tinh_nang: issue.tinh_nang,
          loi: issue.loi,
          tester_name: issue.tester_name,
          execution_date: issue.execution_date
        })),
        issuesByCategory: issuesByCategory.map(cat => ({
          hang_muc: cat.hang_muc,
          count: Number(cat.count)
        })),
        issuesByTester: issuesByTester.map(tester => ({
          tester_name: tester.tester_name,
          count: Number(tester.count)
        }))
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
    console.error("❌ Error getting issues stats:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}