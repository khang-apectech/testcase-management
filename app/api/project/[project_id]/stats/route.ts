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

    // Lấy thống kê của dự án
    const stats = await sql`
      SELECT 
        COUNT(tc.id) as total_test_cases,
        COUNT(CASE WHEN te.loi IS NOT NULL AND te.loi != '' THEN 1 END) as failed_test_cases,
        COUNT(CASE WHEN te.cam_nhan IS NOT NULL AND te.cam_nhan != '' THEN 1 END) as passed_test_cases,
        COUNT(CASE WHEN te.id IS NULL THEN 1 END) as pending_test_cases,
        COUNT(DISTINCT upa.user_id) as total_testers,
        COUNT(DISTINCT upa.user_id) as active_testers
      FROM test_cases tc
      LEFT JOIN test_executions te ON tc.id = te.test_case_id 
        AND te.id = (
          SELECT id FROM test_executions 
          WHERE test_case_id = tc.id 
          ORDER BY created_at DESC 
          LIMIT 1
        )
      LEFT JOIN user_project_access upa ON tc.project_id = upa.project_id
      LEFT JOIN users u ON upa.user_id = u.id
      WHERE tc.project_id = ${projectId}
    `;

    const result = stats[0] || {
      total_test_cases: 0,
      passed_test_cases: 0,
      failed_test_cases: 0,
      pending_test_cases: 0,
      total_testers: 0,
      active_testers: 0
    };

    // Tính completion rate
    const completionRate = result.total_test_cases > 0 
      ? Math.round(((result.passed_test_cases + result.failed_test_cases) / result.total_test_cases) * 100)
      : 0;

    return NextResponse.json({
      ...result,
      completion_rate: completionRate
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch project stats" },
      { status: 500 }
    );
  }
}