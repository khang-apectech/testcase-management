import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/projects/[id]/testers - Get testers assigned to a project
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

    const sql = await getDbConnection()
    
    // Check if project exists and user has access
    const [existingProject] = await sql`
      SELECT p.* FROM projects p
      LEFT JOIN user_project_access upa ON p.id = upa.project_id
      WHERE p.id = ${projectId} 
      AND (${user.role} = 'admin' OR upa.user_id = ${user.id})
    `

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      )
    }

    // Get testers assigned to this project with their test case counts
    const testers = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role,
        COALESCE(tc_count.count, 0) as assigned_test_cases
      FROM users u
      JOIN user_project_access upa ON u.id = upa.user_id
      LEFT JOIN (
        SELECT 
          uta.user_id,
          COUNT(*) as count
        FROM user_test_assignments uta
        JOIN test_cases tc ON uta.test_case_id = tc.id
        WHERE tc.project_id = ${projectId}
        GROUP BY uta.user_id
      ) tc_count ON u.id = tc_count.user_id
      WHERE upa.project_id = ${projectId} AND u.role = 'tester'
      ORDER BY u.name ASC
    `

    return NextResponse.json(testers)
  } catch (error) {
    console.error("Error fetching project testers:", error)
    return NextResponse.json(
      { error: "Failed to fetch project testers" },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/testers - Assign testers to a project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    
    // Only admins can assign testers to projects
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can assign testers to projects" },
        { status: 403 }
      )
    }

    const { id: projectId } = await params
    const { testerIds } = await req.json()
    
    if (!Array.isArray(testerIds) || testerIds.length === 0) {
      return NextResponse.json(
        { error: "At least one tester ID is required" },
        { status: 400 }
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

    // Verify all testers exist and are actually testers
    const testers = await sql`
      SELECT id FROM users 
      WHERE id = ANY(${testerIds}) AND role = 'tester'
    `

    if (testers.length !== testerIds.length) {
      return NextResponse.json(
        { error: "One or more tester IDs are invalid" },
        { status: 400 }
      )
    }

    // Add testers to the project
    for (const testerId of testerIds) {
      await sql`
        INSERT INTO user_project_access (user_id, project_id, granted_by)
        VALUES (${testerId}, ${projectId}, ${user.id})
        ON CONFLICT (user_id, project_id) DO NOTHING
      `
    }

    // Get updated list of testers for this project
    const updatedTesters = await sql`
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN user_project_access upa ON u.id = upa.user_id
      WHERE upa.project_id = ${projectId} AND u.role = 'tester'
    `

    return NextResponse.json({ 
      success: true,
      testers: updatedTesters
    })
  } catch (error) {
    console.error("Error assigning testers to project:", error)
    return NextResponse.json(
      { error: "Failed to assign testers to project" },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/testers - Remove testers from a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    
    // Only admins can remove testers from projects
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can remove testers from projects" },
        { status: 403 }
      )
    }

    const { id: projectId } = await params
    const { testerIds } = await req.json()
    
    if (!Array.isArray(testerIds) || testerIds.length === 0) {
      return NextResponse.json(
        { error: "At least one tester ID is required" },
        { status: 400 }
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

    // Remove testers from the project
    await sql`
      DELETE FROM user_project_access
      WHERE project_id = ${projectId} AND user_id = ANY(${testerIds})
    `

    // Get updated list of testers for this project
    const updatedTesters = await sql`
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN user_project_access upa ON u.id = upa.user_id
      WHERE upa.project_id = ${projectId} AND u.role = 'tester'
    `

    return NextResponse.json({ 
      success: true,
      testers: updatedTesters
    })
  } catch (error) {
    console.error("Error removing testers from project:", error)
    return NextResponse.json(
      { error: "Failed to remove testers from project" },
      { status: 500 }
    )
  }
}