import { Sidebar } from "@/components/dashboard/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { TopHeader } from "@/components/dashboard/top-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="admin">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}