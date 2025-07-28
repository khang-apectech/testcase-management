"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, UserPlus, Filter, ChevronLeft, ChevronRight, AlertTriangle, Briefcase, TestTube, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { UserCard } from "@/components/users/user-card";
import { AddTesterDialog } from "@/components/users/add-tester-dialog";

interface Tester {
  id: string;
  name: string;
  email: string;
  role: "tester" | "admin";
  status: "active" | "inactive";
  projects_count: number;
  test_cases_assigned: number;
  created_at: string;
}

export default function AdminTestersPage() {
  const { fetchWithAuth } = useAuth();
  const { toast } = useToast();
  const [testers, setTesters] = useState<Tester[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTester, setSelectedTester] = useState<Tester | null>(null);
  const [editTester, setEditTester] = useState({
    name: "",
    email: "",
    role: "tester",
    status: "active"
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTesterDetails, setSelectedTesterDetails] = useState<Tester | null>(null);
  
  const itemsPerPage = 12;

  useEffect(() => {
    fetchTesters();
  }, []);

  const fetchTesters = async () => {
    try {
      const response = await fetchWithAuth("/api/admin/testers");
      if (response.ok) {
        const data = await response.json();
        setTesters(data);
      }
    } catch (error) {
      console.error("Error fetching testers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchTesters();
  };

  const handleEditTester = (tester: Tester) => {
    setSelectedTester(tester);
    setEditTester({
      name: tester.name,
      email: tester.email,
      role: tester.role,
      status: tester.status
    });
    setShowEditDialog(true);
  };

  const handleUpdateTester = async () => {
    if (!selectedTester || !editTester.name || !editTester.email) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive"
      });
      return;
    }

    try {
      setEditLoading(true);
      const response = await fetchWithAuth(`/api/admin/testers/${selectedTester.id}`, {
        method: "PUT",
        body: JSON.stringify(editTester)
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật thông tin tester"
        });
        setShowEditDialog(false);
        setSelectedTester(null);
        fetchTesters();
      } else {
        const error = await response.json();
        toast({
          title: "Lỗi",
          description: error.error || "Không thể cập nhật tester",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi cập nhật tester",
        variant: "destructive"
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTester = (tester: Tester) => {
    setSelectedTester(tester);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTester) return;

    try {
      setDeleteLoading(true);
      const response = await fetchWithAuth(`/api/admin/testers/${selectedTester.id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã xóa tester"
        });
        setShowDeleteDialog(false);
        setSelectedTester(null);
        fetchTesters();
      } else {
        const error = await response.json();
        toast({
          title: "Lỗi",
          description: error.error || "Không thể xóa tester",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi xóa tester",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (tester: Tester) => {
    const newStatus = tester.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetchWithAuth(`/api/admin/testers/${tester.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: `Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} tester`
        });
        fetchTesters();
      } else {
        const error = await response.json();
        toast({
          title: "Lỗi",
          description: error.error || "Không thể thay đổi trạng thái",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi thay đổi trạng thái",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (tester: Tester) => {
    setSelectedTesterDetails(tester);
    setShowDetailsDialog(true);
  };

  const filteredTesters = testers.filter(tester => {
    const matchesSearch = tester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tester.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || tester.role === roleFilter;
    const matchesStatus = statusFilter === "all" || tester.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTesters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTesters = filteredTesters.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Tester</h1>
          <p className="text-gray-600 mt-1">Quản lý tất cả tester trong hệ thống</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>Tổng: <strong className="text-gray-900">{testers.length}</strong></span>
            <span>•</span>
            <span>Hoạt động: <strong className="text-green-600">{testers.filter(t => t.status === 'active').length}</strong></span>
            <span>•</span>
            <span>Admin: <strong className="text-red-600">{testers.filter(t => t.role === 'admin').length}</strong></span>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Thêm Tester
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm kiếm tester..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={(value) => {
          setRoleFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="tester">Tester</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Không hoạt động</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{testers.length}</div>
            <p className="text-sm text-muted-foreground">Tổng số tester</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{testers.filter(t => t.status === 'active').length}</div>
            <p className="text-sm text-muted-foreground">Đang hoạt động</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredTesters.length}</div>
            <p className="text-sm text-muted-foreground">Kết quả lọc</p>
          </CardContent>
        </Card>
      </div>

      {/* Testers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedTesters.map((tester) => (
          <UserCard
            key={tester.id}
            tester={tester}
            onEdit={handleEditTester}
            onDelete={handleDeleteTester}
            onToggleStatus={handleToggleStatus}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {filteredTesters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy tester nào</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTesters.length)} trong {filteredTesters.length} kết quả
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

      {/* Add Tester Dialog */}
      <AddTesterDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Tester Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Tester</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Họ tên</Label>
              <Input
                id="edit-name"
                value={editTester.name}
                onChange={(e) => setEditTester({...editTester, name: e.target.value})}
                placeholder="Nhập họ tên"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editTester.email}
                onChange={(e) => setEditTester({...editTester, email: e.target.value})}
                placeholder="Nhập email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-role">Vai trò</Label>
              <Select value={editTester.role} onValueChange={(value) => setEditTester({...editTester, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tester">Tester</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Trạng thái</Label>
              <Select value={editTester.status} onValueChange={(value) => setEditTester({...editTester, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateTester} disabled={editLoading}>
              {editLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Xác nhận xóa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tester <strong>{selectedTester?.name}</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">
                Lưu ý: Hành động này không thể hoàn tác. Tester sẽ bị xóa khỏi tất cả các dự án.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tester Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {selectedTesterDetails?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              Chi tiết Tester
            </DialogTitle>
          </DialogHeader>
          
          {selectedTesterDetails && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Họ tên</label>
                  <p className="text-lg font-semibold">{selectedTesterDetails.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedTesterDetails.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vai trò</label>
                    <div className="mt-1">
                      <Badge variant={selectedTesterDetails.role === "admin" ? "destructive" : "default"}>
                        {selectedTesterDetails.role === "admin" ? "Admin" : "Tester"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedTesterDetails.status === "active" ? "default" : "secondary"}
                        className={selectedTesterDetails.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-600"
                        }
                      >
                        {selectedTesterDetails.status === "active" ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Thống kê</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600">Dự án tham gia</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {selectedTesterDetails.projects_count}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TestTube className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600">Test Cases</p>
                        <p className="text-2xl font-bold text-green-700">
                          {selectedTesterDetails.test_cases_assigned}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Thông tin thời gian</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Tham gia:</span>
                    <span className="font-medium">
                      {new Date(selectedTesterDetails.created_at).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Đóng
            </Button>
            {selectedTesterDetails && (
              <Button onClick={() => {
                setShowDetailsDialog(false);
                handleEditTester(selectedTesterDetails);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}