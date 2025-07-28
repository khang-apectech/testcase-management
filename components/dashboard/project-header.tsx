"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ProjectHeader() {
  const { selectedProject, setSelectedProject, fetchWithAuth } = useAuth()
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleOpenProjectMenu = async () => {
    if (loading || projects.length > 0) return
    
    try {
      setLoading(true)
      const response = await fetchWithAuth("/api/projects")
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects.map((p: any) => ({ id: p.id, name: p.name })))
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = (projectId: string, projectName: string) => {
    // Store the selected project in localStorage
    localStorage.setItem("selectedProjectId", projectId)
    localStorage.setItem("selectedProjectName", projectName)
    
    // Update context
    setSelectedProject({ id: projectId, name: projectName })
    
    // Redirect to project-specific page
    router.push(`/project/${projectId}`)
  }

  if (!selectedProject) return null

  return (
    <div className="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-md">
      <span className="text-sm font-medium">Dự án hiện tại:</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleOpenProjectMenu}>
            {selectedProject.name}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {loading ? (
            <DropdownMenuItem disabled>Đang tải...</DropdownMenuItem>
          ) : (
            projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => handleSelectProject(project.id, project.name)}
              >
                {project.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}