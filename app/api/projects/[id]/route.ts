import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/projects/[id] - Get a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    const { id } = await params
    const sql = await getDbConnection()

    // Check if user has access to this project
    let hasAccess = false
    
    if (user.role === "admin") {
      hasAccess = true
    } else {
      const [access] = await sql`
        SELECT 1 FROM user_project_access
        WHERE user_id = ${user.id} AND project_id = ${id}
      `
      hasAccess = !!access
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      )
    }

    // Get project details
    const [project] = await sql`
      SELECT p.*, u.name as created_by_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ${id}
    `

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Get testers with access to this project
    const testers = await sql`
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN user_project_access upa ON u.id = upa.user_id
      WHERE upa.project_id = ${id} AND u.role = 'tester'
    `

    return NextResponse.json({ 
      project,
      testers
    })
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    
    // Only admins can update projects
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can update projects" },
        { status: 403 }
      )
    }

    const { id } = await params
    const { name, description } = await req.json()
    
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      )
    }

    const sql = await getDbConnection()
    
    // Check if project exists
    const [existingProject] = await sql`
      SELECT * FROM projects WHERE id = ${id}
    `

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Update the project
    const [updatedProject] = await sql`
      UPDATE projects
      SET name = ${name}, 
          description = ${description || ""}, 
          updated_at = NOW(),
          updated_by = ${user.id}
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ 
      success: true, 
      project: updatedProject 
    })
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    
    // Only admins can delete projects
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can delete projects" },
        { status: 403 }
      )
    }

    const { id } = await params
    const sql = await getDbConnection()
    
    // Check if project exists
    const [existingProject] = await sql`
      SELECT * FROM projects WHERE id = ${id}
    `

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Delete the project (cascade will handle related records)
    await sql`
      DELETE FROM projects WHERE id = ${id}
    `

    return NextResponse.json({ 
      success: true,
      message: "Project deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    )
  }
}