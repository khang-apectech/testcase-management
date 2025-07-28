"use client"

import { Badge } from '@/components/ui/badge'
import { Calendar, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Project {
  id: string
  name: string
  description?: string
  status?: string
  created_at?: string
  updated_at?: string
}

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <div className="border-b bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(project.status)}>
              {project.status || 'Active'}
            </Badge>
            
            {project.created_at && (
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/project/${project.id}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}