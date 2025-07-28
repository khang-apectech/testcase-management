"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { UnifiedProjectSelector } from "@/components/unified-project-selector"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [storageUpdate, setStorageUpdate] = useState(0)
  
  console.log("🏠 HomePage render:", { loading, user: user?.email, showProjectModal })

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      console.log("� Storage changed, triggering re-check");
      setStorageUpdate(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    console.log("🔍 HomePage useEffect:", { loading, user: user?.email, role: user?.role, storageUpdate });
    
    if (!loading) {
      if (user) {
        console.log("✅ User authenticated:", user.role);
        
        // Kiểm tra role và redirect tương ứng
        if (user.role === "admin") {
          const lastSelectedProjectId = localStorage.getItem("selectedProjectId")
          console.log("🎯 Admin lastSelectedProjectId:", lastSelectedProjectId);
          
          if (lastSelectedProjectId) {
            const redirectPath = `/project/${lastSelectedProjectId}/dashboard`;
            console.log("🚀 Admin redirect to:", redirectPath);
            router.push(redirectPath);
          } else {
            console.log("📋 Show project modal for admin");
            setShowProjectModal(true);
          }
        } else if (user.role === "tester") {
          console.log("👨‍💻 Tester - show project modal");
          setShowProjectModal(true);
        } else {
          console.log("❓ Unknown role:", user.role);
          // Fallback - show modal for any authenticated user
          setShowProjectModal(true);
        }
      } else {
        console.log("🚪 No user - redirect to login");
        router.push("/login");
      }
    } else {
      console.log("⏳ Still loading...");
    }
  }, [user, loading, router, storageUpdate])

  const handleProjectSelected = (projectId: string) => {
    console.log("🎯 Project selected callback:", projectId);
    setShowProjectModal(false);
    
    // Force redirect from here as well to ensure it happens
    setTimeout(() => {
      const redirectPath = `/project/${projectId}/dashboard`;
      console.log("🚀 Force redirect from callback:", redirectPath);
      router.push(redirectPath);
    }, 200);
  };

  const handleModalClose = () => {
    setShowProjectModal(false);
    
    // If modal closed without selection and user is admin, go to admin page
    const selectedProjectId = localStorage.getItem("selectedProjectId");
    if (!selectedProjectId && user?.role === "admin") {
      console.log("🏠 No project selected, redirect admin to /admin/projects");
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
          
          {/* Debug info */}
          <div className="mt-4 text-xs text-gray-400">
            <p>Loading: {loading.toString()}</p>
            <p>User: {user?.email || 'null'}</p>
            <p>Role: {user?.role || 'null'}</p>
            <p>Show Modal: {showProjectModal.toString()}</p>
            <p>Selected Project: {typeof window !== 'undefined' ? localStorage.getItem("selectedProjectName") || 'Chưa chọn' : 'server'}</p>
          </div>
        </div>
      </div>

      <UnifiedProjectSelector
        isOpen={showProjectModal}
        onClose={handleModalClose}
        onProjectSelected={handleProjectSelected}
        mode="selection"
        title="Chào mừng! Chọn dự án để bắt đầu"
        description={user?.role === "admin" 
          ? "Chọn dự án bạn muốn quản lý" 
          : "Chọn dự án bạn được phân công để bắt đầu làm việc"
        }
      />
    </>
  )
}
