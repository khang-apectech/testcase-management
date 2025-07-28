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
import { Folder, Users, TestTube } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  test_cases_count: number;
  testers_count: number;
  my_test_cases: number;
}

interface ProjectSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectSelected?: (projectId: string) => void;
  userRole: "admin" | "tester";
}

export function ProjectSelectionModal({ 
  isOpen, 
  onClose, 
  onProjectSelected,
  userRole 
}: ProjectSelectionModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      // Kiểm tra localStorage có sẵn không (client-side)
      if (typeof window === "undefined") {
        setProjects([]);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No auth token found");
        setProjects([]);
        return;
      }

      const endpoint = userRole === "admin" 
        ? "/api/admin/projects" 
        : "/api/tester/assigned-projects";
      
      const response = await fetch(endpoint, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        console.error("Failed to fetch projects:", response.status, response.statusText);
        setProjects([]);
        return;
      }

      const data = await response.json();
      
      // Kiểm tra data có phải là array không
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        console.error("Invalid data format:", data);
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
      // Tìm project object từ ID
      const projectObj = projects.find(p => p.id === selectedProject);
      
      if (projectObj) {
        console.log("🎯 Starting project selection process...");
        console.log("📝 Selected project:", projectObj);
        
        // Lưu vào localStorage theo format của auth-context
        localStorage.setItem("selectedProjectId", projectObj.id);
        localStorage.setItem("selectedProjectName", projectObj.name);
        
        console.log("💾 Saved to localStorage:", {
          selectedProjectId: projectObj.id,
          selectedProjectName: projectObj.name
        });
        
        // Close modal first
        onClose();
        
        // Call callback if provided
        if (onProjectSelected) {
          console.log("📞 Calling onProjectSelected callback");
          onProjectSelected(selectedProject);
        }
        
        // Small delay to ensure modal is closed before navigation
        setTimeout(() => {
          const redirectPath = `/project/${selectedProject}/dashboard`;
          console.log("🚀 Navigating to:", redirectPath);
          router.push(redirectPath);
        }, 100);
      } else {
        console.error("❌ Project object not found for ID:", selectedProject);
        onClose();
      }
    } else {
      console.error("❌ No project selected");
      onClose();
    }
  };

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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Chọn Dự án</DialogTitle>
          <DialogDescription>
            {userRole === "admin" 
              ? "Chọn dự án bạn muốn quản lý" 
              : "Chọn dự án bạn được phân công để bắt đầu làm việc"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Không có dự án nào
              </h3>
              <p className="text-gray-600">
                {userRole === "admin" 
                  ? "Bạn chưa tạo dự án nào. Hãy tạo dự án đầu tiên!" 
                  : "Bạn chưa được phân công vào dự án nào. Liên hệ admin để được phân công."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
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
                      <Badge 
                        variant={project.status === "active" ? "default" : "secondary"}
                        className="ml-2 flex-shrink-0"
                      >
                        {project.status === "active" ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
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
                        <span className="font-medium">{project.test_cases_count}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Users className="w-4 h-4 mr-1" />
                          <span>Testers</span>
                        </div>
                        <span className="font-medium">{project.testers_count}</span>
                      </div>

                      {userRole === "tester" && (
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

        <div className="flex justify-end space-x-3 pt-4 border-t">
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
      </DialogContent>
    </Dialog>
  );
}