"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pl-1 pr-0">
        <div className="px-7">
          <Link
            href="/"
            className="flex items-center"
            onClick={() => setOpen(false)}
          >
            <span className="font-bold">Test Case Management</span>
          </Link>
        </div>
        <div className="my-4 space-y-1">
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
                <Link href={route.href} onClick={() => setOpen(false)}>
                  <Icon className="mr-2 h-4 w-4" />
                  {route.title}
                </Link>
              </Button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
} 