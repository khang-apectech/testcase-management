require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Test basic connection
    console.log('✅ Database connected');
    
    // Check if required tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'projects', 'test_cases', 'test_executions', 'user_project_access', 'user_test_assignments')
      ORDER BY table_name
    `;
    
    console.log('📋 Existing tables:', tables.map(t => t.table_name));
    
    // Check users table structure
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    console.log('👤 Users table columns:', userColumns);
    
    // Count records in each table
    if (tables.find(t => t.table_name === 'users')) {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log('👥 Total users:', userCount[0].count);
    }
    
    if (tables.find(t => t.table_name === 'projects')) {
      const projectCount = await sql`SELECT COUNT(*) as count FROM projects`;
      console.log('📁 Total projects:', projectCount[0].count);
    }
    
    if (tables.find(t => t.table_name === 'user_project_access')) {
      const accessCount = await sql`SELECT COUNT(*) as count FROM user_project_access`;
      console.log('🔗 User project access records:', accessCount[0].count);
    }
    
    if (tables.find(t => t.table_name === 'user_test_assignments')) {
      const assignmentCount = await sql`SELECT COUNT(*) as count FROM user_test_assignments`;
      console.log('📝 User test assignments:', assignmentCount[0].count);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();