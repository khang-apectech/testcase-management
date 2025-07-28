import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"

// GET /api/projects/[id]/test-cases/simple - Simple test cases fetch (no auth for debugging)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = await params
    
    console.log('Simple API - Project ID:', projectId)
    
    const sql = await getDbConnection()
    
    // Simple query to get all test cases for this project
    const testCases = await sql`
      SELECT 
        tc.*,
        COUNT(DISTINCT te.id) as total_executions
      FROM test_cases tc
      LEFT JOIN test_executions te ON te.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
      GROUP BY tc.id
      ORDER BY tc.created_at DESC
      LIMIT 10
    `

    console.log('Simple API - Test cases found:', testCases.length)
    
    return NextResponse.json({
      projectId,
      testCases,
      count: testCases.length
    })
  } catch (error) {
    console.error("Simple API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch test cases", details: error.message }, 
      { status: 500 }
    )
  }
}