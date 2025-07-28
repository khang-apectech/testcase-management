import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing database connection...");
    const sql = await getDbConnection();
    
    // Test simple query
    const users = await sql`SELECT id, name, email, role FROM users LIMIT 5`;
    console.log("✅ Users query successful:", users);
    
    // Test users with status
    const usersWithStatus = await sql`SELECT id, name, email, role, status FROM users LIMIT 5`;
    console.log("✅ Users with status query successful:", usersWithStatus);
    
    return NextResponse.json({
      success: true,
      message: "Database test successful",
      users: users,
      usersWithStatus: usersWithStatus
    });
  } catch (error) {
    console.error("❌ Database test failed:", error);
    return NextResponse.json(
      { error: "Database test failed", details: error.message },
      { status: 500 }
    );
  }
}