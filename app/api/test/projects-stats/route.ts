import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"

// GET /api/test/projects-stats - Test projects stats without auth (for debugging only)
export async function GET(req: NextRequest) {
  try {
    const sql = await getDbConnection()
    
    // Get project stats
    const result = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.created_at,
        COUNT(DISTINCT tc.id) as test_cases_count,
        COUNT(DISTINCT upa.user_id) as testers_count,
        COUNT(DISTINCT te.id) as executions_count,
        COALESCE(AVG(CASE WHEN te.cam_nhan = 'pass' THEN 1 WHEN te.cam_nhan = 'fail' THEN 0 END) * 100, 0) as pass_rate
      FROM projects p
      LEFT JOIN test_cases tc ON p.id = tc.project_id
      LEFT JOIN user_project_access upa ON p.id = upa.project_id
      LEFT JOIN test_executions te ON tc.id = te.test_case_id
      GROUP BY p.id, p.name, p.description, p.created_at
      ORDER BY p.name ASC
    `
    
    // Also get raw counts for debugging
    const rawCounts = await sql`
      SELECT 
        'projects' as table_name, COUNT(*) as count FROM projects
      UNION ALL
      SELECT 
        'test_cases' as table_name, COUNT(*) as count FROM test_cases
      UNION ALL
      SELECT 
        'user_project_access' as table_name, COUNT(*) as count FROM user_project_access
      UNION ALL
      SELECT 
        'test_executions' as table_name, COUNT(*) as count FROM test_executions
    `
    
    // Convert BigInt to Number for JSON serialization
    const formattedProjects = result.map(project => ({
      ...project,
      test_cases_count: Number(project.test_cases_count) || 0,
      testers_count: Number(project.testers_count) || 0,
      executions_count: Number(project.executions_count) || 0,
      pass_rate: Math.round(Number(project.pass_rate) || 0),
    }))
    
    const formattedCounts = rawCounts.map(count => ({
      table_name: count.table_name,
      count: Number(count.count) || 0
    }))
    
    return NextResponse.json({ 
      projects: formattedProjects,
      raw_counts: formattedCounts
    })
  } catch (error) {
    console.error("Error fetching test project stats:", error)
    return NextResponse.json(
      { error: "Không thể tải thống kê dự án", details: error.message },
      { status: 500 }
    )
  }
}