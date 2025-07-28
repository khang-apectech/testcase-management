"use client";

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { ProjectHeader } from '@/components/project-header'
import { ProjectNavTabs } from '@/components/project-nav-tabs'
import { ProjectSelector } from '@/components/project-selector'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { TesterListButton } from '@/components/tester-list-button'
import { UserNav } from '@/components/dashboard/user-nav'

interface Project {
  id: string
  name: string
  description: string
  status: string
}

interface ProjectLayoutProps {
  children: React.ReactNode
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams()
  const router = useRouter()
  const { selectedProject, setSelectedProject } = useAuth()
  const project_id = params.project_id as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (project_id) {
      fetchProject()
    }
  }, [project_id])

  // Update selectedProject when current project loads (sync with URL)
  useEffect(() => {
    if (project && project.id) {
      // Only update if different from current selectedProject
      if (!selectedProject || selectedProject.id !== project.id) {
        console.log('Syncing selectedProject with current project:', project)
        setSelectedProject({
          id: project.id,
          name: project.name
        })
      }
    }
  }, [project, selectedProject, setSelectedProject])

  // Handle project selector changes - redirect to new project
  useEffect(() => {
    if (selectedProject && selectedProject.id && project && project.id && selectedProject.id !== project.id) {
      const currentPath = window.location.pathname
      const pathParts = currentPath.split('/')
      // Replace project_id in the path
      if (pathParts.length >= 3 && pathParts[1] === 'project') {
        pathParts[2] = selectedProject.id
        const newPath = pathParts.join('/')
        console.log('Project selector changed, redirecting from', currentPath, 'to', newPath)
        router.push(newPath)
      }
    }
  }, [selectedProject?.id, project?.id, router]) // Add missing dependencies

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${project_id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        console.error('Project not found')
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      // Fallback với mock data
      setProject({
        id: project_id,
        name: `Project ${project_id.slice(0, 8)}`,
        description: 'Project description',
        status: 'active'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <Button onClick={() => router.push('/')}>
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="text-gray-600 hover:text-gray-900 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
                  <p className="text-sm text-gray-600 truncate">{project.description}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-4">
                <ProjectSelector />
                <div className="flex items-center space-x-2">
                  <TesterListButton />
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <a href={`/project/${project.id}/settings`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </a>
                  </Button>
                  <UserNav />
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <ProjectNavTabs projectId={project_id} />
          </div>
        </div>

        {/* Main Content */}
        <main className="px-4 lg:px-6 py-6 max-w-full overflow-x-hidden">
          <Suspense 
            fallback={
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </AuthGuard>
  )
}