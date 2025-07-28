"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { TestApiCalls } from "@/components/test-api-calls";
import { TestProjectAssignment } from "@/components/test-project-assignment";

export default function AdminDebugPage() {
  const { fetchWithAuth, user } = useAuth();
  const { toast } = useToast();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/debug/test-assignments");
      if (response.ok) {
        const data = await response.json();
        setDebugData(data);
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu debug",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi tải dữ liệu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    try {
      const response = await fetchWithAuth("/api/admin/migrate", {
        method: "POST"
      });
      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Migration đã chạy thành công"
        });
      } else {
        toast({
          title: "Lỗi",
          description: "Migration thất bại",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi chạy migration",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDebugData();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return <div>Chỉ admin mới có thể truy cập trang này</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Debug & Test</h1>
          <p className="text-gray-600">Kiểm tra và debug hệ thống</p>
        </div>
        <div className="space-x-2">
          <Button onClick={runMigration} variant="outline">
            Chạy Migration
          </Button>
          <Button onClick={fetchDebugData} disabled={loading}>
            {loading ? "Đang tải..." : "Tải lại dữ liệu"}
          </Button>
          <Button 
            onClick={() => {
              const a = document.createElement("a");
              a.href = "/api/export/apec-space";
              a.download = `APEC-SPACE-test-results-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              toast({
                title: "Thành công",
                description: "Đang tải xuống kết quả test APEC SPACE"
              });
            }} 
            variant="secondary"
          >
            Xuất APEC SPACE (CSV)
          </Button>
        </div>
      </div>

      {debugData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{debugData.summary.totalUsers}</div>
                <p className="text-sm text-muted-foreground">Tổng Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{debugData.summary.totalProjects}</div>
                <p className="text-sm text-muted-foreground">Tổng Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{debugData.summary.totalProjectAssignments}</div>
                <p className="text-sm text-muted-foreground">Project Assignments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{debugData.summary.totalTestCaseAssignments}</div>
                <p className="text-sm text-muted-foreground">TestCase Assignments</p>
              </CardContent>
            </Card>
          </div>

          {/* API Test Component */}
          <TestApiCalls />

          {/* Project Assignment Test */}
          <TestProjectAssignment />

          {/* Detailed Data Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="project-assignments">Project Assignments</TabsTrigger>
              <TabsTrigger value="testcase-assignments">TestCase Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {debugData.users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                            {user.role}
                          </Badge>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {debugData.projects.map((project: any) => (
                      <div key={project.id} className="p-2 border rounded">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-gray-600">{project.description}</div>
                        <div className="text-xs text-gray-400">
                          ID: {project.id}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="project-assignments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {debugData.projectAssignments.map((assignment: any) => (
                      <div key={assignment.id} className="p-2 border rounded">
                        <div className="font-medium">{assignment.user_name}</div>
                        <div className="text-sm text-gray-600">{assignment.user_email}</div>
                        <div className="text-sm font-medium text-blue-600">{assignment.project_name}</div>
                        <div className="text-xs text-gray-400">
                          Phân công: {new Date(assignment.granted_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testcase-assignments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>TestCase Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {debugData.testCaseAssignments.map((assignment: any) => (
                      <div key={assignment.id} className="p-2 border rounded">
                        <div className="font-medium">{assignment.user_name}</div>
                        <div className="text-sm text-gray-600">{assignment.user_email}</div>
                        <div className="text-sm font-medium text-green-600">
                          {assignment.hang_muc} - {assignment.tinh_nang}
                        </div>
                        <div className="text-sm text-blue-600">{assignment.project_name}</div>
                        <div className="text-xs text-gray-400">
                          Phân công: {new Date(assignment.assigned_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}