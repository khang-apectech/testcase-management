"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface Project {
  id: string
  name: string
  description?: string
}

interface TestCaseDialogProps {
  onSuccess: () => void
}

export function TestCaseDialog({ onSuccess }: TestCaseDialogProps) {
  const { fetchWithAuth, selectedProject } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [hang_muc, setHangMuc] = useState("")
  const [tinh_nang, setTinhNang] = useState("")
  const [so_lan_phai_test, setSoLanPhaiTest] = useState(1)
  const [loading, setLoading] = useState(false)
  const [mo_ta, setMoTa] = useState("")
  const [priority, setPriority] = useState("trung bình")
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState("")
  const [loadingProjects, setLoadingProjects] = useState(false)

  useEffect(() => {
    if (open) {
      fetchProjects()
      
      // Use selected project from context or localStorage
      if (selectedProject?.id) {
        console.log("Using selected project from context:", selectedProject.id, selectedProject.name)
        setProjectId(selectedProject.id)
      } else {
        // Fallback to localStorage
        const storedProjectId = localStorage.getItem("selectedProjectId")
        if (storedProjectId) {
          console.log("Using selected project from localStorage:", storedProjectId)
          setProjectId(storedProjectId)
        }
      }
    }
  }, [open, selectedProject])

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true)
      const response = await fetchWithAuth("/api/projects")
      
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched projects:", data.projects)
        setProjects(data.projects)
        
        // If we have a selected project from context, make sure it exists in the projects list
        if (selectedProject?.id) {
          const projectExists = data.projects.some(p => p.id === selectedProject.id)
          if (projectExists) {
            console.log("Selected project exists in projects list:", selectedProject.id)
            setProjectId(selectedProject.id)
          } else {
            console.log("Selected project does not exist in projects list:", selectedProject.id)
            // If project doesn't exist, select the first one
            if (data.projects.length > 0) {
              setProjectId(data.projects[0].id)
            }
          }
        } 
        // If no project is selected from context, try localStorage
        else {
          const storedProjectId = localStorage.getItem("selectedProjectId")
          if (storedProjectId) {
            const projectExists = data.projects.some(p => p.id === storedProjectId)
            if (projectExists) {
              console.log("Project from localStorage exists in projects list:", storedProjectId)
              setProjectId(storedProjectId)
            } else if (data.projects.length > 0) {
              setProjectId(data.projects[0].id)
            }
          } else if (data.projects.length > 0) {
            // If no project is selected at all, select the first one
            setProjectId(data.projects[0].id)
          }
        }
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách dự án",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi tải dự án",
        variant: "destructive",
      })
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!projectId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn dự án",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      console.log("Creating test case for project:", projectId)
      
      const response = await fetchWithAuth("/api/test-cases", {
        method: "POST",
        body: JSON.stringify({ 
          hang_muc, 
          tinh_nang, 
          mo_ta, 
          so_lan_phai_test, 
          priority,
          project_id: projectId // Truyền project_id vào request body
        }),
      })

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã tạo test case mới",
        })
        setHangMuc("")
        setTinhNang("")
        setMoTa("")
        setPriority("trung bình")
        setSoLanPhaiTest(1)
        setOpen(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: "Lỗi",
          description: error.error || "Không thể tạo test case",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create test case:", error)
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi tạo test case",
        variant: "destructive",
      })
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
            <Label htmlFor="project_id">Dự án</Label>
            <select
              id="project_id"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              required
              className="w-full border rounded px-2 py-1"
              disabled={loadingProjects}
            >
              {loadingProjects ? (
                <option value="">Đang tải dự án...</option>
              ) : projects.length === 0 ? (
                <option value="">Không có dự án nào</option>
              ) : (
                projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              )}
            </select>
          </div>

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
