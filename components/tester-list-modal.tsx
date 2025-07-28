"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, Trash2, UserPlus, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface TesterListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TesterListModal({ open, onOpenChange }: TesterListModalProps) {
  const { fetchWithAuth } = useAuth();
  const { toast } = useToast();
  const [testers, setTesters] = useState<Tester[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
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
  
  const itemsPerPage = 8; // Reduced for modal view

  // Fetch testers when modal opens
  useEffect(() => {
    if (open) {
      fetchTesters();
    }
  }, [open]);

  const fetchTesters = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/admin/testers");
      if (response.ok) {
        const data = await response.json();
        setTesters(data);
      }
    } catch (error) {
      console.error("Error fetching testers:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách tester",
        variant: "destructive"
      });
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold">Quản lý Tester</span>
                <p className="text-sm text-gray-600 mt-1">Quản lý tất cả tester trong hệ thống</p>
              </div>
              <Button 
                onClick={() => setShowCreateDialog(true)} 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Thêm Tester
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 flex-shrink-0">
              <Card>
                <CardContent className="p-3">
                  <div className="text-xl font-bold">{testers.length}</div>
                  <p className="text-xs text-muted-foreground">Tổng số tester</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xl font-bold">{testers.filter(t => t.status === 'active').length}</div>
                  <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xl font-bold">{filteredTesters.length}</div>
                  <p className="text-xs text-muted-foreground">Kết quả lọc</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-shrink-0">
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Testers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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

                  {filteredTesters.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Không tìm thấy tester nào</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between flex-shrink-0 pt-2 border-t">
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
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else {
                        const start = Math.max(1, currentPage - 2);
                        const end = Math.min(totalPages, start + 4);
                        page = start + i;
                        if (page > end) return null;
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
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
          </div>
        </DialogContent>
      </Dialog>

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
            <div>
              <Label htmlFor="edit-name">Tên</Label>
              <Input
                id="edit-name"
                value={editTester.name}
                onChange={(e) => setEditTester({...editTester, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editTester.email}
                onChange={(e) => setEditTester({...editTester, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Vai trò</Label>
              <Select value={editTester.role} onValueChange={(value: "admin" | "tester") => setEditTester({...editTester, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tester">Tester</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Trạng thái</Label>
              <Select value={editTester.status} onValueChange={(value: "active" | "inactive") => setEditTester({...editTester, status: value})}>
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
              {editLoading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tester "{selectedTester?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tester Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết Tester</DialogTitle>
          </DialogHeader>
          {selectedTesterDetails && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedTesterDetails.name}`} />
                  <AvatarFallback>{selectedTesterDetails.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedTesterDetails.name}</h3>
                  <p className="text-gray-600">{selectedTesterDetails.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={selectedTesterDetails.role === 'admin' ? 'destructive' : 'default'}>
                      {selectedTesterDetails.role}
                    </Badge>
                    <Badge variant={selectedTesterDetails.status === 'active' ? 'default' : 'secondary'}>
                      {selectedTesterDetails.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Số dự án tham gia</Label>
                  <p className="text-2xl font-bold">{selectedTesterDetails.projects_count}</p>
                </div>
                <div>
                  <Label>Test cases được giao</Label>
                  <p className="text-2xl font-bold">{selectedTesterDetails.test_cases_assigned}</p>
                </div>
              </div>
              <div>
                <Label>Ngày tạo</Label>
                <p>{new Date(selectedTesterDetails.created_at).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}