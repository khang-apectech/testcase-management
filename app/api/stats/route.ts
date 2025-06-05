import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/stats - Lấy thống kê tổng quan (chỉ admin)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request.headers.get("authorization"))
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = await getDbConnection()

    // Thống kê theo hạng mục
    const categoryStats = await sql`
      SELECT 
        tc.hang_muc,
        COUNT(DISTINCT tc.id) as total_tests,
        COUNT(DISTINCT te.id) as completed_tests,
        AVG(te.so_lan_da_test::float / tc.so_lan_phai_test::float * 100) as completion_rate
      FROM test_cases tc
      LEFT JOIN test_executions te ON te.test_case_id = tc.id
      GROUP BY tc.hang_muc
      ORDER BY tc.hang_muc
    `

    // Thống kê theo tester
    const testerStats = await sql`
      SELECT 
        u.name as tester_name,
        COUNT(DISTINCT tc.id) as assigned_tests,
        COUNT(DISTINCT te.id) as completed_tests,
        COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as tests_with_issues,
        AVG(EXTRACT(EPOCH FROM (te.updated_at - te.created_at))/3600)::float as avg_test_hours
      FROM users u
      LEFT JOIN user_test_assignments uta ON uta.user_id = u.id
      LEFT JOIN test_cases tc ON tc.id = uta.test_case_id
      LEFT JOIN test_executions te ON te.test_case_id = tc.id AND te.tester_id = u.id
      WHERE u.role = 'tester'
      GROUP BY u.id, u.name
      ORDER BY completed_tests DESC
    `

    // Thống kê theo thời gian
    const timeStats = await sql`
      SELECT 
        DATE_TRUNC('day', te.execution_date) as date,
        COUNT(DISTINCT te.id) as total_executions,
        COUNT(DISTINCT te.tester_id) as active_testers,
        COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as executions_with_issues
      FROM test_executions te
      GROUP BY DATE_TRUNC('day', te.execution_date)
      ORDER BY date DESC
      LIMIT 30
    `

    // Thống kê lỗi phổ biến
    const issueStats = await sql`
      WITH parsed_issues AS (
        SELECT 
          UNNEST(STRING_TO_ARRAY(loi, '. ')) as issue_text
        FROM test_executions 
        WHERE loi != ''
      )
      SELECT 
        issue_text,
        COUNT(*) as occurrence_count
      FROM parsed_issues
      GROUP BY issue_text
      ORDER BY occurrence_count DESC
      LIMIT 10
    `

    return NextResponse.json({
      categoryStats,
      testerStats,
      timeStats,
      issueStats
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 