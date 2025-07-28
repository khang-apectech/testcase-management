import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/projects/[id]/reports/testers - Lấy báo cáo về testers theo project_id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 Getting tester reports for project ${params.id}...`)
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

    // Thống kê theo tester cho project này
    const testerStats = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT te.id) as total_executions,
        COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as total_issues,
        COUNT(DISTINCT te.test_case_id) as unique_test_cases,
        MAX(te.execution_date) as last_execution_date,
        CASE 
          WHEN COUNT(DISTINCT te.id) > 0 THEN 'Active'
          ELSE 'Inactive'
        END as status
      FROM users u
      JOIN user_project_access upa ON upa.user_id = u.id
      LEFT JOIN test_executions te ON te.tester_id = u.id
      LEFT JOIN test_cases tc ON te.test_case_id = tc.id
      WHERE u.role = 'tester' 
        AND upa.project_id = ${projectId}
        AND (tc.project_id = ${projectId} OR tc.project_id IS NULL)
      GROUP BY u.id, u.name, u.email
      ORDER BY total_executions DESC
    `

    // Thống kê theo tester và project
    const projectTesterStats = await sql`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        p.id as project_id,
        p.name as project_name,
        COUNT(DISTINCT te.id) as total_executions,
        COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as total_issues
      FROM users u
      JOIN user_project_access upa ON upa.user_id = u.id
      JOIN projects p ON p.id = upa.project_id
      LEFT JOIN test_executions te ON te.tester_id = u.id
      LEFT JOIN test_cases tc ON te.test_case_id = tc.id AND tc.project_id = p.id
      WHERE u.role = 'tester' 
        AND p.id = ${projectId}
      GROUP BY u.id, u.name, p.id, p.name
      ORDER BY total_executions DESC
    `

    return NextResponse.json({
      testerStats,
      projectTesterStats
    })
  } catch (error) {
    console.error("❌ Error getting tester reports:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}