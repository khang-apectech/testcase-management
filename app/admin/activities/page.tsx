"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ChevronLeft, ChevronRight, Activity, Plus, CheckCircle, Users, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface ActivityItem {
  id: string;
  type: "test_case_created" | "test_case_executed" | "tester_assigned" | "project_created";
  description: string;
  user_name: string;
  project_name: string;
  timestamp: string;
  details?: any;
}

export default function AdminActivitiesPage() {
  const { fetchWithAuth } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetchWithAuth("/api/admin/activities");
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || activity.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const activityDate = new Date(activity.timestamp);
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          matchesDate = activityDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = activityDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = activityDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "test_case_created":
        return <Plus className="w-4 h-4 text-blue-600" />;
      case "test_case_executed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "tester_assigned":
        return <Users className="w-4 h-4 text-purple-600" />;
      case "project_created":
        return <Activity className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "test_case_created":
        return "bg-blue-100 text-blue-800";
      case "test_case_executed":
        return "bg-green-100 text-green-800";
      case "tester_assigned":
        return "bg-purple-100 text-purple-800";
      case "project_created":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "test_case_created":
        return "Test Case Tạo mới";
      case "test_case_executed":
        return "Test Case Thực thi";
      case "tester_assigned":
        return "Phân công Tester";
      case "project_created":
        return "Dự án Tạo mới";
      default:
        return "Hoạt động khác";
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lịch sử Hoạt động</h1>
          <p className="text-gray-600">Theo dõi tất cả hoạt động trong hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm kiếm hoạt động..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={(value) => {
          setTypeFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Loại hoạt động" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="test_case_created">Test Case Tạo mới</SelectItem>
            <SelectItem value="test_case_executed">Test Case Thực thi</SelectItem>
            <SelectItem value="tester_assigned">Phân công Tester</SelectItem>
            <SelectItem value="project_created">Dự án Tạo mới</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={(value) => {
          setDateFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Thời gian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="today">Hôm nay</SelectItem>
            <SelectItem value="week">7 ngày qua</SelectItem>
            <SelectItem value="month">30 ngày qua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-sm text-muted-foreground">Tổng hoạt động</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{activities.filter(a => a.type === 'test_case_executed').length}</div>
            <p className="text-sm text-muted-foreground">Test thực thi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{activities.filter(a => a.type === 'test_case_created').length}</div>
            <p className="text-sm text-muted-foreground">Test case tạo mới</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredActivities.length}</div>
            <p className="text-sm text-muted-foreground">Kết quả lọc</p>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy hoạt động nào
              </div>
            ) : (
              paginatedActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getActivityBadgeColor(activity.type)}>
                        {getActivityTypeLabel(activity.type)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {activity.project_name}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {activity.user_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(activity.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredActivities.length)} trong {filteredActivities.length} hoạt động
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      </div>
                    ))
                  }
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}