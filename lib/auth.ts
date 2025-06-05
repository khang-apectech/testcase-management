import { getDbConnection } from "./db"
import { verify } from "jsonwebtoken"
import type { NextRequest } from "next/server"

export async function getCurrentUser(token?: string) {
  try {
    console.log("Getting current user with token:", !!token)

    if (!token) {
      console.log("No token provided")
      return null
    }

    // Remove Bearer prefix if present
    const cleanToken = token.replace("Bearer ", "")
    
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined")
      throw new Error("JWT_SECRET is not defined")
    }

    console.log("Verifying JWT token...")
    const decoded = verify(cleanToken, process.env.JWT_SECRET) as { userId: string }
    console.log("Token decoded:", decoded)

    const sql = await getDbConnection()
    console.log("Database connected, fetching user...")

    const users = await sql`
      SELECT id, name, email, role
      FROM users
      WHERE id = ${decoded.userId}
    `
    console.log("User query result:", users)

    if (users.length === 0) {
      console.log("No user found with id:", decoded.userId)
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
