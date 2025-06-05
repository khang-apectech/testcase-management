export async function getDbConnection() {
  try {
    console.log("🔍 Getting database connection...")
    const { neon } = await import("@neondatabase/serverless")

    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL not found")
      throw new Error("DATABASE_URL environment variable is required")
    }

    console.log("✅ Creating database connection...")
    const sql = neon(process.env.DATABASE_URL)
    console.log("✅ Database connection created successfully")
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

export type TestCase = {
  id: string
  hang_muc: string // Hạng mục
  tinh_nang: string // Tính năng
  so_lan_phai_test: number // Số lần phải test (admin quy định)
  created_by: string
  created_at: string
  updated_at: string
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
}

export type TestCaseWithExecution = TestCase & {
  latest_execution?: TestExecution
  assigned_to_current_user?: boolean
  progress_percentage?: number // Tỷ lệ hoàn thành (so_lan_da_test / so_lan_phai_test * 100)
}
