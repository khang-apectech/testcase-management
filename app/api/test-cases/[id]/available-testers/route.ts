import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/test-cases/[id]/available-testers - Get available testers for test case assignment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = await getDbConnection()

    // First, get the project ID from the test case
    const testCaseResult = await sql`
      SELECT project_id FROM test_cases WHERE id = ${params.id}
    `

    if (testCaseResult.length === 0) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    const projectId = testCaseResult[0].project_id

    // Get all testers assigned to this project
    const availableTesters = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        CASE 
          WHEN uta.user_id IS NOT NULL THEN true 
          ELSE false 
        END as already_assigned_to_testcase
      FROM users u
      JOIN user_project_access upa ON u.id = upa.user_id
      LEFT JOIN user_test_assignments uta ON u.id = uta.user_id AND uta.test_case_id = ${params.id}
      WHERE upa.project_id = ${projectId} 
        AND u.role = 'tester' 
        AND COALESCE(u.status, 'active') = 'active'
      ORDER BY u.name ASC
    `

    return NextResponse.json({ users: availableTesters })
  } catch (error) {
    console.error("Get available testers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}