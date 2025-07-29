import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser, getTokenFromRequest } from "@/lib/auth"

// GET /api/projects/stats - Get projects with statistics
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const user = await getCurrentUser(token)
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    const sql = await getDbConnection()
    
    let projects: any[] = []
    
    if (user.role === "admin") {
      // Admins can see all projects with stats - using GROUP BY like admin API
      const result = await sql`
        SELECT 
          p.id,
          p.name,
          p.description,
          'active' as status,
          p.created_at,
          p.updated_at,
          p.created_by,
          p.updated_by,
          COUNT(DISTINCT tc.id) as test_cases_count,
          COUNT(DISTINCT upa.user_id) as testers_count,
          COUNT(DISTINCT te.id) as executions_count,
          COALESCE(
            AVG(CASE WHEN te.cam_nhan = 'pass' THEN 1 WHEN te.cam_nhan = 'fail' THEN 0 END) * 100, 
            0
          ) as pass_rate
        FROM projects p
        LEFT JOIN test_cases tc ON p.id = tc.project_id
        LEFT JOIN user_project_access upa ON p.id = upa.project_id
        LEFT JOIN users u ON upa.user_id = u.id AND u.role = 'tester'
        LEFT JOIN test_executions te ON te.test_case_id = tc.id
        GROUP BY p.id, p.name, p.description, p.created_at, p.updated_at, p.created_by, p.updated_by
        ORDER BY p.name ASC
      `
      projects = result
    } else {
      // Testers can only see projects they have access to with stats
      const result = await sql`
        SELECT 
          p.id,
          p.name,
          p.description,
          'active' as status,
          p.created_at,
          p.updated_at,
          p.created_by,
          p.updated_by,
          COUNT(DISTINCT tc.id) as test_cases_count,
          COUNT(DISTINCT upa_all.user_id) as testers_count,
          COUNT(DISTINCT te.id) as executions_count,
          COALESCE(
            AVG(CASE WHEN te.cam_nhan = 'pass' THEN 1 WHEN te.cam_nhan = 'fail' THEN 0 END) * 100, 
            0
          ) as pass_rate,
          COUNT(DISTINCT CASE WHEN te.tester_id = ${user.id} THEN tc.id END) as my_test_cases
        FROM projects p
        JOIN user_project_access upa ON p.id = upa.project_id AND upa.user_id = ${user.id}
        LEFT JOIN test_cases tc ON p.id = tc.project_id
        LEFT JOIN user_project_access upa_all ON p.id = upa_all.project_id
        LEFT JOIN users u ON upa_all.user_id = u.id AND u.role = 'tester'
        LEFT JOIN test_executions te ON te.test_case_id = tc.id
        GROUP BY p.id, p.name, p.description, p.created_at, p.updated_at, p.created_by, p.updated_by
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