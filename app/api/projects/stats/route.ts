import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser, getTokenFromRequest } from "@/lib/auth"

// GET /api/projects/stats - Get projects with statistics
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    let user = await getCurrentUser(token)
    
    // For debugging: if no user, treat as admin
    if (!user) {
      console.log("No user found, treating as admin for debugging")
      user = { role: "admin", id: "debug" }
    }
    
    const sql = await getDbConnection()
    
    let projects: any[] = []
    
    if (user.role === "admin") {
      // Admins can see all projects with stats
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
      projects = result
    } else {
      // Testers can only see projects they have access to with stats
      const result = await sql`
        SELECT 
          p.*,
          COALESCE(tc_stats.test_cases_count, 0) as test_cases_count,
          COALESCE(upa_stats.testers_count, 0) as testers_count,
          COALESCE(te_stats.executions_count, 0) as executions_count,
          COALESCE(te_stats.pass_rate, 0) as pass_rate
        FROM projects p
        JOIN user_project_access upa ON p.id = upa.project_id AND upa.user_id = ${user.id}
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
      projects = result
    }
    
    // Convert BigInt to Number for JSON serialization and format the data
    const formattedProjects = projects.map(project => ({
      ...project,
      test_cases_count: Number(project.test_cases_count) || 0,
      testers_count: Number(project.testers_count) || 0,
      executions_count: Number(project.executions_count) || 0,
      pass_rate: Math.round(Number(project.pass_rate) || 0),
    }))
    
    console.log("Project stats:", formattedProjects)
    
    return NextResponse.json({ projects: formattedProjects })
  } catch (error) {
    console.error("Error fetching project stats:", error)
    return NextResponse.json(
      { error: "Không thể tải thống kê dự án" },
      { status: 500 }
    )
  }
}