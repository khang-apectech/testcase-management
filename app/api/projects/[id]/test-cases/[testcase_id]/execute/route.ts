import { NextRequest, NextResponse } from 'next/server'
import { getDbConnection } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; testcase_id: string } }
) {
  try {
    const { id: projectId, testcase_id: testCaseId } = await params
    const body = await request.json()

    const {
      so_lan_da_test,
      cam_nhan,
      loi,
      status = 'passed'
    } = body

    const sql = await getDbConnection()
    
    // Insert execution record
    const result = await sql`
      INSERT INTO test_executions 
      (test_case_id, tester_id, so_lan_da_test, cam_nhan, loi, execution_date)
      VALUES (${testCaseId}, 
              (SELECT id FROM users WHERE email = 'admin@testcase.com' LIMIT 1), 
              ${so_lan_da_test}, 
              ${cam_nhan}, 
              ${loi || ''}, 
              NOW())
      RETURNING id
    `

    // Update test case timestamp
    await sql`
      UPDATE test_cases 
      SET updated_at = NOW()
      WHERE id = ${testCaseId} AND project_id = ${projectId}
    `

    return NextResponse.json({ 
      success: true, 
      execution_id: result[0]?.id 
    })
  } catch (error) {
    console.error('Error recording test execution:', error)
    return NextResponse.json(
      { error: 'Failed to record test execution' },
      { status: 500 }
    )
  }
}