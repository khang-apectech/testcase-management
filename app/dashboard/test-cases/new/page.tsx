"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function NewTestCasePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { fetchWithAuth } = useAuth()
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      
      const response = await fetchWithAuth("/api/test-cases", {
        method: "POST",
        body: JSON.stringify({
          hang_muc: formData.get("hang_muc"),
          tinh_nang: formData.get("tinh_nang"),
          mo_ta: formData.get("mo_ta"),
          so_lan_phai_test: parseInt(formData.get("so_lan_phai_test") as string),
          priority: formData.get("priority"),
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Tạo test case thành công",
        })
        router.push(`/dashboard/test-cases/${data.testCase.id}`)
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể tạo test case",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create test case error:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tạo test case",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Tạo Test Case mới"
        text="Thêm test case mới vào hệ thống"
      >
        <Button variant="outline" onClick={() => router.push("/dashboard/test-cases")}>
          <Icons.back className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </DashboardHeader>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Test Case</CardTitle>
            <CardDescription>
              Nhập các thông tin chi tiết cho test case mới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hang_muc">Hạng mục</Label>
                <Input
                  id="hang_muc"
                  name="hang_muc"
                  placeholder="Nhập hạng mục test"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tinh_nang">Tính năng</Label>
                <Textarea
                  id="tinh_nang"
                  name="tinh_nang"
                  placeholder="Nhập mô tả chi tiết về tính năng cần test"
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mo_ta">Mô tả</Label>
                <Textarea
                  id="mo_ta"
                  name="mo_ta"
                  placeholder="Nhập mô tả chi tiết về test case"
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Độ ưu tiên</Label>
                <Select name="priority" defaultValue="trung bình" required>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Chọn độ ưu tiên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cao">Cao</SelectItem>
                    <SelectItem value="trung bình">Trung bình</SelectItem>
                    <SelectItem value="thấp">Thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="so_lan_phai_test">Số lần phải test</Label>
                <Input
                  id="so_lan_phai_test"
                  name="so_lan_phai_test"
                  type="number"
                  min="1"
                  placeholder="Nhập số lần cần test"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Tạo Test Case
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
} 