import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { AuthGuard } from "@/components/auth-guard"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        {/* Mobile Navigation */}
        <div className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background px-4 lg:hidden">
          <MobileNav />
          <div className="flex items-center space-x-2">
            {/* Add mobile user nav here if needed */}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden w-64 border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <Sidebar />
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
} 