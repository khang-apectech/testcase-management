import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/test-cases/[id] - Lấy chi tiết test case
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
    
    // Phân quyền: chỉ admin hoặc tester được phân công mới xem được test case
    if (currentUser.role !== "admin") {
      const assigned = await sql`
        SELECT 1 FROM user_test_assignments WHERE test_case_id = ${params.id} AND user_id = ${currentUser.id}
      `
      if (assigned.length === 0) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Get test case details
    const testCases = await sql`
      SELECT 
        tc.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as created_by,
        ARRAY_AGG(
          DISTINCT jsonb_build_object(
            'id', tester.id,
            'name', tester.name,
            'email', tester.email
          )
        ) FILTER (WHERE tester.id IS NOT NULL) as assigned_testers
      FROM test_cases tc
      LEFT JOIN users u ON tc.created_by = u.id
      LEFT JOIN user_test_assignments uta ON uta.test_case_id = tc.id
      LEFT JOIN users tester ON tester.id = uta.user_id
      WHERE tc.id = ${params.id}
      GROUP BY tc.id, u.id, u.name, u.email
    `

    if (testCases.length === 0) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    // Get test executions
    const executions = await sql`
      SELECT 
        te.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as tester
      FROM test_executions te
      LEFT JOIN users u ON te.tester_id = u.id
      WHERE te.test_case_id = ${params.id}
      ORDER BY te.execution_date DESC
    `

    return NextResponse.json({
      testCase: {
        ...testCases[0],
        executions
      }
    })
  } catch (error) {
    console.error("Get test case error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/test-cases/[id] - Cập nhật test case
export async function PUT(
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
    const { hang_muc, tinh_nang, mo_ta, so_lan_phai_test, priority } = body

    if (!hang_muc || !tinh_nang || !mo_ta || !so_lan_phai_test || !priority) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sql = await getDbConnection()

    // Check if test case exists
    const existingTestCase = await sql`
      SELECT id FROM test_cases WHERE id = ${params.id}
    `

    if (existingTestCase.length === 0) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    // Update test case
    const testCases = await sql`
      UPDATE test_cases
      SET
        hang_muc = ${hang_muc},
        tinh_nang = ${tinh_nang},
        mo_ta = ${mo_ta},
        so_lan_phai_test = ${so_lan_phai_test},
        priority = ${priority},
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    return NextResponse.json({ testCase: testCases[0] })
  } catch (error) {
    console.error("Update test case error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/test-cases/[id] - Xóa test case
export async function DELETE(
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

    // Delete test case and all related records
    await sql`
      DELETE FROM test_executions WHERE test_case_id = ${params.id}
    `
    await sql`
      DELETE FROM user_test_assignments WHERE test_case_id = ${params.id}
    `
    const testCases = await sql`
      DELETE FROM test_cases WHERE id = ${params.id}
      RETURNING id
    `

    if (testCases.length === 0) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete test case error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 