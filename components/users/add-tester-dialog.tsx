"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface AddTesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddTesterDialog({ open, onOpenChange, onSuccess }: AddTesterDialogProps) {
  const { fetchWithAuth } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newTester, setNewTester] = useState({
    name: "",
    email: "",
    password: "",
    role: "tester"
  });

  const handleCreateTester = async () => {
    if (!newTester.name || !newTester.email || !newTester.password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetchWithAuth("/api/admin/testers", {
        method: "POST",
        body: JSON.stringify(newTester)
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã tạo tester mới thành công"
        });
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      } else {
        const error = await response.json();
        toast({
          title: "Lỗi",
          description: error.error || "Không thể tạo tester",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi tạo tester",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewTester({ name: "", email: "", password: "", role: "tester" });
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Thêm Tester Mới
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Họ tên *</Label>
            <Input
              id="name"
              value={newTester.name}
              onChange={(e) => setNewTester({...newTester, name: e.target.value})}
              placeholder="Nhập họ tên đầy đủ"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={newTester.email}
              onChange={(e) => setNewTester({...newTester, email: e.target.value})}
              placeholder="Nhập địa chỉ email"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu *</Label>
            <Input
              id="password"
              type="password"
              value={newTester.password}
              onChange={(e) => setNewTester({...newTester, password: e.target.value})}
              placeholder="Nhập mật khẩu"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Vai trò</Label>
            <Select 
              value={newTester.role} 
              onValueChange={(value) => setNewTester({...newTester, role: value})}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tester">Tester</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
            <strong>Lưu ý:</strong> Tester mới sẽ được tạo cho toàn hệ thống và có thể được assign vào bất kỳ dự án nào.
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleCreateTester} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang tạo...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Tạo Tester
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}