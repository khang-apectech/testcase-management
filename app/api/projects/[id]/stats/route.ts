import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/projects/[id]/stats - Lấy thống kê cho dashboard theo project_id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 Getting dashboard stats for project ${params.id}...`)
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    const projectId = params.id
    
    const sql = await getDbConnection()
    console.log("✅ Database connected")
    
    // Check if user has access to this project
    let hasAccess = false
    if (user.role === "admin") {
      hasAccess = true
    } else {
      const [access] = await sql`
        SELECT 1 FROM user_project_access
        WHERE user_id = ${user.id} AND project_id = ${projectId}
      `
      hasAccess = !!access
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      )
    }
    
    // Check if project exists
    const [project] = await sql`
      SELECT * FROM projects WHERE id = ${projectId}
    `
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get total counts for this project
    const [
      totalTestCases,
      totalExecutions,
      totalUsers,
      totalIssues
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM test_cases WHERE project_id = ${projectId}`,
      sql`SELECT COUNT(*) as count FROM test_executions te 
          JOIN test_cases tc ON te.test_case_id = tc.id 
          WHERE tc.project_id = ${projectId}`,
      sql`SELECT COUNT(DISTINCT upa.user_id) as count 
          FROM user_project_access upa 
          WHERE upa.project_id = ${projectId}`,
      sql`SELECT COUNT(*) as count FROM test_executions te 
          JOIN test_cases tc ON te.test_case_id = tc.id 
          WHERE tc.project_id = ${projectId} AND te.loi != ''`
    ])

    // Get execution trend (last 7 days) for this project
    const executionTrend = await sql`
      WITH dates AS (
        SELECT generate_series(
          date_trunc('day', NOW() - INTERVAL '6 days'),
          date_trunc('day', NOW()),
          '1 day'::interval
        ) as date
      )
      SELECT 
        dates.date::date as date,
        COUNT(te.id) as executions
      FROM dates
      LEFT JOIN test_executions te 
        ON date_trunc('day', te.execution_date) = dates.date
      LEFT JOIN test_cases tc ON te.test_case_id = tc.id AND tc.project_id = ${projectId}
      WHERE tc.id IS NOT NULL
      GROUP BY dates.date
      ORDER BY dates.date
    `

    // Get status distribution for this project
    const statusDistribution = await sql`
      SELECT 
        CASE 
          WHEN te.so_lan_da_test >= tc.so_lan_phai_test THEN 'Hoàn thành'
          WHEN te.so_lan_da_test > 0 THEN 'Đang test'
          ELSE 'Chưa test'
        END as name,
        COUNT(*) as value
      FROM test_cases tc
      LEFT JOIN (
        SELECT 
          test_case_id,
          COUNT(*) as so_lan_da_test
        FROM test_executions
        GROUP BY test_case_id
      ) te ON te.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
      GROUP BY 
        CASE 
          WHEN te.so_lan_da_test >= tc.so_lan_phai_test THEN 'Hoàn thành'
          WHEN te.so_lan_da_test > 0 THEN 'Đang test'
          ELSE 'Chưa test'
        END
    `

    // Get user performance for this project
    const userPerformance = await sql`
      SELECT 
        u.name,
        COUNT(DISTINCT te.id) as executions,
        COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as issues
      FROM users u
      JOIN user_project_access upa ON upa.user_id = u.id
      LEFT JOIN test_executions te ON te.tester_id = u.id
      LEFT JOIN test_cases tc ON te.test_case_id = tc.id
      WHERE u.role = 'tester' 
        AND upa.project_id = ${projectId}
        AND tc.project_id = ${projectId}
      GROUP BY u.id, u.name
      ORDER BY COUNT(DISTINCT te.id) DESC
      LIMIT 5
    `

    // Get recent activity for this project
    const recentActivity = await sql`
      SELECT 
        te.id,
        'execution' as type,
        u.name as user,
        CONCAT('Đã test ', tc.tinh_nang) as description,
        te.execution_date as date
      FROM test_executions te
      JOIN users u ON u.id = te.tester_id
      JOIN test_cases tc ON tc.id = te.test_case_id
      WHERE tc.project_id = ${projectId}
      ORDER BY te.execution_date DESC
      LIMIT 5
    `

    return NextResponse.json({
      totalTestCases: totalTestCases[0].count,
      totalExecutions: totalExecutions[0].count,
      totalUsers: totalUsers[0].count,
      totalIssues: totalIssues[0].count,
      executionTrend: executionTrend.map(day => ({
        date: day.date.toISOString().split('T')[0],
        executions: Number(day.executions)
      })),
      statusDistribution,
      userPerformance,
      recentActivity
    })
  } catch (error) {
    console.error("❌ Error getting dashboard stats:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}