import { type NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"
import { sign } from "jsonwebtoken"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Login API called")

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { email, password } = body
    console.log("📧 Login attempt for:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Get database connection
    let sql
    try {
      sql = await getDbConnection()
      console.log("✅ Database connection established")
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Query user from database
    let users
    try {
      users = await sql`
        SELECT id, email, password, name, role 
        FROM users 
        WHERE LOWER(email) = LOWER(${email})
      `
      console.log("👥 Users found:", users.length)
    } catch (queryError) {
      console.error("❌ Database query failed:", queryError)
      return NextResponse.json({ error: "Database query failed" }, { status: 500 })
    }

    if (users.length === 0) {
      console.log("❌ No user found with email:", email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]
    console.log("👤 User found:", { email: user.email, role: user.role })

    // So sánh password: nếu là hash bcrypt thì dùng bcrypt.compare, còn lại so sánh plain text
    let isValidPassword = false
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
      // bcrypt hash
      isValidPassword = await bcrypt.compare(password, user.password)
    } else {
      // plain text
      isValidPassword = password === user.password
    }

    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log("✅ Password verified for user:", email)

    // Generate JWT token
    let token
    try {
      if (!process.env.JWT_SECRET) {
        console.error("❌ JWT_SECRET not found")
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
      }

      token = sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      )
      console.log("✅ JWT token generated")
    } catch (tokenError) {
      console.error("❌ Token generation failed:", tokenError)
      return NextResponse.json({ error: "Token generation failed" }, { status: 500 })
    }

    // Return response with token and user info
    console.log("🎉 Login successful for:", email)
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("❌ Login error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}
