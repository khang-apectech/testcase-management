import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"

// Debug endpoint to test the same query as /api/projects/stats
export async function GET(req: NextRequest) {
  try {
    const sql = await getDbConnection()
    
    // Use same query as admin version from /api/projects/stats
    const result = await sql`
      SELECT 
        p.*,
        COALESCE(tc_stats.test_cases_count, 0) as test_cases_count,
        COALESCE(upa_stats.testers_count, 0) as testers_count,
        COALESCE(te_stats.executions_count, 0) as executions_count,
        COALESCE(te_stats.pass_rate, 0) as pass_rate
      FROM projects p
      LEFT JOIN (
        SELECT project_id, COUNT(*) as test_cases_count
        FROM test_cases 
        GROUP BY project_id
      ) tc_stats ON p.id = tc_stats.project_id
      LEFT JOIN (
        SELECT project_id, COUNT(DISTINCT user_id) as testers_count
        FROM user_project_access 
        GROUP BY project_id
      ) upa_stats ON p.id = upa_stats.project_id
      LEFT JOIN (
        SELECT 
          tc.project_id,
          COUNT(te.id) as executions_count,
          AVG(CASE WHEN te.cam_nhan = 'pass' THEN 1 WHEN te.cam_nhan = 'fail' THEN 0 END) * 100 as pass_rate
        FROM test_executions te
        JOIN test_cases tc ON te.test_case_id = tc.id
        GROUP BY tc.project_id
      ) te_stats ON p.id = te_stats.project_id
      ORDER BY p.name ASC
    `
    
    // Convert BigInt to Number for JSON serialization and format the data
    const formattedProjects = result.map(project => ({
      ...project,
      test_cases_count: Number(project.test_cases_count) || 0,
      testers_count: Number(project.testers_count) || 0,
      executions_count: Number(project.executions_count) || 0,
      pass_rate: Math.round(Number(project.pass_rate) || 0),
    }))
    
    return NextResponse.json({ 
      success: true,
      projects: formattedProjects 
    })
  } catch (error) {
    console.error("Debug project stats error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}