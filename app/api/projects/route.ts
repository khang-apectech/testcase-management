import { NextRequest, NextResponse } from "next/server"
import { getDbConnection, Project } from "@/lib/db"
import { getCurrentUser, getTokenFromRequest } from "@/lib/auth"

// GET /api/projects - Get all projects
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const user = await getCurrentUser(token)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const sql = await getDbConnection()
    
    let projects: Project[] = []
    
    if (user.role === "admin") {
      // Admins can see all projects
      const result = await sql`
        SELECT * FROM projects
        ORDER BY name ASC
      `
      projects = result
    } else {
      // Testers can only see projects they have access to
      const result = await sql`
        SELECT p.* 
        FROM projects p
        JOIN user_project_access upa ON p.id = upa.project_id
        WHERE upa.user_id = ${user.id}
        ORDER BY p.name ASC
      `
      projects = result
    }
    
    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const user = await getCurrentUser(token)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create projects" },
        { status: 403 }
      )
    }
    
    const body = await req.json()
    const { name, description } = body
    
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      )
    }
    
    const sql = await getDbConnection()
    
    // Create the project
    const result = await sql`
      INSERT INTO projects (name, description, created_by, updated_by)
      VALUES (${name}, ${description || null}, ${user.id}, ${user.id})
      RETURNING *
    `
    
    const project = result[0]
    
    // Grant access to the admin who created it
    await sql`
      INSERT INTO user_project_access (user_id, project_id, granted_by)
      VALUES (${user.id}, ${project.id}, ${user.id})
      ON CONFLICT (user_id, project_id) DO NOTHING
    `
    
    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}