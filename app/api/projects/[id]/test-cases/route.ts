import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// GET /api/projects/[id]/test-cases - Lấy danh sách test cases theo project_id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    const { id: projectId } = await params
    
    console.log('GET test-cases - User:', user.email, 'Role:', user.role, 'Project ID:', projectId)
    
    const sql = await getDbConnection()
    
    // Check if user has access to this project
    const [projectAccess] = await sql`
      SELECT p.* FROM projects p
      LEFT JOIN user_project_access upa ON p.id = upa.project_id
      WHERE p.id = ${projectId} 
      AND (${user.role} = 'admin' OR upa.user_id = ${user.id})
    `

    console.log('Project access check:', projectAccess ? 'GRANTED' : 'DENIED')

    if (!projectAccess) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      )
    }
    
    let testCases
    
    if (user.role === 'admin') {
      // Admin can see all test cases in the project
      testCases = await sql`
        SELECT 
          tc.*,
          COUNT(DISTINCT te.id) as total_executions,
          COUNT(DISTINCT uta.user_id) as assigned_tester_count,
          STRING_AGG(DISTINCT u.name, ', ') as assigned_tester_names,
          COUNT(CASE WHEN te.loi IS NULL OR te.loi = '' THEN 1 END) as passed_executions,
          COUNT(CASE WHEN te.loi IS NOT NULL AND te.loi != '' THEN 1 END) as failed_executions,
          latest_execution.status as status,
          CASE 
            WHEN COUNT(DISTINCT te.id) = 0 THEN 'not_executed'
            WHEN latest_execution.status = 'passed' THEN 'passed'
            WHEN latest_execution.status = 'failed' THEN 'failed'
            ELSE 'pending'
          END as current_status
        FROM test_cases tc
        LEFT JOIN test_executions te ON te.test_case_id = tc.id
        LEFT JOIN user_test_assignments uta ON tc.id = uta.test_case_id
        LEFT JOIN users u ON uta.user_id = u.id
        LEFT JOIN (
          SELECT DISTINCT ON (test_case_id) 
            test_case_id,
            CASE 
              WHEN loi IS NULL OR loi = '' THEN 'passed'
              ELSE 'failed'
            END as status
          FROM test_executions 
          ORDER BY test_case_id, execution_date DESC
        ) latest_execution ON tc.id = latest_execution.test_case_id
        WHERE tc.project_id = ${projectId}
        GROUP BY tc.id, latest_execution.status
        ORDER BY tc.created_at DESC
      `
    } else {
      // Tester can only see test cases assigned to them in this project
      testCases = await sql`
        SELECT 
          tc.*,
          COUNT(DISTINCT te.id) as total_executions,
          COUNT(DISTINCT uta2.user_id) as assigned_tester_count,
          COUNT(CASE WHEN te.loi IS NULL OR te.loi = '' THEN 1 END) as passed_executions,
          COUNT(CASE WHEN te.loi IS NOT NULL AND te.loi != '' THEN 1 END) as failed_executions,
          latest_execution.status as status,
          CASE 
            WHEN COUNT(DISTINCT te.id) = 0 THEN 'not_executed'
            WHEN latest_execution.status = 'passed' THEN 'passed'
            WHEN latest_execution.status = 'failed' THEN 'failed'
            ELSE 'pending'
          END as current_status
        FROM test_cases tc
        LEFT JOIN test_executions te ON te.test_case_id = tc.id
        LEFT JOIN user_test_assignments uta2 ON tc.id = uta2.test_case_id
        JOIN user_test_assignments uta ON tc.id = uta.test_case_id
        LEFT JOIN (
          SELECT DISTINCT ON (test_case_id) 
            test_case_id,
            CASE 
              WHEN loi IS NULL OR loi = '' THEN 'passed'
              ELSE 'failed'
            END as status
          FROM test_executions 
          ORDER BY test_case_id, execution_date DESC
        ) latest_execution ON tc.id = latest_execution.test_case_id
        WHERE tc.project_id = ${projectId} 
        AND uta.user_id = ${user.id}
        GROUP BY tc.id, latest_execution.status
        ORDER BY tc.created_at DESC
      `
    }

    console.log('Test cases found:', testCases.length)
    return NextResponse.json(testCases)
  } catch (error) {
    console.error("Get test cases error:", error)
    return NextResponse.json(
      { error: "Failed to fetch test cases" }, 
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/test-cases - Tạo test case mới cho project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { user } = authResult
    
    // Only admins can create test cases
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: "Only admins can create test cases" },
        { status: 403 }
      )
    }

    const { id: projectId } = await params
    const body = await request.json()
    
    const { 
      hang_muc, 
      tinh_nang, 
      so_lan_phai_test = 1,
      platform = 'web',
      priority = 'medium',
      preconditions,
      steps,
      expected_result
    } = body

    if (!hang_muc || !tinh_nang) {
      return NextResponse.json({ error: "Hạng mục và tính năng là bắt buộc" }, { status: 400 })
    }
    
    const sql = await getDbConnection()
    
    // Check if project exists and user has access
    const [project] = await sql`
      SELECT p.* FROM projects p
      LEFT JOIN user_project_access upa ON p.id = upa.project_id
      WHERE p.id = ${projectId} 
      AND (${user.role} = 'admin' OR upa.user_id = ${user.id})
    `
    
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 })
    }

    const result = await sql`
      INSERT INTO test_cases (
        hang_muc, 
        tinh_nang, 
        so_lan_phai_test,
        platform,
        priority,
        preconditions,
        steps,
        expected_result,
        project_id,
        created_by,
        created_at
      )
      VALUES (
        ${hang_muc}, 
        ${tinh_nang}, 
        ${so_lan_phai_test},
        ${platform},
        ${priority},
        ${preconditions || 'Hệ thống đã được khởi động và sẵn sàng để test'},
        ${steps || '1. Thực hiện các bước test theo tính năng đã mô tả\n2. Kiểm tra kết quả\n3. Ghi nhận lỗi nếu có'},
        ${expected_result || 'Tính năng hoạt động đúng như mong đợi'},
        ${projectId},
        ${user.id},
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, id: result[0].id, testCase: result[0] })
  } catch (error) {
    console.error("Create test case error:", error)
    return NextResponse.json(
      { error: "Failed to create test case" }, 
      { status: 500 }
    )
  }
}