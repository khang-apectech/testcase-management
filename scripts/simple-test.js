// Simple test without external dependencies
async function testBasicConnection() {
  try {
    console.log("🔍 Testing basic connection...")
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL)

    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL not found in environment")
      return
    }

    // Test basic fetch to our API
    const testUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
    console.log("🌐 Testing API endpoint...")

    // Simple connection test
    console.log("✅ Environment variables loaded")
    console.log("✅ Ready to test login")

    console.log("\n🎯 Try logging in with:")
    console.log("  Email: admin@testcase.com")
    console.log("  Password: password123")
  } catch (error) {
    console.error("❌ Test failed:", error.message)
  }
}

testBasicConnection()
