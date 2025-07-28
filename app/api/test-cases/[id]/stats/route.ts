import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const { id: testCaseId } = await params;

    const sql = await getDbConnection();

    // Kiểm tra quyền truy cập test case
    const [testCase] = await sql`
      SELECT tc.*, p.name as project_name
      FROM test_cases tc
      JOIN projects p ON tc.project_id = p.id
      LEFT JOIN user_project_access upa ON p.id = upa.project_id
      WHERE tc.id = ${testCaseId}
      AND (${user.role} = 'admin' OR upa.user_id = ${user.id})
    `;

    if (!testCase) {
      return NextResponse.json(
        { error: "Test case not found or access denied" },
        { status: 404 }
      );
    }

    // Lấy thống kê execution của test case
    const executionStats = await sql`
      SELECT 
        COUNT(*) as total_executions,
        COUNT(CASE WHEN loi IS NULL OR loi = '' THEN 1 END) as passed_executions,
        COUNT(CASE WHEN loi IS NOT NULL AND loi != '' THEN 1 END) as failed_executions,
        MIN(execution_date) as first_execution,
        MAX(execution_date) as last_execution,
        COUNT(DISTINCT tester_id) as unique_testers
      FROM test_executions
      WHERE test_case_id = ${testCaseId}
    `;

    // Lấy lịch sử execution chi tiết
    const executionHistory = await sql`
      SELECT 
        te.*,
        u.name as tester_name,
        u.email as tester_email
      FROM test_executions te
      LEFT JOIN users u ON te.tester_id = u.id
      WHERE te.test_case_id = ${testCaseId}
      ORDER BY te.execution_date DESC
      LIMIT 20
    `;

    // Lấy thống kê theo tester
    const testerStats = await sql`
      SELECT 
        u.name as tester_name,
        u.email as tester_email,
        COUNT(*) as total_executions,
        COUNT(CASE WHEN te.loi IS NULL OR te.loi = '' THEN 1 END) as passed_executions,
        COUNT(CASE WHEN te.loi IS NOT NULL AND te.loi != '' THEN 1 END) as failed_executions,
        MAX(te.execution_date) as last_execution
      FROM test_executions te
      JOIN users u ON te.tester_id = u.id
      WHERE te.test_case_id = ${testCaseId}
      GROUP BY u.id, u.name, u.email
      ORDER BY total_executions DESC
    `;

    // Lấy trend data cho 30 ngày gần đây
    const trendData = await sql`
      SELECT 
        DATE(te.execution_date) as date,
        COUNT(CASE WHEN te.loi IS NULL OR te.loi = '' THEN 1 END) as passed,
        COUNT(CASE WHEN te.loi IS NOT NULL AND te.loi != '' THEN 1 END) as failed,
        COUNT(*) as total
      FROM test_executions te
      WHERE te.test_case_id = ${testCaseId}
        AND te.execution_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(te.execution_date)
      ORDER BY date DESC
    `;

    // Lấy danh sách testers được assign
    const assignedTesters = await sql`
      SELECT 
        u.name as tester_name,
        u.email as tester_email,
        uta.assigned_at
      FROM user_test_assignments uta
      JOIN users u ON uta.user_id = u.id
      WHERE uta.test_case_id = ${testCaseId}
      ORDER BY uta.assigned_at DESC
    `;

    const stats = executionStats[0] || {
      total_executions: 0,
      passed_executions: 0,
      failed_executions: 0,
      first_execution: null,
      last_execution: null,
      unique_testers: 0
    };

    // Tính pass rate
    const passRate = stats.total_executions > 0
      ? Math.round((stats.passed_executions / stats.total_executions) * 100)
      : 0;

    // Tính completion rate dựa trên số lần phải test
    const completionRate = testCase.so_lan_phai_test > 0
      ? Math.min(Math.round((stats.total_executions / testCase.so_lan_phai_test) * 100), 100)
      : 0;

    return NextResponse.json({
      test_case: {
        id: testCase.id,
        hang_muc: testCase.hang_muc,
        tinh_nang: testCase.tinh_nang,
        mo_ta: testCase.mo_ta,
        so_lan_phai_test: testCase.so_lan_phai_test,
        priority: testCase.priority,
        platform: testCase.platform,
        project_name: testCase.project_name
      },
      stats: {
        ...stats,
        pass_rate: passRate,
        completion_rate: completionRate,
        remaining_executions: Math.max(testCase.so_lan_phai_test - stats.total_executions, 0)
      },
      execution_history: executionHistory,
      tester_stats: testerStats,
      trend_data: trendData,
      assigned_testers: assignedTesters
    });
  } catch (error) {
    console.error("Error fetching test case stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch test case stats" },
      { status: 500 }
    );
  }
}