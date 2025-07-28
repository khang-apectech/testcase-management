"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/icons"
import { UserNav } from "@/components/dashboard/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import ProjectSelectionDialog from "@/components/project-selection-dialog"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  projectId?: string
}

export function Sidebar({ className, projectId }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout, selectedProject } = useAuth()
  const router = useRouter()
  const [showProjectDialog, setShowProjectDialog] = useState(false)

  const adminRoutes = projectId ? [
    {
      href: `/project/${projectId}`,
      icon: Icons.home,
      title: "Trang chủ",
    },
    {
      href: `/project/${projectId}/testcase`,
      icon: Icons.testCase,
      title: "Test Cases",
    },
    {
      href: `/project/${projectId}/testers`,
      icon: Icons.users,
      title: "Quản lý Tester",
    },
    {
      href: `/project/${projectId}/reports`,
      icon: Icons.stats,
      title: "Báo cáo",
    },
    {
      href: `/project/${projectId}/settings`,
      icon: Icons.settings,
      title: "Cài đặt",
    },
  ] : [
    {
      href: "/",
      icon: Icons.home,
      title: "Trang chủ",
    },
    {
      href: "/admin/projects",
      icon: Icons.project,
      title: "Dự án",
    },
    {
      href: "/admin/testers",
      icon: Icons.users,
      title: "Người dùng",
    },
    {
      href: "/admin/activities",
      icon: Icons.activity,
      title: "Hoạt động",
    },
    {
      href: "/admin/stats",
      icon: Icons.stats,
      title: "Báo cáo",
    },
    {
      href: "/admin/debug",
      icon: Icons.settings,
      title: "Debug & Test",
    },
  ]

  const testerRoutes = projectId ? [
    {
      href: `/project/${projectId}`,
      icon: Icons.home,
      title: "Trang chủ",
    },
    {
      href: `/project/${projectId}/testcase`,
      icon: Icons.testCase,
      title: "Test Cases",
    },
  ] : [
    {
      href: "/",
      icon: Icons.home,
      title: "Trang chủ",
    },
    {
      href: "/admin/projects",
      icon: Icons.project,
      title: "Dự án",
    },
  ]

  const projectRoute = {
    href: "#",
    icon: Icons.project,
    title: selectedProject ? `Dự án: ${selectedProject.name}` : "Chọn dự án",
    action: () => {
      // Open the project selection dialog
      setShowProjectDialog(true)
    }
  }

  const logoutRoute = {
    href: "/logout",
    icon: Icons.logout,
    title: "Đăng xuất",
  }

  const routes = user?.role === "admin"
    ? [projectRoute, ...adminRoutes, logoutRoute]
    : [projectRoute, ...testerRoutes, logoutRoute]

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    await logout()
    router.push("/login")
  }

  return (
    <div className={cn("pb-12", className)}>
      {/* Project Selection Dialog */}
      <ProjectSelectionDialog 
        isOpen={showProjectDialog} 
        onOpenChange={setShowProjectDialog} 
      />
      
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
              
              if (route.title.includes("Dự án")) {
                return (
                  <Button
                    key={route.href}
                    variant="outline"
                    className={cn("w-full justify-start", 
                      selectedProject 
                        ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200" 
                        : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                    )}
                    onClick={route.action}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {route.title}
                  </Button>
                )
              }
              
              return (
                <Button
                  key={route.href}
                  variant={pathname === route.href || (route.href !== "/" && pathname.startsWith(route.href)) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    pathname === route.href || (route.href !== "/" && pathname.startsWith(route.href))
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