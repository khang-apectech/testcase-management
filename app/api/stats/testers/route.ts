import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/stats/testers - Lấy thống kê chi tiết về testers
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Getting tester stats...")
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    
    if (!currentUser || currentUser.role !== "admin") {
      console.log("❌ Unauthorized access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = await getDbConnection()
    console.log("✅ Database connected")

    try {
      // Get detailed tester stats
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
            WHEN la.last_execution_date IS NULL THEN 'Chưa test'
            WHEN la.last_execution_date < NOW() - INTERVAL '7 days' THEN 'Không hoạt động'
            ELSE 'Đang hoạt động'
          END as status
        FROM users u
        LEFT JOIN test_counts tc ON tc.tester_id = u.id
        LEFT JOIN issue_counts ic ON ic.tester_id = u.id
        LEFT JOIN test_case_counts tcc ON tcc.tester_id = u.id
        LEFT JOIN latest_activity la ON la.tester_id = u.id
        WHERE u.role = 'tester'
        ORDER BY total_executions DESC
      `

      // Không còn sử dụng thống kê theo dự án
      const projectTesterStats = []

      return NextResponse.json({
        testerStats: testerStats.map(tester => ({
          id: tester.id,
          name: tester.name,
          email: tester.email,
          total_executions: Number(tester.total_executions),
          total_issues: Number(tester.total_issues),
          unique_test_cases: Number(tester.unique_test_cases),
          last_execution_date: tester.last_execution_date,
          status: tester.status
        })),
        projectTesterStats: projectTesterStats.map(stat => ({
          user_id: stat.user_id,
          user_name: stat.user_name,
          project_id: stat.project_id,
          project_name: stat.project_name,
          total_executions: Number(stat.total_executions),
          total_issues: Number(stat.total_issues)
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
    console.error("❌ Error getting tester stats:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}