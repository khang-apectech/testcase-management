import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/projects/[id]/available-testers - Get available testers for project assignment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    const { id: projectId } = await params

    // Only admins can view available testers
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can view available testers" },
        { status: 403 }
      )
    }

    const sql = await getDbConnection()
    
    // Check if project exists
    const [existingProject] = await sql`
      SELECT * FROM projects WHERE id = ${projectId}
    `

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Get all active testers with their project counts
    const availableTesters = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role,
        COALESCE(project_stats.projects_count, 0) as projects_count,
        CASE 
          WHEN upa.user_id IS NOT NULL THEN true 
          ELSE false 
        END as already_assigned
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          COUNT(DISTINCT project_id) as projects_count
        FROM user_project_access
        GROUP BY user_id
      ) project_stats ON u.id = project_stats.user_id
      LEFT JOIN user_project_access upa ON u.id = upa.user_id AND upa.project_id = ${projectId}
      WHERE u.role = 'tester' AND COALESCE(u.status, 'active') = 'active'
      ORDER BY u.name ASC
    `

    return NextResponse.json(availableTesters)
  } catch (error) {
    console.error("Error fetching available testers:", error)
    return NextResponse.json(
      { error: "Failed to fetch available testers" },
      { status: 500 }
    )
  }
}