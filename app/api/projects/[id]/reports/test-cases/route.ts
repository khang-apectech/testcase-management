import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/projects/[id]/reports/test-cases - Lấy báo cáo về test cases theo project_id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 Getting test case reports for project ${params.id}...`)
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    const projectId = params.id
    
    // Only admin can access reports
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const sql = await getDbConnection()
    console.log("✅ Database connected")
    
    // Check if project exists
    const [project] = await sql`
      SELECT * FROM projects WHERE id = ${projectId}
    `
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Thống kê chi tiết từng test case
    const testCaseStats = await sql`
      SELECT 
        tc.id,
        tc.hang_muc,
        tc.tinh_nang,
        tc.so_lan_phai_test,
        COUNT(DISTINCT te.id) as total_executions,
        COUNT(DISTINCT te.tester_id) as unique_testers,
        COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as total_issues,
        MAX(te.execution_date) as last_execution_date,
        CASE 
          WHEN tc.so_lan_phai_test > 0 THEN 
            ROUND((COUNT(DISTINCT te.id)::float / tc.so_lan_phai_test::float) * 100)
          ELSE 0
        END as completion_percentage
      FROM test_cases tc
      LEFT JOIN test_executions te ON te.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
      GROUP BY tc.id, tc.hang_muc, tc.tinh_nang, tc.so_lan_phai_test
      ORDER BY tc.hang_muc, tc.tinh_nang
    `

    // Thống kê các lần thực thi test case
    const testCaseExecutions = await sql`
      SELECT 
        te.id as execution_id,
        tc.id as test_case_id,
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
      WHERE tc.project_id = ${projectId}
      ORDER BY te.execution_date DESC
      LIMIT 100
    `

    // Tổng hợp theo hạng mục
    const categorySummary = await sql`
      SELECT 
        tc.hang_muc,
        COUNT(DISTINCT tc.id) as total_test_cases,
        SUM(tc.so_lan_phai_test) as total_required_tests,
        COUNT(DISTINCT te.id) as total_executions,
        COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as total_issues,
        CASE 
          WHEN SUM(tc.so_lan_phai_test) > 0 THEN 
            ROUND((COUNT(DISTINCT te.id)::float / SUM(tc.so_lan_phai_test)::float) * 100)
          ELSE 0
        END as completion_percentage
      FROM test_cases tc
      LEFT JOIN test_executions te ON te.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
      GROUP BY tc.hang_muc
      ORDER BY tc.hang_muc
    `

    return NextResponse.json({
      testCaseStats,
      testCaseExecutions,
      categorySummary
    })
  } catch (error) {
    console.error("❌ Error getting test case reports:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}