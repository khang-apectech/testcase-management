import { getDbConnection } from "./db"
import { verify } from "jsonwebtoken"
import type { NextRequest } from "next/server"

export async function getCurrentUser(token?: string) {
  try {
    if (!token) {
      return null
    }

    // Remove Bearer prefix if present
    const cleanToken = token.replace("Bearer ", "")
    
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined")
      throw new Error("JWT_SECRET is not defined")
    }

    const decoded = verify(cleanToken, process.env.JWT_SECRET) as { userId: string }

    const sql = await getDbConnection()

    const users = await sql`
      SELECT id, name, email, role
      FROM users
      WHERE id = ${decoded.userId}
    `

    if (users.length === 0) {
      return null
    }

    return users[0]
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | undefined {
  const authHeader = request.headers.get("authorization")
  const tokenFromHeader = authHeader?.replace("Bearer ", "")
  const tokenFromCookie = request.cookies.get("token")?.value
  return tokenFromHeader || tokenFromCookie
}

export async function verifyAuth(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return { success: false, error: "Unauthorized - No token provided" }
    }
    
    const user = await getCurrentUser(token)
    if (!user) {
      return { success: false, error: "Unauthorized - Invalid token" }
    }
    
    return { success: true, user }
  } catch (error) {
    console.error("Auth verification error:", error)
    return { 
      success: false, 
      error: "Authentication error: " + (error instanceof Error ? error.message : String(error))
    }
  }
}
