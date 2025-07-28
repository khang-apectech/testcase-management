"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Edit, 
  Trash2, 
  Shield, 
  UserCheck, 
  Calendar,
  Briefcase,
  TestTube,
  MoreVertical,
  Eye,
  UserX,
  UserPlus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface UserCardProps {
  tester: Tester;
  onEdit: (tester: Tester) => void;
  onDelete: (tester: Tester) => void;
  onToggleStatus: (tester: Tester) => void;
  onViewDetails?: (tester: Tester) => void;
}

export function UserCard({ 
  tester, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onViewDetails 
}: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getRoleIcon = () => {
    return tester.role === "admin" ? (
      <Shield className="w-4 h-4 text-red-500" />
    ) : (
      <UserCheck className="w-4 h-4 text-blue-500" />
    );
  };

  const getRoleBadge = () => {
    return (
      <Badge 
        variant={tester.role === "admin" ? "destructive" : "default"}
        className="text-xs"
      >
        {tester.role === "admin" ? "Admin" : "Tester"}
      </Badge>
    );
  };

  const getStatusBadge = () => {
    return (
      <Badge 
        variant={tester.status === "active" ? "default" : "secondary"}
        className={`cursor-pointer hover:opacity-80 text-xs ${
          tester.status === "active" 
            ? "bg-green-100 text-green-800 hover:bg-green-200" 
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleStatus(tester);
        }}
        title="Click để thay đổi trạng thái"
      >
        {tester.status === "active" ? "Hoạt động" : "Tạm dừng"}
      </Badge>
    );
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
        isHovered ? "shadow-md border-blue-200" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails?.(tester)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="w-12 h-12 border-2 border-gray-100">
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                {tester.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {tester.name}
                </h3>
                {getRoleIcon()}
              </div>
              <p className="text-sm text-gray-600 truncate">{tester.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onViewDetails && (
                  <>
                    <DropdownMenuItem onClick={() => onViewDetails(tester)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => onEdit(tester)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onToggleStatus(tester)}
                  className={tester.status === "active" ? "text-orange-600" : "text-green-600"}
                >
                  {tester.status === "active" ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Tạm dừng
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Kích hoạt
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(tester)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa tester
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Role Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Vai trò:</span>
            {getRoleBadge()}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Dự án</p>
                <p className="font-semibold text-blue-600">{tester.projects_count}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TestTube className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Test Cases</p>
                <p className="font-semibold text-green-600">{tester.test_cases_assigned}</p>
              </div>
            </div>
          </div>
          
          {/* Created Date */}
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              Tham gia: {new Date(tester.created_at).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}