import { NextRequest, NextResponse } from 'next/server'
import { getDbConnection } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; testcase_id: string } }
) {
  try {
    const { id: projectId, testcase_id: testCaseId } = await params

    const sql = await getDbConnection()
    
    // Get test case details
    const testCaseResults = await sql`
      SELECT * FROM test_cases 
      WHERE id = ${testCaseId} AND project_id = ${projectId}
    `

    if (testCaseResults.length === 0) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      )
    }

    const testCase = testCaseResults[0]

    // Get all assigned testers
    const assignedTesters = await sql`
      SELECT u.id, u.name, u.email, uta.assigned_at
      FROM user_test_assignments uta
      JOIN users u ON uta.user_id = u.id
      WHERE uta.test_case_id = ${testCaseId}
      ORDER BY uta.assigned_at DESC
    `

    // Get execution statistics
    const executionStats = await sql`
      SELECT 
        COUNT(*) as total_executions,
        COUNT(CASE WHEN te.loi IS NULL OR te.loi = '' THEN 1 END) as passed_executions,
        COUNT(CASE WHEN te.loi IS NOT NULL AND te.loi != '' THEN 1 END) as failed_executions,
        MAX(te.execution_date) as last_execution_date
      FROM test_executions te
      WHERE te.test_case_id = ${testCaseId}
    `

    // Add additional data to test case
    testCase.assigned_testers = assignedTesters
    testCase.assigned_tester = assignedTesters.length > 0 ? assignedTesters[0].name : null
    testCase.execution_stats = executionStats[0] || {
      total_executions: 0,
      passed_executions: 0,
      failed_executions: 0,
      last_execution_date: null
    }

    return NextResponse.json(testCase)
  } catch (error) {
    console.error('Error fetching test case:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test case' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testcase_id: string }> }
) {
  try {
    const { id: projectId, testcase_id: testCaseId } = await params
    const body = await request.json()

    const {
      hang_muc,
      tinh_nang,
      so_lan_phai_test,
      preconditions,
      steps,
      expected_result,
      priority,
      // Support legacy fields for backward compatibility
      title,
      description
    } = body

    const sql = await getDbConnection()
    
    // Use hang_muc/tinh_nang if provided, otherwise fall back to title/description
    const finalHangMuc = hang_muc || title
    const finalTinhNang = tinh_nang || description
    
    await sql`
      UPDATE test_cases 
      SET hang_muc = ${finalHangMuc}, 
          tinh_nang = ${finalTinhNang}, 
          so_lan_phai_test = ${so_lan_phai_test || 1},
          preconditions = ${preconditions || ''}, 
          steps = ${steps || ''}, 
          expected_result = ${expected_result || ''}, 
          priority = ${priority || 'medium'}, 
          updated_at = NOW(),
          updated_by = (SELECT id FROM users WHERE email = 'admin@testcase.com' LIMIT 1)
      WHERE id = ${testCaseId} AND project_id = ${projectId}
    `

    return NextResponse.json({ success: true, id: testCaseId })
  } catch (error) {
    console.error('Error updating test case:', error)
    return NextResponse.json(
      { error: 'Failed to update test case' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; testcase_id: string } }
) {
  try {
    const { id: projectId, testcase_id: testCaseId } = await params

    const sql = await getDbConnection()
    
    // First delete related executions
    await sql`DELETE FROM test_executions WHERE test_case_id = ${testCaseId}`
    
    // Then delete assignments
    await sql`DELETE FROM user_test_assignments WHERE test_case_id = ${testCaseId}`
    
    // Finally delete the test case
    await sql`DELETE FROM test_cases WHERE id = ${testCaseId} AND project_id = ${projectId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting test case:', error)
    return NextResponse.json(
      { error: 'Failed to delete test case' },
      { status: 500 }
    )
  }
}