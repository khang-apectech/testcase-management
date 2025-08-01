import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser, getTokenFromRequest } from "@/lib/auth"

// GET /api/test-cases - Lấy danh sách test cases
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/test-cases - Start")
    const token = getTokenFromRequest(request)
    const currentUser = await getCurrentUser(token)
    
    console.log("Current user:", currentUser)
    if (!currentUser) {
      console.log("Unauthorized - No current user")
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 })
    }

    const sql = await getDbConnection()
    console.log("Database connected")

    // Lấy query params
    const { searchParams } = new URL(request.url)
    const hangMuc = searchParams.get("hang_muc") // "App", "CMS", hoặc null
    const search = searchParams.get("search")?.trim() || ""
    const projectId = searchParams.get("project_id") || null
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10)
    const offset = (page - 1) * pageSize

    let whereSql = sql``
    if (hangMuc && hangMuc !== "all") {
      whereSql = sql`${whereSql} AND tc.hang_muc LIKE ${hangMuc + '%'} `
    }
    if (search) {
      whereSql = sql`${whereSql} AND (LOWER(tc.hang_muc) LIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(tc.tinh_nang) LIKE ${'%' + search.toLowerCase() + '%'}) `
    }
    if (projectId) {
      whereSql = sql`${whereSql} AND tc.project_id = ${projectId} `
    }

    let testCases, totalCount
    if (currentUser.role === "admin") {
      // Đếm tổng số
      const totalRes = await sql`
        SELECT COUNT(*) FROM test_cases tc WHERE 1=1 ${whereSql}
      `
      totalCount = Number(totalRes[0].count)
      // Query phân trang
      testCases = await sql`
        SELECT 
          tc.*,
          COUNT(DISTINCT te.id) as total_executions,
          COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as total_issues,
          COUNT(DISTINCT te.tester_id) as testers_tested,
          COUNT(DISTINCT uta.user_id) as testers_assigned,
          ARRAY_AGG(DISTINCT u.name) FILTER (WHERE u.name IS NOT NULL) as assigned_testers
        FROM test_cases tc
        LEFT JOIN test_executions te ON te.test_case_id = tc.id
        LEFT JOIN user_test_assignments uta ON uta.test_case_id = tc.id
        LEFT JOIN users u ON u.id = uta.user_id
        WHERE 1=1 ${whereSql}
        GROUP BY tc.id
        ORDER BY tc.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `
    } else {
      // Đếm tổng số
      const totalRes = await sql`
        SELECT COUNT(*) FROM test_cases tc 
        WHERE tc.id IN (
          SELECT test_case_id FROM user_test_assignments WHERE user_id = ${currentUser.id}
        ) ${whereSql}
      `
      totalCount = Number(totalRes[0].count)
      // Query phân trang
      testCases = await sql`
        SELECT 
          tc.*,
          COUNT(DISTINCT te.id) as total_executions,
          COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END) as total_issues,
          ARRAY_AGG(DISTINCT u.name) FILTER (WHERE u.name IS NOT NULL) as assigned_testers
        FROM test_cases tc
        LEFT JOIN test_executions te ON te.test_case_id = tc.id
        LEFT JOIN user_test_assignments uta ON uta.test_case_id = tc.id
        LEFT JOIN users u ON u.id = uta.user_id
        WHERE tc.id IN (
          SELECT test_case_id FROM user_test_assignments WHERE user_id = ${currentUser.id}
        ) ${whereSql}
        GROUP BY tc.id
        ORDER BY tc.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `
      // Lấy số lần đã test của user hiện tại cho từng test case
      const myExecutions = await sql`
        SELECT test_case_id, COUNT(*) as my_count
        FROM test_executions
        WHERE tester_id = ${currentUser.id}
        GROUP BY test_case_id
      `
      const myExecutionsMap = Object.fromEntries(myExecutions.map(e => [e.test_case_id, Number(e.my_count)]))
      testCases = testCases.map(tc => ({ ...tc, my_executions: myExecutionsMap[tc.id] || 0 }))
    }
    console.log("Query executed, test cases:", testCases)

    return NextResponse.json({ testCases, total: totalCount, page, pageSize })
  } catch (error) {
    console.error("Get test cases error:", error)
    return NextResponse.json(
      { 
        error: "Lỗi server nội bộ",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}

// POST /api/test-cases - Tạo test case mới
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/test-cases - Start")
    const token = getTokenFromRequest(request)
    const currentUser = await getCurrentUser(token)
    console.log("Current user:", currentUser)
    if (!currentUser || currentUser.role !== "admin") {
      console.log("Unauthorized - Not admin")
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
      console.log("Request body:", body)
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Dữ liệu yêu cầu không hợp lệ" }, { status: 400 })
    }
    
    const { hang_muc, tinh_nang, mo_ta, so_lan_phai_test, priority, project_id } = body
    console.log("Parsed fields:", { hang_muc, tinh_nang, mo_ta, so_lan_phai_test, priority, project_id })

    if (!hang_muc || !tinh_nang || !so_lan_phai_test || !mo_ta || !priority || !project_id) {
      console.log("❌ Missing required fields:", { hang_muc, tinh_nang, mo_ta, so_lan_phai_test, priority, project_id })
      return NextResponse.json({ error: "Thiếu các trường bắt buộc" }, { status: 400 })
    }
    
    // Kiểm tra xem người dùng có quyền truy cập dự án không
    const hasAccess = await sql`
      SELECT 1 FROM user_project_access
      WHERE user_id = ${currentUser.id} AND project_id = ${project_id}
    `
    if (hasAccess.length === 0 && currentUser.role !== 'admin') {
      return NextResponse.json({ error: "Bạn không có quyền truy cập dự án này" }, { status: 403 })
    }

    const sql = await getDbConnection()
    console.log("Database connected")

    let testCases
    try {
      testCases = await sql`
        INSERT INTO test_cases (
          hang_muc, 
          tinh_nang, 
          mo_ta,
          so_lan_phai_test, 
          priority,
          created_by,
          updated_by,
          created_at,
          updated_at,
          project_id
        )
        VALUES (
          ${hang_muc}, 
          ${tinh_nang}, 
          ${mo_ta},
          ${so_lan_phai_test}, 
          ${priority},
          ${currentUser.id},
          ${currentUser.id},
          NOW(),
          NOW(),
          ${project_id}
        )
        RETURNING *
      `
      console.log("Test case created:", testCases[0])
    } catch (sqlError) {
      console.error("❌ SQL Insert error:", sqlError)
      return NextResponse.json({ error: "Lỗi chèn dữ liệu", details: sqlError instanceof Error ? sqlError.message : String(sqlError) }, { status: 500 })
    }

    // Add to history
    try {
      await sql`
        INSERT INTO test_case_history (
          test_case_id, hang_muc, tinh_nang, so_lan_phai_test,
          changed_by, change_type, change_note
        )
        VALUES (
          ${testCases[0].id}, ${hang_muc}, ${tinh_nang}, ${so_lan_phai_test},
          ${currentUser.id}, 'CREATE', 'Tạo mới test case'
        )
      `
      console.log("Test case history created")
    } catch (historyError) {
      console.error("❌ SQL History Insert error:", historyError)
      // Không trả lỗi, chỉ log
    }

    return NextResponse.json({ testCase: testCases[0] })
  } catch (error) {
    console.error("Create test case error (outer):", error)
    return NextResponse.json(
      { 
        error: "Lỗi server nội bộ",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}

// PUT /api/test-cases - Cập nhật nhiều test cases
export async function PUT(request: NextRequest) {
  try {
    console.log("PUT /api/test-cases - Start")
    const token = getTokenFromRequest(request)
    const currentUser = await getCurrentUser(token)
    
    console.log("Current user:", currentUser)
    if (!currentUser || currentUser.role !== "admin") {
      console.log("Unauthorized - Not admin")
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Request body:", body)
    
    const { testCases } = body

    if (!Array.isArray(testCases)) {
      console.log("Invalid request body - testCases is not an array")
      return NextResponse.json({ error: "Dữ liệu yêu cầu không hợp lệ" }, { status: 400 })
    }

    const sql = await getDbConnection()
    console.log("Database connected")

    const results = await Promise.all(
      testCases.map(async (tc) => {
        console.log("Updating test case:", tc)
        const updated = await sql`
          UPDATE test_cases
          SET
            hang_muc = ${tc.hang_muc},
            tinh_nang = ${tc.tinh_nang},
            mo_ta = ${tc.mo_ta},
            so_lan_phai_test = ${tc.so_lan_phai_test},
            priority = ${tc.priority},
            updated_at = NOW()
          WHERE id = ${tc.id}
          RETURNING *
        `
        return updated[0]
      })
    )
    console.log("Test cases updated:", results)

    return NextResponse.json({ testCases: results })
  } catch (error) {
    console.error("Update test cases error:", error)
    return NextResponse.json(
      { 
        error: "Lỗi server nội bộ",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}
