"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";

export function TestProjectAssignment() {
  const { fetchWithAuth } = useAuth();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [testers, setTesters] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTesters, setSelectedTesters] = useState<string[]>([]);
  const [currentAssignments, setCurrentAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTesters();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchCurrentAssignments();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await fetchWithAuth('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTesters = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/testers');
      if (response.ok) {
        const data = await response.json();
        setTesters(data.filter((t: any) => t.role === 'tester' && t.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching testers:', error);
    }
  };

  const fetchCurrentAssignments = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await fetchWithAuth(`/api/projects/${selectedProject}/testers`);
      if (response.ok) {
        const data = await response.json();
        setCurrentAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching current assignments:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedProject || selectedTesters.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn project và ít nhất một tester",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Assigning testers:', selectedTesters, 'to project:', selectedProject);
      
      const response = await fetchWithAuth(`/api/projects/${selectedProject}/testers`, {
        method: 'POST',
        body: JSON.stringify({ testerIds: selectedTesters })
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã phân công tester thành công"
        });
        setSelectedTesters([]);
        fetchCurrentAssignments();
      } else {
        toast({
          title: "Lỗi",
          description: responseData.error || "Không thể phân công tester",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Assign error:', error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi phân công tester",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (testerId: string) => {
    if (!selectedProject) return;

    try {
      console.log('Removing tester:', testerId, 'from project:', selectedProject);
      
      const response = await fetchWithAuth(`/api/projects/${selectedProject}/testers`, {
        method: 'DELETE',
        body: JSON.stringify({ testerIds: [testerId] })
      });

      const responseData = await response.json();
      console.log('Remove response:', responseData);

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã xóa tester khỏi dự án"
        });
        fetchCurrentAssignments();
      } else {
        toast({
          title: "Lỗi",
          description: responseData.error || "Không thể xóa tester",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi xóa tester",
        variant: "destructive"
      });
    }
  };

  // Get available testers (not already assigned)
  const availableTesters = testers.filter(tester => 
    !currentAssignments.some(assigned => assigned.id === tester.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Project Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Chọn Project:</label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Assignments */}
        {selectedProject && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Testers hiện tại ({currentAssignments.length}):</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {currentAssignments.map((tester) => (
                <div key={tester.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{tester.name}</div>
                    <div className="text-sm text-gray-600">{tester.email}</div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleRemove(tester.id)}
                  >
                    Xóa
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Testers */}
        {selectedProject && availableTesters.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Testers có thể thêm ({availableTesters.length}):</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableTesters.map((tester) => (
                <div key={tester.id} className="flex items-center space-x-3 p-2 border rounded">
                  <Checkbox
                    checked={selectedTesters.includes(tester.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTesters([...selectedTesters, tester.id]);
                      } else {
                        setSelectedTesters(selectedTesters.filter(id => id !== tester.id));
                      }
                    }}
                  />
                  <div>
                    <div className="font-medium">{tester.name}</div>
                    <div className="text-sm text-gray-600">{tester.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign Button */}
        {selectedProject && selectedTesters.length > 0 && (
          <Button onClick={handleAssign} disabled={loading} className="w-full">
            {loading ? "Đang phân công..." : `Phân công ${selectedTesters.length} tester(s)`}
          </Button>
        )}

        {/* Debug Info */}
        <div className="space-y-2 text-xs bg-gray-100 p-2 rounded">
          <div>Projects: {projects.length}</div>
          <div>All Testers: {testers.length}</div>
          <div>Selected Project: {selectedProject}</div>
          <div>Current Assignments: {currentAssignments.length}</div>
          <div>Available Testers: {availableTesters.length}</div>
          <div>Selected Testers: {selectedTesters.length}</div>
        </div>
      </CardContent>
    </Card>
  );
}