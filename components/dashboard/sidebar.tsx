"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/icons"
import { UserNav } from "@/components/dashboard/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()

  const adminRoutes = [
    {
      href: "/dashboard",
      icon: Icons.home,
      title: "Trang chủ",
    },
    {
      href: "/dashboard/test-cases",
      icon: Icons.testCase,
      title: "Test Cases",
    },
    {
      href: "/dashboard/users",
      icon: Icons.users,
      title: "Người dùng",
    },
    // {
    //   href: "/dashboard/stats",
    //   icon: Icons.stats,
    //   title: "Thống kê",
    // },
    // {
    //   href: "/dashboard/settings",
    //   icon: Icons.settings,
    //   title: "Cài đặt",
    // },
  ]

  const testerRoutes = [
    {
      href: "/dashboard",
      icon: Icons.home,
      title: "Trang chủ",
    },
    {
      href: "/dashboard/test-cases",
      icon: Icons.testCase,
      title: "Test Cases",
    },
  ]

  const logoutRoute = {
    href: "/logout",
    icon: Icons.logout,
    title: "Đăng xuất",
  }

  const routes = user?.role === "admin"
    ? [...adminRoutes, logoutRoute]
    : [...testerRoutes, logoutRoute]

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    await logout()
    router.push("/login")
  }

  return (
    <div className={cn("pb-12", className)}>
      {/* Logo & Navigation */}
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mb-4 flex items-center justify-between px-4">
            <h2 className="text-lg font-semibold">
              Test Case Management
            </h2>
            <ThemeToggle />
          </div>
          <div className="space-y-1">
            {routes.map((route) => {
              const Icon = route.icon
              if (route.title === "Đăng xuất") {
                return (
                  <Button
                    key={route.href}
                    variant="ghost"
                    className={cn("w-full justify-start text-red-600 hover:bg-red-50")}
                    onClick={handleLogout}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {route.title}
                  </Button>
                )
              }
              return (
                <Button
                  key={route.href}
                  variant={pathname === route.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    pathname === route.href
                      ? "bg-muted hover:bg-muted"
                      : "hover:bg-transparent hover:underline"
                  )}
                  asChild
                >
                  <Link href={route.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {route.title}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* User Profile */}
      {/* Đã có nút Đăng xuất ở menu, không cần UserNav ở đây nữa */}
    </div>
  )
} 