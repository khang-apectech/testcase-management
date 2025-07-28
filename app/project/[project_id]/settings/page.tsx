import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, Trash2, Users, Calendar } from 'lucide-react'

interface ProjectSettingsPageProps {
  params: { project_id: string }
}

async function getProjectDetails(projectId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/projects/${projectId}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching project:', error)
    return null
  }
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { project_id } = await params
  const project = await getProjectDetails(project_id)

  if (!project) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt Dự án</h1>
        <p className="text-muted-foreground">
          Quản lý cấu hình và cài đặt dự án
        </p>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Thông tin cơ bản
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin cơ bản của dự án
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-name">Tên dự án</Label>
                <Input
                  id="project-name"
                  defaultValue={project.name}
                  placeholder="Nhập tên dự án"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status">Trạng thái</Label>
                <Badge variant="outline">
                  {project.status === 'active' ? 'Hoạt động' : project.status || 'Hoạt động'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Mô tả</Label>
              <Textarea
                id="project-description"
                defaultValue={project.description}
                placeholder="Nhập mô tả dự án"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Project Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>
              Current project statistics and information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {project.updated_at 
                      ? new Date(project.updated_at).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Project ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {project.id}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
            <CardDescription>
              Manage project team members and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Team Members</p>
                  <p className="text-sm text-muted-foreground">
                    Add or remove team members from this project
                  </p>
                </div>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Team
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Project Roles</p>
                  <p className="text-sm text-muted-foreground">
                    Configure role-based permissions
                  </p>
                </div>
                <Button variant="outline">
                  Configure Roles
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-red-600">Delete Project</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this project and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}