"use client";

import { useAuth } from "@/contexts/auth-context";
import { TesterListButton } from "@/components/tester-list-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserNav } from "@/components/dashboard/user-nav";
import { Folder, Users, Settings } from "lucide-react";
import Link from "next/link";

export function TopHeader() {
  const { user, selectedProject } = useAuth();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Project info */}
        <div className="flex items-center space-x-4">
          {selectedProject ? (
            <div className="flex items-center space-x-2">
              <Folder className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-medium text-gray-900">{selectedProject.name}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  Dự án hiện tại
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-amber-600">
              <Folder className="w-5 h-5" />
              <span className="font-medium">Chưa chọn dự án</span>
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Tester List Button - chỉ hiển thị cho admin */}
          <TesterListButton />
          
          {/* Quick links cho admin */}
          {user?.role === "admin" && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/projects">
                <Settings className="w-4 h-4 mr-2" />
                Quản lý Dự án
              </Link>
            </Button>
          )}

          {/* User Navigation */}
          <UserNav />
        </div>
      </div>
    </div>
  );
}