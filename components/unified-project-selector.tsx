"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { 
  Folder, 
  Users, 
  TestTube, 
  Search, 
  X, 
  PlusCircle, 
  Edit, 
  Trash2,
  Calendar
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  test_cases_count: number;
  testers_count: number;
  my_test_cases?: number;
  created_at?: string;
}

interface UnifiedProjectSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectSelected?: (projectId: string) => void;
  mode?: "selection" | "management"; // selection for initial login, management for header
  title?: string;
  description?: string;
}

export function UnifiedProjectSelector({ 
  isOpen, 
  onClose, 
  onProjectSelected,
  mode = "selection",
  title,
  description
}: UnifiedProjectSelectorProps) {
  const { user, fetchWithAuth, setSelectedProject: updateContextProject } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Project form states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setSearchTerm("");
      setShowProjectForm(false);
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Determine endpoint based on user role and mode
      let endpoint = "/api/projects";
      if (mode === "selection") {
        endpoint = user?.role === "admin" 
          ? "/api/admin/projects" 
          : "/api/tester/assigned-projects";
      }
      
      const response = await fetchWithAuth(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        let projectsData = [];
        if (Array.isArray(data)) {
          projectsData = data;
        } else if (data.projects && Array.isArray(data.projects)) {
          projectsData = data.projects;
        }
        
        setProjects(projectsData);
      } else {
        console.error("Failed to fetch projects:", response.status);
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleConfirm = () => {
    if (selectedProject) {
      const projectObj = projects.find(p => p.id === selectedProject);
      
      if (projectObj) {
        // Save to localStorage
        localStorage.setItem("selectedProjectId", projectObj.id);
        localStorage.setItem("selectedProjectName", projectObj.name);
        
        // Update context
        updateContextProject({ id: projectObj.id, name: projectObj.name });
        
        // Trigger storage event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'));
        }
        
        // Close modal
        onClose();
        
        // Call callback if provided
        if (onProjectSelected) {
          onProjectSelected(selectedProject);
        }
        
        // Navigate based on mode
        setTimeout(() => {
          if (mode === "selection") {
            // For initial selection, go to dashboard
            router.push(`/project/${selectedProject}/dashboard`);
          } else {
            // For header selection, check current path and update accordingly
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/project/')) {
              const pathParts = currentPath.split('/');
              if (pathParts.length >= 3) {
                pathParts[2] = selectedProject;
                const newPath = pathParts.join('/');
                window.location.href = newPath;
              } else {
                router.push(`/project/${selectedProject}/dashboard`);
              }
            } else {
              router.push(`/project/${selectedProject}/dashboard`);
            }
          }
        }, 100);
      }
    }
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
    setShowProjectForm(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || "");
    setShowProjectForm(true);
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = projectName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      toast({
        title: "Lỗi",
        description: "Tên dự án phải có ít nhất 3 ký tự",
        variant: "destructive"
      });
      return;
    }

    try {
      setFormLoading(true);
      
      const url = editingProject 
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";
      
      const method = editingProject ? "PUT" : "POST";
      
      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify({
          name: trimmedName,
          description: projectDescription.trim(),
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Thành công",
          description: editingProject ? "Đã cập nhật dự án" : "Đã tạo dự án mới"
        });
        setShowProjectForm(false);
        fetchProjects();
      } else {
        const error = await response.json();
        toast({
          title: "Lỗi",
          description: error.error || "Không thể lưu dự án",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi lưu dự án",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const dialogTitle = title || (mode === "selection" ? "Chọn Dự án" : "Chọn Dự án");
  const dialogDescription = description || (
    mode === "selection" 
      ? (user?.role === "admin" 
          ? "Chọn dự án bạn muốn quản lý" 
          : "Chọn dự án bạn được phân công để bắt đầu làm việc")
      : "Chọn dự án để chuyển đổi"
  );

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {showProjectForm 
              ? (editingProject ? "Chỉnh sửa dự án" : "Tạo dự án mới")
              : dialogTitle
            }
          </DialogTitle>
          {!showProjectForm && (
            <DialogDescription>{dialogDescription}</DialogDescription>
          )}
        </DialogHeader>

        {showProjectForm ? (
          <div className="space-y-6 overflow-y-auto">
            <form onSubmit={handleSubmitProject} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="projectName" className="text-sm font-medium">
                    Tên dự án <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Ví dụ: Website E-commerce, Mobile App..."
                    required
                    maxLength={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="projectDescription" className="text-sm font-medium">
                    Mô tả dự án
                  </label>
                  <Textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Mô tả chi tiết về dự án..."
                    rows={4}
                    maxLength={500}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProjectForm(false)}
                  disabled={formLoading}
                >
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  disabled={formLoading || !projectName.trim()}
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang lưu...
                    </>
                  ) : editingProject ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Cập nhật
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Tạo dự án
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Search and Create */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm dự án..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
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
              {user?.role === "admin" && mode === "management" && (
                <Button onClick={handleCreateProject} size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tạo mới
                </Button>
              )}
            </div>

            {/* Projects Grid */}
            <div className="flex-1 overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? "Không tìm thấy dự án" : "Không có dự án nào"}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? "Thử tìm kiếm với từ khóa khác"
                      : (user?.role === "admin" 
                          ? "Bạn chưa tạo dự án nào. Hãy tạo dự án đầu tiên!" 
                          : "Bạn chưa được phân công vào dự án nào.")
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {filteredProjects.map((project) => (
                    <Card 
                      key={project.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedProject === project.id 
                          ? "ring-2 ring-blue-500 bg-blue-50" 
                          : "hover:shadow-lg"
                      }`}
                      onClick={() => handleProjectSelect(project.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold line-clamp-2">
                            {project.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                            <Badge 
                              variant={project.status === "active" ? "default" : "secondary"}
                            >
                              {project.status === "active" ? "Hoạt động" : "Tạm dừng"}
                            </Badge>
                            {user?.role === "admin" && mode === "management" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProject(project);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {project.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-500">
                              <TestTube className="w-4 h-4 mr-1" />
                              <span>Test cases</span>
                            </div>
                            <span className="font-medium">{project.test_cases_count || 0}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-500">
                              <Users className="w-4 h-4 mr-1" />
                              <span>Testers</span>
                            </div>
                            <span className="font-medium">{project.testers_count || 0}</span>
                          </div>

                          {user?.role === "tester" && project.my_test_cases !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center text-blue-600">
                                <TestTube className="w-4 h-4 mr-1" />
                                <span>Của tôi</span>
                              </div>
                              <span className="font-medium text-blue-600">
                                {project.my_test_cases}
                              </span>
                            </div>
                          )}
                        </div>

                        {selectedProject === project.id && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center text-blue-600 text-sm font-medium">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                              Đã chọn
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-4 border-t flex-shrink-0">
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={!selectedProject}
                className="min-w-[100px]"
              >
                Xác nhận
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}