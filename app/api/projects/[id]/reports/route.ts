import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/projects/[id]/reports - Lấy báo cáo theo project_id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 Getting reports for project ${params.id}...`)
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

    // Summary statistics
    const summary = await sql`
      SELECT 
        COUNT(DISTINCT tc.id) as totalTestCases,
        COUNT(DISTINCT CASE WHEN te.id IS NOT NULL THEN tc.id END) as executedTestCases,
        COUNT(te.id) as totalExecutions,
        COUNT(CASE WHEN te.loi IS NULL OR te.loi = '' THEN 1 END) as passedExecutions,
        COUNT(CASE WHEN te.loi IS NOT NULL AND te.loi != '' THEN 1 END) as failedExecutions,
        CASE 
          WHEN COUNT(te.id) > 0 
          THEN ROUND(COUNT(CASE WHEN te.loi IS NULL OR te.loi = '' THEN 1 END) * 100.0 / COUNT(te.id), 1)
          ELSE 0 
        END as passRate
      FROM test_cases tc
      LEFT JOIN test_executions te ON te.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
    `

    // Recent executions
    const recentExecutions = await sql`
      SELECT 
        te.id,
        te.execution_date as executed_at,
        u.name as executed_by,
        tc.hang_muc as test_case_title,
        CASE 
          WHEN te.loi IS NULL OR te.loi = '' THEN 'passed'
          ELSE 'failed'
        END as status
      FROM test_executions te
      JOIN test_cases tc ON te.test_case_id = tc.id
      LEFT JOIN users u ON te.tester_id = u.id
      WHERE tc.project_id = ${projectId}
      ORDER BY te.execution_date DESC
      LIMIT 10
    `

    // Test coverage by platform/category
    const coverage = await sql`
      SELECT 
        tc.platform,
        COUNT(DISTINCT tc.id) as totalTestCases,
        COUNT(DISTINCT te.test_case_id) as executedTestCases,
        CASE 
          WHEN COUNT(DISTINCT tc.id) > 0 
          THEN ROUND(COUNT(DISTINCT te.test_case_id) * 100.0 / COUNT(DISTINCT tc.id), 1)
          ELSE 0 
        END as coveragePercentage
      FROM test_cases tc
      LEFT JOIN test_executions te ON te.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
      GROUP BY tc.platform
      ORDER BY tc.platform
    `

    return NextResponse.json({
      summary: summary[0] ? {
        totalTestCases: summary[0].totaltestcases || 0,
        executedTestCases: summary[0].executedtestcases || 0,
        totalExecutions: summary[0].totalexecutions || 0,
        passedExecutions: summary[0].passedexecutions || 0,
        failedExecutions: summary[0].failedexecutions || 0,
        passRate: summary[0].passrate || 0
      } : {
        totalTestCases: 0,
        executedTestCases: 0,
        totalExecutions: 0,
        passedExecutions: 0,
        failedExecutions: 0,
        passRate: 0
      },
      recentExecutions: recentExecutions || [],
      coverage: coverage || []
    })
  } catch (error) {
    console.error("❌ Error getting reports:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}