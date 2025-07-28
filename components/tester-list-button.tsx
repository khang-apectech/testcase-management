"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { TesterListModal } from "@/components/tester-list-modal";

export function TesterListButton() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Chỉ hiển thị cho admin
  if (user?.role !== "admin") {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("TesterListButton clicked - opening modal");
    setShowModal(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Users className="w-4 h-4 mr-2" />
        Danh sách Tester
      </Button>
      
      <TesterListModal
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  );
}