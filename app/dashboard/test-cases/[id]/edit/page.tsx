"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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

interface TestCase {
  id: string
  hang_muc: string
  tinh_nang: string
  mo_ta: string
  so_lan_phai_test: number
  priority: "cao" | "trung bình" | "thấp"
}

export default function EditTestCasePage() {
  const params = useParams()
  const router = useRouter()
  const { fetchWithAuth } = useAuth()
  const { toast } = useToast()
  const [testCase, setTestCase] = useState<TestCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTestCase()
  }, [])

  async function loadTestCase() {
    try {
      const response = await fetchWithAuth(`/api/test-cases/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setTestCase(data.testCase)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load test case",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load test case",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData(event.currentTarget)
      const response = await fetchWithAuth(`/api/test-cases/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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
          title: "Success",
          description: "Test case updated successfully",
        })
        router.push(`/dashboard/test-cases/${params.id}`)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update test case",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update test case",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!testCase) {
    return <div>Test case not found</div>
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Chỉnh sửa Test Case"
        text="Cập nhật thông tin test case"
      >
        <Button variant="outline" onClick={() => router.push(`/dashboard/test-cases/${params.id}`)}>
          <Icons.back className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </DashboardHeader>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Test Case</CardTitle>
            <CardDescription>
              Chỉnh sửa thông tin chi tiết của test case
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hang_muc">Hạng mục</Label>
                <Input
                  id="hang_muc"
                  name="hang_muc"
                  defaultValue={testCase.hang_muc}
                  placeholder="Nhập hạng mục test"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tinh_nang">Tính năng</Label>
                <Input
                  id="tinh_nang"
                  name="tinh_nang"
                  defaultValue={testCase.tinh_nang}
                  placeholder="Nhập tính năng cần test"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mo_ta">Mô tả</Label>
                <Textarea
                  id="mo_ta"
                  name="mo_ta"
                  defaultValue={testCase.mo_ta}
                  placeholder="Nhập mô tả chi tiết về test case"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="so_lan_phai_test">Số lần phải test</Label>
                  <Input
                    id="so_lan_phai_test"
                    name="so_lan_phai_test"
                    type="number"
                    min="1"
                    defaultValue={testCase.so_lan_phai_test}
                    placeholder="Nhập số lần cần test"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Độ ưu tiên</Label>
                  <Select name="priority" defaultValue={testCase.priority} required>
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
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
} 