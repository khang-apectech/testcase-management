"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, login } = useAuth()

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      const from = searchParams.get("from") || "/"
      console.log("🔄 Login redirect to:", from);
      router.push(from)
    }
  }, [user, router, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      // Redirect to original destination or home (will trigger project selection)
      const from = searchParams.get("from") || "/"
      console.log("🚀 Login success, redirect to:", from);
      router.push(from)
      toast({
        title: "Thành công",
        description: "Đăng nhập thành công!",
      })

    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Đăng nhập thất bại",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] px-4">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Đăng nhập
          </h1>
          <p className="text-sm text-muted-foreground">
            Nhập thông tin đăng nhập để tiếp tục
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="email"
              placeholder="Nhập email của bạn"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              id="password"
              placeholder="Mật khẩu của bạn"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </div>
    </div>
  )
}
