export async function getDbConnection() {
  try {
    const { neon } = await import("@neondatabase/serverless")

    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL not found")
      throw new Error("DATABASE_URL environment variable is required")
    }

    const sql = neon(process.env.DATABASE_URL)
    return sql
  } catch (error) {
    console.error("❌ Database connection error:", error)
    throw error
  }
}

export type User = {
  id: string
  email: string
  name: string
  role: "admin" | "tester"
  created_at: string
}

export type Project = {
  id: string
  name: string
  description: string
  created_by: string
  created_at: string
  updated_at: string
  updated_by: string
}

export type ProjectWithStats = Project & {
  test_cases_count: number
  testers_count: number
  executions_count: number
  pass_rate: number
}

export type TestCase = {
  id: string
  hang_muc: string // Hạng mục
  tinh_nang: string // Tính năng
  so_lan_phai_test: number // Số lần phải test (admin quy định)
  platform: string // Platform: web, app, cms, server
  created_by: string
  created_at: string
  updated_at: string
  project_id: string // ID của dự án
}

export type TestExecution = {
  id: string
  test_case_id: string
  tester_id: string
  so_lan_da_test: number // Số lần đã test (user điền)
  cam_nhan: string // Cảm nhận
  loi: string // Lỗi
  execution_date: string
  created_at: string
  updated_at: string
  // Joined fields
  hang_muc?: string
  tinh_nang?: string
  so_lan_phai_test?: number
  tester_name?: string
  project_id?: string
  project_name?: string
}

export type TestCaseWithExecution = TestCase & {
  latest_execution?: TestExecution
  assigned_to_current_user?: boolean
  progress_percentage?: number // Tỷ lệ hoàn thành (so_lan_da_test / so_lan_phai_test * 100)
  project_name?: string
}

export type UserProjectAccess = {
  id: string
  user_id: string
  project_id: string
  granted_at: string
  granted_by: string
  // Joined fields
  project_name?: string
  user_name?: string
}
