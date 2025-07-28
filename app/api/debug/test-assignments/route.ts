import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/debug/test-assignments - Debug endpoint to test assignments
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can access debug endpoints" },
        { status: 403 }
      )
    }

    const sql = await getDbConnection()
    
    // Get all project assignments
    const projectAssignments = await sql`
      SELECT 
        upa.id,
        upa.user_id,
        upa.project_id,
        u.name as user_name,
        u.email as user_email,
        p.name as project_name,
        upa.granted_at
      FROM user_project_access upa
      JOIN users u ON upa.user_id = u.id
      JOIN projects p ON upa.project_id = p.id
      ORDER BY upa.granted_at DESC
    `
    
    // Get all test case assignments
    const testCaseAssignments = await sql`
      SELECT 
        uta.id,
        uta.user_id,
        uta.test_case_id,
        u.name as user_name,
        u.email as user_email,
        tc.hang_muc,
        tc.tinh_nang,
        p.name as project_name,
        uta.assigned_at
      FROM user_test_assignments uta
      JOIN users u ON uta.user_id = u.id
      JOIN test_cases tc ON uta.test_case_id = tc.id
      JOIN projects p ON tc.project_id = p.id
      ORDER BY uta.assigned_at DESC
    `
    
    // Get all users
    const users = await sql`
      SELECT 
        id,
        name,
        email,
        role,
        status,
        created_at
      FROM users
      ORDER BY created_at DESC
    `
    
    // Get all projects
    const projects = await sql`
      SELECT 
        id,
        name,
        description,
        created_at
      FROM projects
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      projectAssignments,
      testCaseAssignments,
      users,
      projects,
      summary: {
        totalUsers: users.length,
        totalProjects: projects.length,
        totalProjectAssignments: projectAssignments.length,
        totalTestCaseAssignments: testCaseAssignments.length
      }
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      { error: "Failed to fetch debug data", details: error.message },
      { status: 500 }
    )
  }
}