import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project_id: string }> }
) {
  try {
    const { project_id: projectId } = await params;

    // Lấy database connection
    const sql = await getDbConnection();

    // Lấy thống kê cơ bản của dự án
    const basicStats = await sql`
      SELECT 
        COUNT(DISTINCT tc.id) as total_test_cases,
        COUNT(DISTINCT upa.user_id) as total_testers,
        COUNT(DISTINCT CASE WHEN te.execution_date >= CURRENT_DATE - INTERVAL '7 days' THEN upa.user_id END) as active_testers
      FROM test_cases tc
      LEFT JOIN user_project_access upa ON tc.project_id = upa.project_id
      LEFT JOIN test_executions te ON upa.user_id = te.tester_id AND te.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
    `;

    // Lấy thống kê execution status dựa trên execution mới nhất của mỗi test case
    const executionStats = await sql`
      SELECT 
        COUNT(CASE WHEN latest_execution.status = 'passed' THEN 1 END) as passed_test_cases,
        COUNT(CASE WHEN latest_execution.status = 'failed' THEN 1 END) as failed_test_cases,
        COUNT(CASE WHEN latest_execution.status IS NULL THEN 1 END) as pending_test_cases,
        COUNT(DISTINCT te.id) as total_executions,
        COUNT(CASE WHEN te.loi IS NULL OR te.loi = '' THEN 1 END) as total_passed_executions,
        COUNT(CASE WHEN te.loi IS NOT NULL AND te.loi != '' THEN 1 END) as total_failed_executions
      FROM test_cases tc
      LEFT JOIN (
        SELECT DISTINCT ON (test_case_id) 
          test_case_id,
          CASE 
            WHEN loi IS NULL OR loi = '' THEN 'passed'
            ELSE 'failed'
          END as status,
          execution_date
        FROM test_executions 
        ORDER BY test_case_id, execution_date DESC
      ) latest_execution ON tc.id = latest_execution.test_case_id
      LEFT JOIN test_executions te ON tc.id = te.test_case_id
      WHERE tc.project_id = ${projectId}
    `;

    // Lấy thống kê theo platform
    const platformStats = await sql`
      SELECT 
        tc.platform,
        COUNT(DISTINCT tc.id) as total_cases,
        COUNT(DISTINCT CASE WHEN latest_execution.status = 'passed' THEN tc.id END) as passed_cases,
        COUNT(DISTINCT CASE WHEN latest_execution.status = 'failed' THEN tc.id END) as failed_cases
      FROM test_cases tc
      LEFT JOIN (
        SELECT DISTINCT ON (test_case_id) 
          test_case_id,
          CASE 
            WHEN loi IS NULL OR loi = '' THEN 'passed'
            ELSE 'failed'
          END as status
        FROM test_executions 
        ORDER BY test_case_id, execution_date DESC
      ) latest_execution ON tc.id = latest_execution.test_case_id
      WHERE tc.project_id = ${projectId}
      GROUP BY tc.platform
    `;

    // Lấy thống kê theo priority
    const priorityStats = await sql`
      SELECT 
        tc.priority,
        COUNT(DISTINCT tc.id) as total_cases,
        COUNT(DISTINCT CASE WHEN latest_execution.status = 'passed' THEN tc.id END) as passed_cases,
        COUNT(DISTINCT CASE WHEN latest_execution.status = 'failed' THEN tc.id END) as failed_cases
      FROM test_cases tc
      LEFT JOIN (
        SELECT DISTINCT ON (test_case_id) 
          test_case_id,
          CASE 
            WHEN loi IS NULL OR loi = '' THEN 'passed'
            ELSE 'failed'
          END as status
        FROM test_executions 
        ORDER BY test_case_id, execution_date DESC
      ) latest_execution ON tc.id = latest_execution.test_case_id
      WHERE tc.project_id = ${projectId}
      GROUP BY tc.priority
    `;

    // Lấy trend data cho 7 ngày gần đây
    const trendData = await sql`
      SELECT 
        DATE(te.execution_date) as date,
        COUNT(CASE WHEN te.loi IS NULL OR te.loi = '' THEN 1 END) as passed,
        COUNT(CASE WHEN te.loi IS NOT NULL AND te.loi != '' THEN 1 END) as failed,
        COUNT(*) as total
      FROM test_executions te
      JOIN test_cases tc ON te.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
        AND te.execution_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(te.execution_date)
      ORDER BY date DESC
    `;

    const basic = basicStats[0] || {
      total_test_cases: 0,
      total_testers: 0,
      active_testers: 0
    };

    const execution = executionStats[0] || {
      passed_test_cases: 0,
      failed_test_cases: 0,
      pending_test_cases: 0,
      total_executions: 0,
      total_passed_executions: 0,
      total_failed_executions: 0
    };

    // Tính completion rate và pass rate
    const completionRate = basic.total_test_cases > 0 
      ? Math.round(((execution.passed_test_cases + execution.failed_test_cases) / basic.total_test_cases) * 100)
      : 0;

    const passRate = execution.total_executions > 0
      ? Math.round((execution.total_passed_executions / execution.total_executions) * 100)
      : 0;

    return NextResponse.json({
      total_test_cases: basic.total_test_cases,
      passed_test_cases: execution.passed_test_cases,
      failed_test_cases: execution.failed_test_cases,
      pending_test_cases: execution.pending_test_cases,
      total_testers: basic.total_testers,
      active_testers: basic.active_testers,
      total_executions: execution.total_executions,
      total_passed_executions: execution.total_passed_executions,
      total_failed_executions: execution.total_failed_executions,
      completion_rate: completionRate,
      pass_rate: passRate,
      platform_stats: platformStats,
      priority_stats: priorityStats,
      trend_data: trendData
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch project stats" },
      { status: 500 }
    );
  }
}