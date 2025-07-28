import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/users/[id] - Lấy chi tiết người dùng và lịch sử test
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 Getting user details for:", params.id)
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    
    if (!currentUser || currentUser.role !== "admin") {
      console.log("❌ Unauthorized access")
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 })
    }

    const sql = await getDbConnection()
    console.log("✅ Database connected")

    // Get user details
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
      WHERE u.id = ${params.id}
      GROUP BY u.id
    `
    console.log("✅ User details fetched")

    if (users.length === 0) {
      console.log("❌ User not found")
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 })
    }

    // Get assigned test cases
    const assignedTests = await sql`
      SELECT 
        tc.*,
        COUNT(DISTINCT te.id) as total_executions,
        COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as total_issues
      FROM test_cases tc
      JOIN user_test_assignments uta ON uta.test_case_id = tc.id
      LEFT JOIN test_executions te ON te.test_case_id = tc.id
      WHERE uta.user_id = ${params.id}
      GROUP BY tc.id
      ORDER BY tc.created_at DESC
    `
    console.log("✅ Assigned test cases fetched:", assignedTests.length)

    // Get test executions
    const executions = await sql`
      SELECT 
        te.*,
        tc.hang_muc,
        tc.tinh_nang
      FROM test_executions te
      JOIN test_cases tc ON tc.id = te.test_case_id
      WHERE te.tester_id = ${params.id}
      ORDER BY te.execution_date DESC
    `
    console.log("✅ Test executions fetched:", executions.length)

    return NextResponse.json({
      user: users[0],
      assignedTests,
      executions,
    })
  } catch (error) {
    console.error("❌ Error getting user details:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Cập nhật thông tin người dùng
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request.headers.get("authorization"))
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 })
    }

    const body = await request.json()
    const { name, role } = body

    if (!name || !role) {
      return NextResponse.json({ error: "Thiếu các trường bắt buộc" }, { status: 400 })
    }

    const sql = await getDbConnection()
    
    // Update user
    const users = await sql`
      UPDATE users 
      SET name = ${name}, role = ${role}
      WHERE id = ${params.id}
      RETURNING id, email, name, role, created_at
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 })
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Lỗi server nội bộ" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Xóa người dùng
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request.headers.get("authorization"))
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 })
    }

    const sql = await getDbConnection()

    // Delete user
    const users = await sql`
      DELETE FROM users 
      WHERE id = ${params.id}
      RETURNING id
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Lỗi server nội bộ" }, { status: 500 })
  }
} 