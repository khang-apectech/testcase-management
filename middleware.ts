import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get token from authorization header or cookie
  const authHeader = request.headers.get("authorization")
  const tokenFromHeader = authHeader?.replace("Bearer ", "")
  const tokenFromCookie = request.cookies.get("token")?.value
  const token = tokenFromHeader || tokenFromCookie

  
  // Check if it's a protected route
  const isApiRoute = request.nextUrl.pathname.startsWith("/api")
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard")
  const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth")
  const isLoginRoute = request.nextUrl.pathname === "/login"
  
  // For dashboard routes, we'll let the client-side handle auth checks
  // Only protect API routes here
  if (isApiRoute && !isAuthRoute) {
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}
export const config = {
  matcher: [
    // Match all API routes except /api/auth/*
    "/api/((?!auth/).+)",
  ],
} 
