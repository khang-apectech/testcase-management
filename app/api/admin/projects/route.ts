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

    // Lấy danh sách tất cả dự án cho admin
    const projects = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        'active' as status,
        p.created_at,
        COUNT(DISTINCT tc.id) as test_cases_count,
        COUNT(DISTINCT upa.user_id) as testers_count
      FROM projects p
      LEFT JOIN test_cases tc ON p.id = tc.project_id
      LEFT JOIN user_project_access upa ON p.id = upa.project_id
      LEFT JOIN users u ON upa.user_id = u.id AND u.role = 'tester'
      GROUP BY p.id, p.name, p.description, p.created_at
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
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

    const { name, description, status = 'active' } = await request.json();

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    // Lấy database connection
    const sql = await getDbConnection();

    const result = await sql`
      INSERT INTO projects (name, description, created_by, updated_by, created_at, updated_at) 
      VALUES (${name}, ${description}, ${authResult.user.id}, ${authResult.user.id}, NOW(), NOW()) 
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}