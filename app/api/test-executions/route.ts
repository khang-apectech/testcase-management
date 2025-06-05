import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { getCurrentUser } = await import("@/lib/auth")
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { testCaseId, so_lan_da_test, cam_nhan, loi, execution_date } = await request.json()

    if (!testCaseId || so_lan_da_test === undefined) {
      return NextResponse.json({ error: "Test case ID và số lần đã test là bắt buộc" }, { status: 400 })
    }

    // Check if user has access to this test case
    if (user.role !== "admin") {
      const { getDbConnection } = await import("@/lib/db")
      const sql = await getDbConnection()

      const assignments = await sql`
        SELECT 1 FROM user_test_assignments 
        WHERE user_id = ${user.id} AND test_case_id = ${testCaseId}
      `

      if (assignments.length === 0) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    const { getDbConnection } = await import("@/lib/db")
    const sql = await getDbConnection()

    // Check if execution already exists for this user and test case
    const existingExecution = await sql`
      SELECT id FROM test_executions 
      WHERE test_case_id = ${testCaseId} AND tester_id = ${user.id}
    `

    let result

    if (existingExecution.length > 0) {
      // Update existing execution
      result = await sql`
        UPDATE test_executions 
        SET 
          so_lan_da_test = ${so_lan_da_test},
          cam_nhan = ${cam_nhan || ""},
          loi = ${loi || ""},
          execution_date = ${execution_date || new Date().toISOString().split("T")[0]},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingExecution[0].id}
        RETURNING *
      `
    } else {
      // Create new execution
      result = await sql`
        INSERT INTO test_executions (test_case_id, tester_id, so_lan_da_test, cam_nhan, loi, execution_date)
        VALUES (${testCaseId}, ${user.id}, ${so_lan_da_test}, ${cam_nhan || ""}, ${loi || ""}, ${execution_date || new Date().toISOString().split("T")[0]})
        RETURNING *
      `
    }

    return NextResponse.json({ execution: result[0] })
  } catch (error) {
    console.error("Create/Update test execution error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { getCurrentUser } = await import("@/lib/auth")
    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { getDbConnection } = await import("@/lib/db")
    const sql = await getDbConnection()

    let executions

    if (user.role === "admin") {
      executions = await sql`
        SELECT 
          te.*,
          tc.hang_muc,
          tc.tinh_nang,
          tc.so_lan_phai_test,
          u.name as tester_name
        FROM test_executions te
        JOIN test_cases tc ON te.test_case_id = tc.id
        JOIN users u ON te.tester_id = u.id
        ORDER BY te.created_at DESC
      `
    } else {
      executions = await sql`
        SELECT 
          te.*,
          tc.hang_muc,
          tc.tinh_nang,
          tc.so_lan_phai_test,
          u.name as tester_name
        FROM test_executions te
        JOIN test_cases tc ON te.test_case_id = tc.id
        JOIN users u ON te.tester_id = u.id
        WHERE te.tester_id = ${user.id}
        ORDER BY te.created_at DESC
      `
    }

    return NextResponse.json({ executions })
  } catch (error) {
    console.error("Get test executions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
