import { NextRequest, NextResponse } from 'next/server'
import { getDbConnection } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testcase_id: string }> }
) {
  try {
    const { id: projectId, testcase_id: testCaseId } = await params

    const sql = await getDbConnection()
    const executions = await sql`
      SELECT 
        te.id,
        te.so_lan_da_test,
        te.cam_nhan as comments,
        te.loi as bug_report,
        te.execution_date as executed_at,
        u.name as executed_by,
        u.id as tester_id,
        tc.hang_muc as test_case_title,
        CASE 
          WHEN te.loi IS NULL OR te.loi = '' THEN 'passed'
          ELSE 'failed'
        END as status
      FROM test_executions te
      JOIN test_cases tc ON te.test_case_id = tc.id
      LEFT JOIN users u ON te.tester_id = u.id
      WHERE te.test_case_id = ${testCaseId} AND tc.project_id = ${projectId}
      ORDER BY te.execution_date DESC
    `

    return NextResponse.json(executions)
  } catch (error) {
    console.error('Error fetching test executions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test executions' },
      { status: 500 }
    )
  }
}