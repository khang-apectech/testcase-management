import { NextResponse, type NextRequest } from "next/server"
import { getDbConnection } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET /api/stats/detailed - Lấy thống kê chi tiết
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Getting detailed stats...")
    const authHeader = request.headers.get("authorization") || undefined
    const currentUser = await getCurrentUser(authHeader)
    
    if (!currentUser) {
      console.log("❌ Unauthorized access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = await getDbConnection()
    console.log("✅ Database connected")

    try {
      // Get time-based stats
      const [dailyStats, weeklyStats, monthlyStats] = await Promise.all([
        // Daily stats (last 30 days)
        sql`
          WITH dates AS (
            SELECT generate_series(
              CURRENT_DATE - INTERVAL '29 days',
              CURRENT_DATE,
              '1 day'::interval
            )::date as date
          )
          SELECT 
            dates.date,
            COALESCE(COUNT(DISTINCT te.id), 0) as executions,
            COALESCE(COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END), 0) as issues
          FROM dates
          LEFT JOIN test_executions te 
            ON DATE(te.execution_date) = dates.date
          GROUP BY dates.date
          ORDER BY dates.date
        `,
        // Weekly stats (last 12 weeks)
        sql`
          WITH weeks AS (
            SELECT generate_series(
              date_trunc('week', CURRENT_DATE - INTERVAL '11 weeks'),
              date_trunc('week', CURRENT_DATE),
              '1 week'::interval
            )::date as week
          )
          SELECT 
            to_char(weeks.week, 'YYYY-"W"IW') as week,
            COALESCE(COUNT(DISTINCT te.id), 0) as executions,
            COALESCE(COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END), 0) as issues
          FROM weeks
          LEFT JOIN test_executions te 
            ON DATE(te.execution_date) >= weeks.week 
            AND DATE(te.execution_date) < weeks.week + INTERVAL '1 week'
          GROUP BY weeks.week
          ORDER BY weeks.week
        `,
        // Monthly stats (last 12 months)
        sql`
          WITH months AS (
            SELECT generate_series(
              date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
              date_trunc('month', CURRENT_DATE),
              '1 month'::interval
            )::date as month
          )
          SELECT 
            to_char(months.month, 'YYYY-MM') as month,
            COALESCE(COUNT(DISTINCT te.id), 0) as executions,
            COALESCE(COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END), 0) as issues
          FROM months
          LEFT JOIN test_executions te 
            ON DATE(te.execution_date) >= months.month 
            AND DATE(te.execution_date) < months.month + INTERVAL '1 month'
          GROUP BY months.month
          ORDER BY months.month
        `
      ])

      // Get category stats
      const categoryStats = await sql`
        WITH execution_counts AS (
          SELECT 
            test_case_id,
            COUNT(*) as so_lan_da_test
          FROM test_executions
          GROUP BY test_case_id
        )
        SELECT 
          tc.hang_muc,
          COUNT(tc.id) as total_cases,
          COALESCE(COUNT(CASE WHEN ec.so_lan_da_test >= tc.so_lan_phai_test THEN 1 END), 0) as completed,
          COALESCE(COUNT(CASE WHEN ec.so_lan_da_test > 0 AND ec.so_lan_da_test < tc.so_lan_phai_test THEN 1 END), 0) as in_progress,
          COALESCE(COUNT(CASE WHEN ec.so_lan_da_test IS NULL OR ec.so_lan_da_test = 0 THEN 1 END), 0) as not_started,
          COALESCE(COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END), 0) as issues
        FROM test_cases tc
        LEFT JOIN execution_counts ec ON ec.test_case_id = tc.id
        LEFT JOIN test_executions te ON te.test_case_id = tc.id
        GROUP BY tc.hang_muc
        ORDER BY tc.hang_muc
      `

      // Get priority stats
      const priorityStats = await sql`
        WITH execution_counts AS (
          SELECT 
            test_case_id,
            COUNT(*) as so_lan_da_test
          FROM test_executions
          GROUP BY test_case_id
        )
        SELECT 
          tc.priority,
          COUNT(tc.id) as count,
          COALESCE(COUNT(CASE WHEN ec.so_lan_da_test >= tc.so_lan_phai_test THEN 1 END), 0) as completed,
          COALESCE(COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END), 0) as issues
        FROM test_cases tc
        LEFT JOIN execution_counts ec ON ec.test_case_id = tc.id
        LEFT JOIN test_executions te ON te.test_case_id = tc.id
        GROUP BY tc.priority
        ORDER BY 
          CASE 
            WHEN tc.priority = 'cao' THEN 1
            WHEN tc.priority = 'trung bình' THEN 2
            ELSE 3
          END
      `

      // Get user stats
      const userStats = await sql`
        WITH execution_counts AS (
          SELECT 
            test_case_id,
            COUNT(*) as so_lan_da_test
          FROM test_executions
          GROUP BY test_case_id
        ),
        user_executions AS (
          SELECT 
            tester_id,
            test_case_id,
            MIN(created_at) as first_execution,
            MAX(execution_date) as last_execution
          FROM test_executions
          GROUP BY tester_id, test_case_id
        )
        SELECT 
          u.name,
          COUNT(DISTINCT uta.test_case_id) as total_assigned,
          COALESCE(COUNT(DISTINCT CASE WHEN ec.so_lan_da_test >= tc.so_lan_phai_test THEN tc.id END), 0) as completed,
          COALESCE(COUNT(DISTINCT CASE WHEN ec.so_lan_da_test > 0 AND ec.so_lan_da_test < tc.so_lan_phai_test THEN tc.id END), 0) as in_progress,
          COALESCE(COUNT(DISTINCT CASE WHEN te.loi != '' THEN te.id END), 0) as issues_found,
          COALESCE(
            ROUND(
              AVG(
                EXTRACT(EPOCH FROM (ue.last_execution - ue.first_execution)) / 60
              )
            ),
            0
          ) as avg_time_per_test
        FROM users u
        LEFT JOIN user_test_assignments uta ON uta.user_id = u.id
        LEFT JOIN test_cases tc ON tc.id = uta.test_case_id
        LEFT JOIN execution_counts ec ON ec.test_case_id = tc.id
        LEFT JOIN test_executions te ON te.test_case_id = tc.id AND te.tester_id = u.id
        LEFT JOIN user_executions ue ON ue.tester_id = u.id AND ue.test_case_id = tc.id
        WHERE u.role = 'tester'
        GROUP BY u.id, u.name
        ORDER BY COUNT(DISTINCT te.id) DESC
      `

      return NextResponse.json({
        timeStats: {
          daily: dailyStats.map(day => ({
            date: day.date,
            executions: Number(day.executions),
            issues: Number(day.issues)
          })),
          weekly: weeklyStats.map(week => ({
            week: week.week,
            executions: Number(week.executions),
            issues: Number(week.issues)
          })),
          monthly: monthlyStats.map(month => ({
            month: month.month,
            executions: Number(month.executions),
            issues: Number(month.issues)
          }))
        },
        categoryStats: categoryStats.map(cat => ({
          hang_muc: cat.hang_muc,
          total_cases: Number(cat.total_cases),
          completed: Number(cat.completed),
          in_progress: Number(cat.in_progress),
          not_started: Number(cat.not_started),
          issues: Number(cat.issues)
        })),
        priorityStats: priorityStats.map(prio => ({
          priority: prio.priority,
          count: Number(prio.count),
          completed: Number(prio.completed),
          issues: Number(prio.issues)
        })),
        userStats: userStats.map(user => ({
          name: user.name,
          total_assigned: Number(user.total_assigned),
          completed: Number(user.completed),
          in_progress: Number(user.in_progress),
          issues_found: Number(user.issues_found),
          avg_time_per_test: Number(user.avg_time_per_test)
        }))
      })
    } catch (dbError) {
      console.error("❌ Database error:", dbError)
      return NextResponse.json(
        { 
          error: "Database error",
          details: dbError instanceof Error ? dbError.message : String(dbError)
        }, 
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("❌ Error getting detailed stats:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
} 