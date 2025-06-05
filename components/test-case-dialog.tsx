"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface TestCaseDialogProps {
  onSuccess: () => void
}

export function TestCaseDialog({ onSuccess }: TestCaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [hang_muc, setHangMuc] = useState("")
  const [tinh_nang, setTinhNang] = useState("")
  const [so_lan_phai_test, setSoLanPhaiTest] = useState(1)
  const [loading, setLoading] = useState(false)
  const [mo_ta, setMoTa] = useState("")
  const [priority, setPriority] = useState("trung bình")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hang_muc, tinh_nang, mo_ta, so_lan_phai_test, priority }),
      })

      if (response.ok) {
        setHangMuc("")
        setTinhNang("")
        setMoTa("")
        setPriority("trung bình")
        setSoLanPhaiTest(1)
        setOpen(false)
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to create test case:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Test Case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo Test Case mới</DialogTitle>
          <DialogDescription>Thêm một test case mới vào hệ thống</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hang_muc">Hạng mục</Label>
            <Input
              id="hang_muc"
              value={hang_muc}
              onChange={(e) => setHangMuc(e.target.value)}
              required
              placeholder="VD: Đăng nhập, Dashboard, Thanh toán..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tinh_nang">Tính năng</Label>
            <Textarea
              id="tinh_nang"
              value={tinh_nang}
              onChange={(e) => setTinhNang(e.target.value)}
              required
              placeholder="Mô tả chi tiết tính năng cần test"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mo_ta">Mô tả</Label>
            <Textarea
              id="mo_ta"
              value={mo_ta}
              onChange={(e) => setMoTa(e.target.value)}
              required
              placeholder="Mô tả chi tiết về test case"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Độ ưu tiên</Label>
            <select
              id="priority"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              required
              className="w-full border rounded px-2 py-1"
            >
              <option value="cao">Cao</option>
              <option value="trung bình">Trung bình</option>
              <option value="thấp">Thấp</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="so_lan_phai_test">Số lần phải test</Label>
            <Input
              id="so_lan_phai_test"
              type="number"
              min="1"
              max="10"
              value={so_lan_phai_test}
              onChange={(e) => setSoLanPhaiTest(Number.parseInt(e.target.value))}
              required
            />
            <p className="text-xs text-gray-500">Admin quy định số lần tester phải test tính năng này</p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo Test Case"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
