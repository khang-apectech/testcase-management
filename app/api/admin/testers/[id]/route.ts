import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { name, email, role, status } = await request.json();
    const testerId = params.id;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Lấy database connection
    const sql = await getDbConnection();

    // Kiểm tra email đã tồn tại cho user khác chưa
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} AND id != ${testerId}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Cập nhật thông tin tester
    const result = await sql`
      UPDATE users 
      SET name = ${name}, email = ${email}, role = ${role}, status = ${status}, updated_at = NOW()
      WHERE id = ${testerId}
      RETURNING id, name, email, role, status, created_at, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Tester not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating tester:", error);
    return NextResponse.json(
      { error: "Failed to update tester" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const testerId = params.id;

    // Lấy database connection
    const sql = await getDbConnection();

    // Kiểm tra xem tester có đang được assign vào test cases không
    const assignedTestCases = await sql`
      SELECT COUNT(*) as count FROM user_test_assignments WHERE user_id = ${testerId}
    `;

    if (parseInt(assignedTestCases[0].count) > 0) {
      return NextResponse.json(
        { error: "Không thể xóa tester đang được assign vào test cases" },
        { status: 400 }
      );
    }

    // Xóa access của tester khỏi các projects
    await sql`
      DELETE FROM user_project_access WHERE user_id = ${testerId}
    `;

    // Xóa tester
    const result = await sql`
      DELETE FROM users WHERE id = ${testerId} RETURNING id, name, email
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Tester not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Tester deleted successfully",
      deleted: result[0] 
    });
  } catch (error) {
    console.error("Error deleting tester:", error);
    return NextResponse.json(
      { error: "Failed to delete tester" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { status } = await request.json();
    const testerId = params.id;

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (active/inactive)" },
        { status: 400 }
      );
    }

    // Lấy database connection
    const sql = await getDbConnection();

    // Cập nhật status
    const result = await sql`
      UPDATE users 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${testerId}
      RETURNING id, name, email, role, status, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Tester not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating tester status:", error);
    return NextResponse.json(
      { error: "Failed to update tester status" },
      { status: 500 }
    );
  }
}