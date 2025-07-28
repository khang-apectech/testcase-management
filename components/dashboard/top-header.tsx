"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { TesterListButton } from "@/components/tester-list-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserNav } from "@/components/dashboard/user-nav";
import { Folder, Users, Settings, ChevronDown } from "lucide-react";
import Link from "next/link";
import ProjectSelectionDialog from "@/components/project-selection-dialog";

export function TopHeader() {
  const { user, selectedProject } = useAuth();
  const [showProjectDialog, setShowProjectDialog] = useState(false);

  const handleProjectClick = () => {
    setShowProjectDialog(true);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Project info */}
        <div className="flex items-center space-x-4">
          {selectedProject ? (
            <Button
              variant="ghost"
              onClick={handleProjectClick}
              className="flex items-center space-x-2 px-3 py-2 h-auto hover:bg-gray-50"
            >
              <Folder className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{selectedProject.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                <Badge variant="outline" className="text-xs">
                  Dự án hiện tại
                </Badge>
              </div>
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleProjectClick}
              className="flex items-center space-x-2 px-3 py-2 h-auto text-amber-600 hover:bg-amber-50"
            >
              <Folder className="w-5 h-5" />
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Chưa chọn dự án</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
                <span className="text-xs text-amber-600/70">Click để chọn dự án</span>
              </div>
            </Button>
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

      {/* Project Selection Dialog */}
      <ProjectSelectionDialog 
        isOpen={showProjectDialog}
        onOpenChange={setShowProjectDialog}
      />
    </div>
  );
}