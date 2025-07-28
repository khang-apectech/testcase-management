"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Project } from "@/lib/db"
import { PlusCircle, Edit, Trash2, FolderOpen, Search, X, Calendar, Users, TestTube } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ProjectSelectionDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ProjectSelectionDialog({ 
  isOpen, 
  onOpenChange 
}: ProjectSelectionDialogProps = {}) {
  const { user, fetchWithAuth, setSelectedProject: updateContextProject } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  // Dialog state - can be controlled from outside or internally
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isOpen !== undefined ? isOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value)
    } else {
      setInternalOpen(value)
    }
  }
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  
  // For project creation/editing
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, project: Project | null}>({
    show: false,
    project: null
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Effect for initial load
  useEffect(() => {
    // Check if user has already selected a project (stored in localStorage)
    const storedProjectId = localStorage.getItem("selectedProjectId")
    const storedProjectName = localStorage.getItem("selectedProjectName")
    
    if (storedProjectId && storedProjectName) {
      setSelectedProject(storedProjectId)
      // Only redirect if this is the initial load, not when opened from sidebar
      if (!isOpen) {
        router.push(`/project/${storedProjectId}`)
        setOpen(false)
      }
      return
    }
    
    // Only auto-open on initial load if no project is selected
    if (!isOpen && !storedProjectId) {
      setOpen(true)
    }
  }, [user])
  
  // Effect to fetch projects when dialog is open
  useEffect(() => {
    if (open) {
      console.log("Dialog opened, fetching projects...")
      fetchProjects()
      setSearchTerm("") // Reset search when opening
    }
  }, [open])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      // ESC to close
      if (e.key === 'Escape' && !showProjectForm && !deleteConfirm.show) {
        setOpen(false);
      }
      
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !showProjectForm) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Tìm kiếm dự án..."]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, showProjectForm, deleteConfirm.show])

  const fetchProjects = async () => {
    try {
      console.log("Fetching projects...")
      setLoading(true)
      const response = await fetchWithAuth("/api/projects")
      console.log("API response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Projects data:", data)
        if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects)
          console.log("Projects set:", data.projects.length, "projects")
        } else {
          console.error("Invalid projects data format:", data)
          toast({
            title: "Lỗi dữ liệu",
            description: "Định dạng dữ liệu dự án không hợp lệ",
            variant: "destructive",
          })
        }
      } else {
        console.error("Failed to fetch projects:", response.status)
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách dự án",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi tải dự án",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = (projectId: string, projectName: string) => {
    console.log("Project selected:", projectId, projectName)
    setSelectedProject(projectId)
    
    // Store the selected project in localStorage
    localStorage.setItem("selectedProjectId", projectId)
    localStorage.setItem("selectedProjectName", projectName)
    
    // Update context directly
    updateContextProject({ id: projectId, name: projectName })
    
    // Also trigger storage event for other components
    if (typeof window !== 'undefined') {
      try {
        // This will trigger a re-render of components using the context
        window.dispatchEvent(new Event('storage'))
      } catch (error) {
        console.error("Error dispatching storage event:", error)
      }
    }
    
    // Close the dialog first
    setOpen(false)
    
    // Check if we're already in a project page
    const currentPath = window.location.pathname
    const isInProjectPage = currentPath.startsWith('/project/')
    
    if (isInProjectPage) {
      // If we're in a project page, redirect to the new project's dashboard
      const pathParts = currentPath.split('/')
      if (pathParts.length >= 3) {
        // Keep the same page type (dashboard, testcase, etc.) but change project
        pathParts[2] = projectId
        const newPath = pathParts.join('/')
        setTimeout(() => {
          window.location.href = newPath
        }, 100)
      } else {
        // Fallback to dashboard
        setTimeout(() => {
          window.location.href = `/project/${projectId}/dashboard`
        }, 100)
      }
    } else {
      // If we're not in a project page, go to dashboard
      setTimeout(() => {
        window.location.href = `/project/${projectId}/dashboard`
      }, 100)
    }
  }

  const handleCreateProject = () => {
    setEditingProject(null)
    setProjectName("")
    setProjectDescription("")
    setShowProjectForm(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setProjectName(project.name)
    setProjectDescription(project.description || "")
    setShowProjectForm(true)
  }

  const handleDeleteProject = (project: Project) => {
    setDeleteConfirm({ show: true, project })
  }

  const confirmDeleteProject = async () => {
    if (!deleteConfirm.project) return
    
    try {
      setDeleteLoading(true)
      const response = await fetchWithAuth(`/api/projects/${deleteConfirm.project.id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã xóa dự án",
        })
        fetchProjects()
        setDeleteConfirm({ show: false, project: null })
      } else {
        const error = await response.json()
        toast({
          title: "Lỗi",
          description: error.error || "Không thể xóa dự án",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi xóa dự án",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = projectName.trim()
    if (!trimmedName) {
      toast({
        title: "Lỗi",
        description: "Tên dự án không được để trống",
        variant: "destructive",
      })
      return
    }

    if (trimmedName.length < 3) {
      toast({
        title: "Lỗi",
        description: "Tên dự án phải có ít nhất 3 ký tự",
        variant: "destructive",
      })
      return
    }

    if (trimmedName.length > 100) {
      toast({
        title: "Lỗi",
        description: "Tên dự án không được vượt quá 100 ký tự",
        variant: "destructive",
      })
      return
    }
    
    try {
      setFormLoading(true)
      
      if (editingProject) {
        // Update existing project
        const response = await fetchWithAuth(`/api/projects/${editingProject.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: trimmedName,
            description: projectDescription.trim(),
          }),
        })
        
        if (response.ok) {
          toast({
            title: "Thành công",
            description: "Đã cập nhật dự án",
          })
          setShowProjectForm(false)
          fetchProjects()
        } else {
          const error = await response.json()
          toast({
            title: "Lỗi",
            description: error.error || "Không thể cập nhật dự án",
            variant: "destructive",
          })
        }
      } else {
        // Create new project
        const response = await fetchWithAuth("/api/projects", {
          method: "POST",
          body: JSON.stringify({
            name: trimmedName,
            description: projectDescription.trim(),
          }),
        })
        
        if (response.ok) {
          toast({
            title: "Thành công",
            description: "Đã tạo dự án mới",
          })
          setShowProjectForm(false)
          fetchProjects()
        } else {
          const error = await response.json()
          toast({
            title: "Lỗi",
            description: error.error || "Không thể tạo dự án",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error submitting project:", error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi lưu dự án",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  // Handle dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    console.log("Dialog open change:", newOpen)
    
    if (newOpen) {
      // Always allow opening and fetch projects
      console.log("Dialog opening, fetching projects...")
      fetchProjects()
    }
    
    // Always update the open state
    setOpen(newOpen)
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            {showProjectForm 
              ? (editingProject ? "Chỉnh sửa dự án" : "Tạo dự án mới")
              : "Chọn dự án"
            }
          </DialogTitle>
        </DialogHeader>
        
        {showProjectForm ? (
          <div className="space-y-6 animate-scale-in">
            <form onSubmit={handleSubmitProject} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="projectName" className="text-sm font-medium text-foreground">
                    Tên dự án <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Ví dụ: Website E-commerce, Mobile App..."
                    required
                    className="h-11"
                    maxLength={100}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tên dự án sẽ hiển thị trong danh sách</span>
                    <span>{projectName.length}/100</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="projectDescription" className="text-sm font-medium text-foreground">
                    Mô tả dự án
                  </label>
                  <Textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Mô tả chi tiết về dự án, mục tiêu, phạm vi testing..."
                    rows={4}
                    className="resize-none"
                    maxLength={500}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mô tả sẽ giúp team hiểu rõ hơn về dự án</span>
                    <span>{projectDescription.length}/500</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProjectForm(false)}
                  disabled={formLoading}
                  className="w-full sm:w-auto"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  disabled={formLoading || !projectName.trim() || projectName.trim().length < 3}
                  className="w-full sm:w-auto"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang lưu...
                    </>
                  ) : editingProject ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Cập nhật dự án
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Tạo dự án
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        ) : (
          <>
            <div className="space-y-4 flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Search/Filter bar */}
              <div className="space-y-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Tìm kiếm dự án... (Ctrl+K)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                      autoFocus={!showProjectForm}
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setSearchTerm("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {user?.role === "admin" && (
                    <Button onClick={handleCreateProject} size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Tạo mới
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {(() => {
                      const filteredCount = projects.filter(project =>
                        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).length;
                      if (searchTerm) {
                        return `${filteredCount} / ${projects.length} dự án`;
                      }
                      return projects.length > 0 ? `${projects.length} dự án có sẵn` : "";
                    })()}
                  </span>
                  {searchTerm && (
                    <span className="text-primary">Đang lọc: "{searchTerm}"</span>
                  )}
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 flex-1 min-h-0 max-h-[55vh] scrollbar-thin">
                {loading ? (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Đang tải dự án...</p>
                    </div>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-lg mb-2">Chưa có dự án nào</h3>
                      <p className="text-muted-foreground mb-4">Tạo dự án đầu tiên để bắt đầu</p>
                      {user?.role === "admin" && (
                        <Button onClick={handleCreateProject}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Tạo dự án mới
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  (() => {
                    const filteredProjects = projects.filter(project =>
                      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    
                    if (filteredProjects.length === 0 && searchTerm) {
                      return (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                              <Search className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-lg mb-2">Không tìm thấy dự án</h3>
                            <p className="text-muted-foreground mb-4">
                              Không có dự án nào khớp với "{searchTerm}"
                            </p>
                            <Button variant="outline" onClick={() => setSearchTerm("")}>
                              <X className="mr-2 h-4 w-4" />
                              Xóa bộ lọc
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    
                    return filteredProjects.map((project, index) => (
                    <Card
                      key={project.id}
                      className={`group cursor-pointer hover:border-primary hover:shadow-lg hover:scale-[1.02] transition-all duration-200 relative animate-fade-in ${
                        selectedProject === project.id ? "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.01]" : ""
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => handleSelectProject(project.id, project.name)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-base font-semibold truncate">
                                {project.name}
                              </CardTitle>
                              <Badge variant="secondary" className="text-xs">
                                Active
                              </Badge>
                            </div>
                          </div>
                          {user?.role === "admin" && (
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditProject(project)
                                }}
                                title="Chỉnh sửa dự án"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteProject(project)
                                }}
                                title="Xóa dự án"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-sm line-clamp-2 mb-2">
                          {project.description || "Không có mô tả"}
                        </CardDescription>
                        
                        {/* Project Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                          <div className="flex items-center text-muted-foreground">
                            <TestTube className="w-3 h-3 mr-1" />
                            <span>0 test cases</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Users className="w-3 h-3 mr-1" />
                            <span>0 testers</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>Tạo gần đây</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-xs text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              Hoạt động
                            </div>
                            {selectedProject === project.id && (
                              <div className="flex items-center text-xs text-primary font-medium">
                                <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
                                Đang chọn
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ));
                  })()
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, project: null })}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Xác nhận xóa dự án
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Bạn có chắc chắn muốn xóa dự án <strong>"{deleteConfirm.project?.name}"</strong> không?
            </p>
            <p className="text-red-600 font-medium">
              ⚠️ Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan đến dự án.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteLoading}>Hủy bỏ</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteProject}
            disabled={deleteLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleteLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa dự án
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}