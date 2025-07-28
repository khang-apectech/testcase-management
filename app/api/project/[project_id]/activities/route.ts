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

    // Lấy hoạt động gần đây của dự án
    const activities = await sql`
      SELECT 
        'test_case_created' as type,
        CONCAT('Test case "', tc.hang_muc, ' - ', tc.tinh_nang, '" đã được tạo') as description,
        u.name as user,
        tc.created_at as timestamp,
        tc.id::text as activity_id
      FROM test_cases tc
      JOIN users u ON tc.created_by = u.id
      WHERE tc.project_id = ${projectId}
      
      UNION ALL
      
      SELECT 
        'test_case_executed' as type,
        CONCAT('Test case "', tc.hang_muc, ' - ', tc.tinh_nang, '" đã được thực thi') as description,
        u.name as user,
        te.created_at as timestamp,
        te.id::text as activity_id
      FROM test_executions te
      JOIN test_cases tc ON te.test_case_id = tc.id
      JOIN users u ON te.tester_id = u.id
      WHERE tc.project_id = ${projectId}
      
      UNION ALL
      
      SELECT 
        'tester_assigned' as type,
        CONCAT('Tester "', u.name, '" đã được phân công vào dự án') as description,
        admin.name as user,
        upa.granted_at as timestamp,
        upa.id::text as activity_id
      FROM user_project_access upa
      JOIN users u ON upa.user_id = u.id
      JOIN users admin ON upa.granted_by = admin.id
      WHERE upa.project_id = ${projectId}
      
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    return NextResponse.json(activities.map(row => ({
      id: row.activity_id,
      type: row.type,
      description: row.description,
      user: row.user,
      timestamp: row.timestamp
    })));
  } catch (error) {
    console.error("Error fetching project activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch project activities" },
      { status: 500 }
    );
  }
}