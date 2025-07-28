import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// POST /api/test-cases/[id]/assign - Phân công người test
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const sql = await getDbConnection()

    // Check if test case exists
    const testCases = await sql`
      SELECT id FROM test_cases WHERE id = ${params.id}
    `

    if (testCases.length === 0) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    // Remove existing assignments
    await sql`
      DELETE FROM user_test_assignments
      WHERE test_case_id = ${params.id}
    `

    // Add new assignments
    if (userIds.length > 0) {
      await sql`
        INSERT INTO user_test_assignments (test_case_id, user_id)
        SELECT ${params.id}, id
        FROM users
        WHERE id = ANY(${userIds})
      `
    }

    // Get updated assignments
    const assignments = await sql`
      SELECT 
        u.id,
        u.name,
        u.email
      FROM user_test_assignments uta
      JOIN users u ON u.id = uta.user_id
      WHERE uta.test_case_id = ${params.id}
    `

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("Assign testers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/test-cases/[id]/assign - Lấy danh sách người được phân công
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = await getDbConnection()

    // Get assignments
    const assignments = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(te.id) as total_executions,
        COUNT(CASE WHEN te.loi != '' AND te.loi IS NOT NULL THEN te.id END) as total_issues
      FROM user_test_assignments uta
      JOIN users u ON u.id = uta.user_id
      LEFT JOIN test_executions te ON te.test_case_id = uta.test_case_id AND te.tester_id = u.id
      WHERE uta.test_case_id = ${params.id}
      GROUP BY u.id, u.name, u.email
    `

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("Get assignments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 