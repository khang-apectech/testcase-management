"use client";

import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function TesterListButton() {
  const { user } = useAuth();
  const router = useRouter();

  // Chỉ hiển thị cho admin
  if (user?.role !== "admin") {
    return null;
  }

  const handleClick = () => {
    router.push("/admin/testers");
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      <Users className="w-4 h-4 mr-2" />
      Danh sách Tester
    </Button>
  );
}