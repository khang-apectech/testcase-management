import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function testConnection() {
  try {
    console.log("🔗 Testing database connection...")

    // Test basic connection
    const result = await sql`SELECT NOW() as current_time, version() as db_version`
    console.log("✅ Database connected successfully!")
    console.log("📅 Current time:", result[0].current_time)
    console.log("🗄️ Database version:", result[0].db_version.split(" ")[0])

    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    console.log("\n📋 Tables in database:")
    tables.forEach((table) => {
      console.log(`  - ${table.table_name}`)
    })

    // Check sample data
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const testCaseCount = await sql`SELECT COUNT(*) as count FROM test_cases`
    const executionCount = await sql`SELECT COUNT(*) as count FROM test_executions`

    console.log("\n📊 Data summary:")
    console.log(`  - Users: ${userCount[0].count}`)
    console.log(`  - Test Cases: ${testCaseCount[0].count}`)
    console.log(`  - Test Executions: ${executionCount[0].count}`)

    console.log("\n🎉 Database setup completed successfully!")
    console.log("\n🔐 Demo accounts:")
    console.log("  Admin: admin@testcase.com / password123")
    console.log("  Tester: tester1@testcase.com / password123")
  } catch (error) {
    console.error("❌ Database connection failed:", error.message)
    process.exit(1)
  }
}

testConnection()
