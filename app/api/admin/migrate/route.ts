import { NextRequest, NextResponse } from 'next/server'
import { getDbConnection } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra authentication và phân quyền admin
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }
    
    if (authResult.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    console.log('🔗 Starting migration...')
    const sql = await getDbConnection()

    // Add priority field
    console.log('Adding priority field...')
    await sql`
      ALTER TABLE test_cases 
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' 
      CHECK (priority IN ('low', 'medium', 'high', 'critical'))
    `

    // Add platform field
    console.log('Adding platform field...')
    await sql`
      ALTER TABLE test_cases 
      ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'web' 
      CHECK (platform IN ('web', 'app', 'cms', 'server'))
    `

    // Add preconditions field
    console.log('Adding preconditions field...')
    await sql`ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS preconditions TEXT`

    // Add steps field  
    console.log('Adding steps field...')
    await sql`ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS steps TEXT`

    // Add expected_result field
    console.log('Adding expected_result field...')
    await sql`ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS expected_result TEXT`

    // Create index for priority
    console.log('Creating index...')
    await sql`CREATE INDEX IF NOT EXISTS idx_test_cases_priority ON test_cases(priority)`

    // Update existing test cases
    console.log('Updating existing test cases...')
    await sql`UPDATE test_cases SET priority = 'medium' WHERE priority IS NULL`
    await sql`UPDATE test_cases SET platform = 'web' WHERE platform IS NULL`

    await sql`
      UPDATE test_cases 
      SET 
          preconditions = 'Hệ thống đã được khởi động và sẵn sàng để test',
          steps = '1. Thực hiện các bước test theo tính năng đã mô tả
2. Kiểm tra kết quả
3. Ghi nhận lỗi nếu có',
          expected_result = 'Tính năng hoạt động đúng như mong đợi'
      WHERE preconditions IS NULL OR preconditions = ''
    `

    // Add status field for users
    console.log('Adding status field to users table...')
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' 
      CHECK (status IN ('active', 'inactive'))
    `

    // Update existing users to have active status
    console.log('Updating existing users status...')
    await sql`UPDATE users SET status = 'active' WHERE status IS NULL`

    // Ensure user_project_access table exists
    console.log('Creating user_project_access table if not exists...')
    await sql`
      CREATE TABLE IF NOT EXISTS user_project_access (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        granted_at TIMESTAMP DEFAULT NOW(),
        granted_by UUID REFERENCES users(id),
        UNIQUE(user_id, project_id)
      )
    `

    // Ensure user_test_assignments table exists
    console.log('Creating user_test_assignments table if not exists...')
    await sql`
      CREATE TABLE IF NOT EXISTS user_test_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW(),
        assigned_by UUID REFERENCES users(id),
        UNIQUE(user_id, test_case_id)
      )
    `

    // Create indexes for better performance
    console.log('Creating indexes...')
    await sql`CREATE INDEX IF NOT EXISTS idx_user_project_access_user_id ON user_project_access(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_project_access_project_id ON user_project_access(project_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_test_assignments_user_id ON user_test_assignments(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_test_assignments_test_case_id ON user_test_assignments(test_case_id)`

    // Test the new fields
    console.log('Testing new fields...')
    const testResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'test_cases' 
      AND column_name IN ('priority', 'preconditions', 'steps', 'expected_result')
      ORDER BY column_name
    `

    // Test users table fields
    const usersFields = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'status'
    `

    console.log('✅ Migration completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      testCasesFields: testResult,
      usersFields: usersFields
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}