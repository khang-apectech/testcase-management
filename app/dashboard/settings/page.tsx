"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Cài đặt"
        text="Quản lý cài đặt hệ thống và tùy chọn cá nhân"
      />

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Cài đặt chung</h3>
          <p className="text-sm text-muted-foreground">
            Cấu hình các tùy chọn chung của hệ thống
          </p>
        </div>
        <Separator />
        <div className="grid gap-6">
          {/* Thông báo */}
          <Card>
            <CardHeader>
              <CardTitle>Thông báo</CardTitle>
              <CardDescription>
                Cấu hình cách bạn nhận thông báo từ hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-notifications">Thông báo qua email</Label>
                <Switch id="email-notifications" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="browser-notifications">Thông báo trên trình duyệt</Label>
                <Switch id="browser-notifications" />
              </div>
            </CardContent>
          </Card>

          {/* Hiển thị */}
          <Card>
            <CardHeader>
              <CardTitle>Hiển thị</CardTitle>
              <CardDescription>
                Tùy chỉnh giao diện người dùng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Ngôn ngữ</Label>
                <Select defaultValue="vi">
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Chọn ngôn ngữ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Múi giờ</Label>
                <Select defaultValue="asia-ho_chi_minh">
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Chọn múi giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia-ho_chi_minh">
                      Asia/Ho_Chi_Minh (GMT+7)
                    </SelectItem>
                    <SelectItem value="asia-bangkok">
                      Asia/Bangkok (GMT+7)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bảo mật */}
          <Card>
            <CardHeader>
              <CardTitle>Bảo mật</CardTitle>
              <CardDescription>
                Cập nhật cài đặt bảo mật tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Mật khẩu mới</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Cập nhật mật khẩu</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
} 