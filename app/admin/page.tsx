"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Users, BarChart3, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  const adminModules = [
    {
      title: "Quản lý Dự án",
      description: "Tạo, chỉnh sửa và quản lý tất cả dự án trong hệ thống",
      icon: FolderOpen,
      href: "/admin/projects",
      color: "bg-blue-500",
    },
    {
      title: "Quản lý Tester",
      description: "Thêm tester mới, phân quyền và gán dự án cho tester",
      icon: Users,
      href: "/admin/testers",
      color: "bg-green-500",
    },
    {
      title: "Thống kê Tổng quan",
      description: "Xem báo cáo và thống kê toàn hệ thống",
      icon: BarChart3,
      href: "/admin/statistics",
      color: "bg-purple-500",
    },
    {
      title: "Cài đặt Hệ thống",
      description: "Cấu hình và thiết lập hệ thống",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Bảng điều khiển Admin
        </h1>
        <p className="text-xl text-gray-600">
          Chào mừng đến với bảng điều khiển quản trị hệ thống
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {adminModules.map((module, index) => {
          const IconComponent = module.icon;
          return (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200"
              onClick={() => router.push(module.href)}
            >
              <CardHeader className="text-center">
                <div className={`w-16 h-16 ${module.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  {module.description}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(module.href);
                  }}
                >
                  Truy cập
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/")}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Quay lại trang chủ
        </Button>
      </div>
    </div>
  );
}