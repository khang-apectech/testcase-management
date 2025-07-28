import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/projects/[id]/reports/issues - Lấy báo cáo về issues theo project_id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 Getting issues reports for project ${params.id}...`)
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    const projectId = params.id
    
    // Only admin can access reports
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const sql = await getDbConnection()
    console.log("✅ Database connected")
    
    // Check if project exists
    const [project] = await sql`
      SELECT * FROM projects WHERE id = ${projectId}
    `
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Danh sách các lỗi
    const issuesList = await sql`
      SELECT 
        te.id as execution_id,
        tc.hang_muc,
        tc.tinh_nang,
        te.loi,
        u.name as tester_name,
        te.execution_date
      FROM test_executions te
      JOIN test_cases tc ON tc.id = te.test_case_id
      JOIN users u ON u.id = te.tester_id
      WHERE tc.project_id = ${projectId} AND te.loi != ''
      ORDER BY te.execution_date DESC
    `

    // Thống kê lỗi theo hạng mục
    const issuesByCategory = await sql`
      SELECT 
        tc.hang_muc,
        COUNT(DISTINCT te.id) as count
      FROM test_executions te
      JOIN test_cases tc ON tc.id = te.test_case_id
      WHERE tc.project_id = ${projectId} AND te.loi != ''
      GROUP BY tc.hang_muc
      ORDER BY count DESC
    `

    // Thống kê lỗi theo tester
    const issuesByTester = await sql`
      SELECT 
        u.name as tester_name,
        COUNT(DISTINCT te.id) as count
      FROM test_executions te
      JOIN test_cases tc ON tc.id = te.test_case_id
      JOIN users u ON u.id = te.tester_id
      WHERE tc.project_id = ${projectId} AND te.loi != ''
      GROUP BY u.name
      ORDER BY count DESC
    `

    return NextResponse.json({
      issuesList,
      issuesByCategory,
      issuesByTester
    })
  } catch (error) {
    console.error("❌ Error getting issues reports:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}