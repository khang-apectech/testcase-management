import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"

// Simple debug endpoint to check database
export async function GET(req: NextRequest) {
  try {
    const sql = await getDbConnection()
    
    // Check if tables exist and get row counts
    const projectCount = await sql`SELECT COUNT(*) as count FROM projects`
    const testCaseCount = await sql`SELECT COUNT(*) as count FROM test_cases`
    const executionCount = await sql`SELECT COUNT(*) as count FROM test_executions`
    const userProjectCount = await sql`SELECT COUNT(*) as count FROM user_project_access`
    
    // Get a sample project with stats using improved query
    const sampleProject = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.created_at,
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
      LIMIT 3
    `
    
    return NextResponse.json({
      success: true,
      table_counts: {
        projects: Number(projectCount[0].count),
        test_cases: Number(testCaseCount[0].count),
        executions: Number(executionCount[0].count),
        user_project_access: Number(userProjectCount[0].count)
      },
      sample_projects: sampleProject.map(p => ({
        ...p,
        test_cases_count: Number(p.test_cases_count),
        testers_count: Number(p.testers_count),
        executions_count: Number(p.executions_count),
        pass_rate: Math.round(Number(p.pass_rate) || 0)
      }))
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}