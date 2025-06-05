import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// POST /api/test-cases/[id]/execute - Ghi nhận kết quả test
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { cam_nhan, loi } = body

    if (!cam_nhan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sql = await getDbConnection()

    // Get test case details
    const testCases = await sql`
      SELECT *
      FROM test_cases
      WHERE id = ${params.id}
    `

    if (testCases.length === 0) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    // Get current execution count for this tester
    const executions = await sql`
      SELECT COUNT(*) as count
      FROM test_executions
      WHERE test_case_id = ${params.id} AND tester_id = ${currentUser.id}
    `

    const currentCount = parseInt(executions[0].count)
    if (currentCount >= testCases[0].so_lan_phai_test) {
      return NextResponse.json(
        { error: "You have reached the maximum number of test executions for this test case" },
        { status: 400 }
      )
    }

    // Record test execution
    const testExecution = await sql`
      INSERT INTO test_executions (
        test_case_id,
        tester_id,
        so_lan_da_test,
        cam_nhan,
        loi,
        execution_date
      )
      VALUES (
        ${params.id},
        ${currentUser.id},
        ${currentCount + 1},
        ${cam_nhan},
        ${loi || ""},
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json({ testExecution: testExecution[0] })
  } catch (error) {
    console.error("Record test execution error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 