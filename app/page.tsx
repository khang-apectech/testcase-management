"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ProjectSelectionModal } from "@/components/project-selection-modal"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [storageUpdate, setStorageUpdate] = useState(0)

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setStorageUpdate(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Luôn hiện popup chào mừng khi vào app
        setShowProjectModal(true);
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router, storageUpdate])

  const handleProjectSelected = (projectId: string) => {
    setShowProjectModal(false);
    
    // Force redirect from here as well to ensure it happens
    setTimeout(() => {
      const redirectPath = `/project/${projectId}/dashboard`;
      router.push(redirectPath);
    }, 200);
  };

  const handleModalClose = () => {
    setShowProjectModal(false);
    
    // If modal closed without selection and user is admin, go to admin page
    const selectedProjectId = localStorage.getItem("selectedProjectId");
    if (!selectedProjectId && user?.role === "admin") {
      router.push("/admin/projects");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {user.role === "admin" 
              ? "Chào mừng Admin! Đang tải dự án..." 
              : "Chào mừng! Đang tải dự án được phân công..."
            }
          </p>

        </div>
      </div>

      <ProjectSelectionModal
        isOpen={showProjectModal}
        onClose={handleModalClose}
        onProjectSelected={handleProjectSelected}
        userRole={user?.role || "tester"}
      />
    </>
  )
}
