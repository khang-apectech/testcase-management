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
import type { TestCaseWithExecution } from "@/lib/db"
import { Play } from "lucide-react"

interface ExecutionDialogProps {
  testCase: TestCaseWithExecution
  onSuccess: () => void
}

export function ExecutionDialog({ testCase, onSuccess }: ExecutionDialogProps) {
  const [open, setOpen] = useState(false)
  const [so_lan_da_test, setSoLanDaTest] = useState(testCase.so_lan_da_test || 0)
  const [cam_nhan, setCamNhan] = useState(testCase.cam_nhan || "")
  const [loi, setLoi] = useState(testCase.loi || "")
  const [execution_date, setExecutionDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/test-executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testCaseId: testCase.id,
          so_lan_da_test,
          cam_nhan,
          loi,
          execution_date,
        }),
      })

      if (response.ok) {
        setOpen(false)
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to create execution:", error)
    } finally {
      setLoading(false)
    }
  }

  const progressPercentage =
    testCase.so_lan_phai_test > 0 ? Math.min(Math.round((so_lan_da_test / testCase.so_lan_phai_test) * 100), 100) : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="sm">
          <Play className="w-4 h-4 mr-2" />
          Cập nhật Test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cập nhật kết quả Test</DialogTitle>
          <DialogDescription>
            <div className="space-y-1">
              <div>
                <strong>Hạng mục:</strong> {testCase.hang_muc}
              </div>
              <div>
                <strong>Tính năng:</strong> {testCase.tinh_nang}
              </div>
              <div>
                <strong>Yêu cầu test:</strong> {testCase.so_lan_phai_test} lần
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="execution_date">Ngày Test</Label>
            <Input
              id="execution_date"
              type="date"
              value={execution_date}
              onChange={(e) => setExecutionDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="so_lan_da_test">Số lần đã test (Yêu cầu: {testCase.so_lan_phai_test} lần)</Label>
            <Input
              id="so_lan_da_test"
              type="number"
              min="0"
              max={testCase.so_lan_phai_test * 2} // Allow some flexibility
              value={so_lan_da_test}
              onChange={(e) => setSoLanDaTest(Number.parseInt(e.target.value))}
              required
            />
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    progressPercentage >= 100
                      ? "bg-green-500"
                      : progressPercentage >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{progressPercentage}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cam_nhan">Cảm nhận</Label>
            <Textarea
              id="cam_nhan"
              value={cam_nhan}
              onChange={(e) => setCamNhan(e.target.value)}
              placeholder="Cảm nhận về tính năng sau khi test..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loi">Lỗi (nếu có)</Label>
            <Textarea
              id="loi"
              value={loi}
              onChange={(e) => setLoi(e.target.value)}
              placeholder="Mô tả chi tiết lỗi phát hiện được..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu kết quả"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
