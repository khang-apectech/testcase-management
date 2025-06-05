import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/users - Lấy danh sách users
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Getting users list...")
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    
    if (!currentUser || currentUser.role !== "admin") {
      console.log("❌ Unauthorized access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = await getDbConnection()
    console.log("✅ Database connected")

    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.created_at,
        COUNT(DISTINCT uta.test_case_id) as total_assigned_tests,
        COUNT(DISTINCT te.id) as total_executions
      FROM users u
      LEFT JOIN user_test_assignments uta ON uta.user_id = u.id
      LEFT JOIN test_executions te ON te.tester_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `
    console.log("✅ Users fetched:", users.length)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("❌ Error getting users:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}

// POST /api/users - Tạo user mới
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Creating new user...")
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    
    if (!currentUser || currentUser.role !== "admin") {
      console.log("❌ Unauthorized access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, role, password } = body

    if (!email || !name || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sql = await getDbConnection()
    console.log("✅ Database connected")

    // Check if email already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Create new user
    const users = await sql`
      INSERT INTO users (
        email,
        name,
        role,
        password,
        created_at
      ) VALUES (
        ${email},
        ${name},
        ${role},
        ${password},
        NOW()
      )
      RETURNING id, email, name, role, created_at
    `
    console.log("✅ User created:", users[0])

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("❌ Error creating user:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
} 