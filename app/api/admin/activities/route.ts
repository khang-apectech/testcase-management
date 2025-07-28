import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    
    // Only admins can view all activities
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: "Only admins can view all activities" },
        { status: 403 }
      );
    }

    const sql = await getDbConnection();

    // Get all activities from different sources
    const activities = await sql`
      WITH activity_data AS (
        -- Test case executions
        SELECT 
          te.id,
          'test_case_executed' as type,
          CONCAT('Thực thi test case: ', tc.hang_muc) as description,
          u.name as user_name,
          p.name as project_name,
          te.created_at as timestamp,
          json_build_object(
            'test_case_id', tc.id,
            'result', te.ket_qua,
            'issues', te.loi
          ) as details
        FROM test_executions te
        JOIN test_cases tc ON te.test_case_id = tc.id
        JOIN projects p ON tc.project_id = p.id
        JOIN users u ON te.tester_id = u.id
        
        UNION ALL
        
        -- Test case creation
        SELECT 
          tc.id,
          'test_case_created' as type,
          CONCAT('Tạo test case mới: ', tc.hang_muc) as description,
          u.name as user_name,
          p.name as project_name,
          tc.created_at as timestamp,
          json_build_object(
            'test_case_id', tc.id,
            'platform', tc.platform,
            'priority', tc.priority
          ) as details
        FROM test_cases tc
        JOIN projects p ON tc.project_id = p.id
        JOIN users u ON tc.created_by = u.id
        
        UNION ALL
        
        -- Tester assignments
        SELECT 
          upa.user_id || '_' || upa.project_id as id,
          'tester_assigned' as type,
          CONCAT('Phân công tester ', u.name, ' vào dự án') as description,
          admin_u.name as user_name,
          p.name as project_name,
          upa.created_at as timestamp,
          json_build_object(
            'tester_id', u.id,
            'tester_name', u.name,
            'project_id', p.id
          ) as details
        FROM user_project_access upa
        JOIN users u ON upa.user_id = u.id
        JOIN projects p ON upa.project_id = p.id
        LEFT JOIN users admin_u ON upa.granted_by = admin_u.id
        WHERE u.role = 'tester'
        
        UNION ALL
        
        -- Project creation
        SELECT 
          p.id,
          'project_created' as type,
          CONCAT('Tạo dự án mới: ', p.name) as description,
          u.name as user_name,
          p.name as project_name,
          p.created_at as timestamp,
          json_build_object(
            'project_id', p.id,
            'description', p.description
          ) as details
        FROM projects p
        JOIN users u ON p.created_by = u.id
      )
      SELECT * FROM activity_data
      ORDER BY timestamp DESC
      LIMIT 1000
    `;

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}