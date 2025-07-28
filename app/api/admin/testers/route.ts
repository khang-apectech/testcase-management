import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Kiểm tra authentication và phân quyền admin
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }
    
    if (authResult.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Lấy database connection
    const sql = await getDbConnection();

    // Lấy danh sách tất cả tester cho admin với thông tin chi tiết
    const testers = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        COALESCE(u.status, 'active') as status,
        u.created_at,
        COALESCE(project_stats.projects_count, 0) as projects_count,
        COALESCE(testcase_stats.test_cases_assigned, 0) as test_cases_assigned
      FROM users u
      LEFT JOIN (
        SELECT 
          upa.user_id,
          COUNT(DISTINCT upa.project_id) as projects_count
        FROM user_project_access upa
        GROUP BY upa.user_id
      ) project_stats ON u.id = project_stats.user_id
      LEFT JOIN (
        SELECT 
          uta.user_id,
          COUNT(DISTINCT uta.test_case_id) as test_cases_assigned
        FROM user_test_assignments uta
        GROUP BY uta.user_id
      ) testcase_stats ON u.id = testcase_stats.user_id
      WHERE u.role IN ('tester', 'admin')
      ORDER BY u.created_at DESC
    `;

    return NextResponse.json(testers);
  } catch (error) {
    console.error("Error fetching testers:", error);
    return NextResponse.json(
      { error: "Failed to fetch testers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra authentication và phân quyền admin
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }
    
    if (authResult.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { name, email, password, role = 'tester' } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Lấy database connection
    const sql = await getDbConnection();

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password trước khi lưu (sử dụng bcrypt trong production)
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await sql`
      INSERT INTO users (name, email, password, role, status, created_at, updated_at) 
      VALUES (${name}, ${email}, ${hashedPassword}, ${role}, 'active', NOW(), NOW()) 
      RETURNING id, name, email, role, status, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating tester:", error);
    return NextResponse.json(
      { error: "Failed to create tester" },
      { status: 500 }
    );
  }
}