import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/stats/test-cases - Lấy thống kê chi tiết về test cases
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Getting test case stats...")
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    
    if (!currentUser || currentUser.role !== "admin") {
      console.log("❌ Unauthorized access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

      // Get test case execution details
      const testCaseExecutions = await sql`
        SELECT 
          te.id as execution_id,
          te.test_case_id,
          tc.hang_muc,
          tc.tinh_nang,
          u.name as tester_name,
          te.so_lan_da_test,
          te.cam_nhan,
          te.loi,
          te.execution_date
        FROM test_executions te
        JOIN test_cases tc ON tc.id = te.test_case_id
        JOIN users u ON u.id = te.tester_id
        ORDER BY te.execution_date DESC
      `

      // Get category summary
      const categorySummary = await sql`
        WITH 
        category_counts AS (
          SELECT 
            tc.hang_muc,
            COUNT(DISTINCT tc.id) as total_test_cases,
            SUM(tc.so_lan_phai_test) as total_required_tests
          FROM test_cases tc
          GROUP BY tc.hang_muc
        ),
        execution_counts AS (
          SELECT 
            tc.hang_muc,
            COUNT(DISTINCT te.id) as total_executions,
            COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as total_issues
          FROM test_cases tc
          LEFT JOIN test_executions te ON te.test_case_id = tc.id
          GROUP BY tc.hang_muc
        )
        SELECT 
          cc.hang_muc,
          cc.total_test_cases,
          cc.total_required_tests,
          COALESCE(ec.total_executions, 0) as total_executions,
          COALESCE(ec.total_issues, 0) as total_issues,
          CASE 
            WHEN cc.total_required_tests = 0 THEN 0
            ELSE ROUND((ec.total_executions::float / cc.total_required_tests::float) * 100)
          END as completion_percentage
        FROM category_counts cc
        LEFT JOIN execution_counts ec ON ec.hang_muc = cc.hang_muc
        ORDER BY cc.hang_muc
      `

      return NextResponse.json({
        testCaseStats: testCaseStats.map(tc => ({
          id: tc.id,
          hang_muc: tc.hang_muc,
          tinh_nang: tc.tinh_nang,
          so_lan_phai_test: Number(tc.so_lan_phai_test),
          total_executions: Number(tc.total_executions),
          unique_testers: Number(tc.unique_testers),
          total_issues: Number(tc.total_issues),
          last_execution_date: tc.last_execution_date,
          completion_percentage: Number(tc.completion_percentage)
        })),
        testCaseExecutions: testCaseExecutions.map(exec => ({
          execution_id: exec.execution_id,
          test_case_id: exec.test_case_id,
          hang_muc: exec.hang_muc,
          tinh_nang: exec.tinh_nang,
          tester_name: exec.tester_name,
          so_lan_da_test: Number(exec.so_lan_da_test),
          cam_nhan: exec.cam_nhan,
          loi: exec.loi,
          execution_date: exec.execution_date
        })),
        categorySummary: categorySummary.map(cat => ({
          hang_muc: cat.hang_muc,
          total_test_cases: Number(cat.total_test_cases),
          total_required_tests: Number(cat.total_required_tests),
          total_executions: Number(cat.total_executions),
          total_issues: Number(cat.total_issues),
          completion_percentage: Number(cat.completion_percentage)
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
    console.error("❌ Error getting test case stats:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}