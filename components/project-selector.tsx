"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ChevronDown, FolderOpen } from "lucide-react"
import { ProjectSelectionModal } from "@/components/project-selection-modal"

export function ProjectSelector() {
  const { selectedProject, user } = useAuth()
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <div className="flex items-center">
        <span className="mr-2 text-sm font-medium hidden lg:inline">Dự án:</span>
        <Button
          variant="outline"
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 max-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FolderOpen className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {selectedProject?.name || "Chọn dự án"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </div>

      {/* Modal chào mừng khi ấn nút project selector */}
      <ProjectSelectionModal
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
        }}
        onProjectSelected={(projectId: string) => {
          setShowDialog(false);
          
          // Navigate to project dashboard
          setTimeout(() => {
            const redirectPath = `/project/${projectId}/dashboard`;
            window.location.href = redirectPath;
          }, 100);
        }}
        userRole={user?.role || "tester"}
      />
    </>
  )
}