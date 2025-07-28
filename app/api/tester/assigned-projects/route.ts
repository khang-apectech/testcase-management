import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Kiểm tra authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }
    
    if (authResult.user?.role !== "tester") {
      return NextResponse.json(
        { error: "Unauthorized - Tester access required" },
        { status: 403 }
      );
    }

    const testerId = authResult.user.id;

    // Lấy database connection
    const sql = await getDbConnection();

    // Lấy danh sách dự án được phân công cho tester
    const projects = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        'active' as status,
        COUNT(DISTINCT tc.id) as test_cases_count,
        COUNT(DISTINCT upa2.user_id) as testers_count,
        COUNT(DISTINCT uta.test_case_id) as my_test_cases
      FROM projects p
      INNER JOIN user_project_access upa ON p.id = upa.project_id
      LEFT JOIN test_cases tc ON p.id = tc.project_id
      LEFT JOIN user_project_access upa2 ON p.id = upa2.project_id
      LEFT JOIN user_test_assignments uta ON tc.id = uta.test_case_id AND uta.user_id = ${testerId}
      LEFT JOIN users u2 ON upa2.user_id = u2.id AND u2.role = 'tester'
      WHERE upa.user_id = ${testerId}
      GROUP BY p.id, p.name, p.description
      ORDER BY p.name ASC
    `;

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching assigned projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned projects" },
      { status: 500 }
    );
  }
}