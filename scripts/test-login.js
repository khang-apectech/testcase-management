import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL)

async function testLogin() {
  try {
    console.log("🔍 Testing login functionality...")

    // Check if users exist
    const users = await sql`SELECT email, name, role, password FROM users ORDER BY role DESC`

    console.log("\n👥 Users in database:")
    users.forEach((user) => {
      console.log(`  - ${user.email} (${user.role}) - ${user.name}`)
    })

    // Test password verification
    const testEmail = "admin@testcase.com"
    const testPassword = "password123"

    const adminUser = users.find((u) => u.email === testEmail)
    if (adminUser) {
      console.log(`\n🔐 Testing password for ${testEmail}:`)
      console.log(`  - Stored hash: ${adminUser.password.substring(0, 20)}...`)

      try {
        const isValid = await bcrypt.compare(testPassword, adminUser.password)
        console.log(`  - Password verification: ${isValid ? "✅ VALID" : "❌ INVALID"}`)

        if (!isValid) {
          // Generate new hash
          const newHash = await bcrypt.hash(testPassword, 10)
          console.log(`  - New hash would be: ${newHash.substring(0, 20)}...`)

          // Update password in database
          await sql`UPDATE users SET password = ${newHash} WHERE email = ${testEmail}`
          console.log(`  - ✅ Password updated for ${testEmail}`)
        }
      } catch (error) {
        console.log(`  - ❌ Error verifying password: ${error.message}`)
      }
    }

    console.log("\n🎯 Ready to test login!")
    console.log("Try logging in with:")
    console.log("  Email: admin@testcase.com")
    console.log("  Password: password123")
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

testLogin()
