import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Auth check API called")

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log("🎫 Token found:", !!token)

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Import auth function
    const { getCurrentUser } = await import("@/lib/auth")
    const user = await getCurrentUser(token)

    if (!user) {
      console.log("❌ Invalid or expired token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("✅ User authenticated:", user.email)
    return NextResponse.json({ user })
  } catch (error) {
    console.error("💥 Auth check error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
