"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home, TestTube, Users, BarChart3, Settings, FileText, Plus, Edit, Play } from 'lucide-react'

interface BreadcrumbNavProps {
  projectId: string
  projectName?: string
}

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function BreadcrumbNav({ projectId, projectName = "Project" }: BreadcrumbNavProps) {
  const pathname = usePathname()
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: projectName,
        href: `/project/${projectId}`,
        icon: Home
      }
    ]

    // Parse the current path
    const pathSegments = pathname.split('/').filter(Boolean)
    
    if (pathSegments.length > 2) {
      const section = pathSegments[2] // The section after /project/[id]/
      
      switch (section) {
        case 'testcase':
          breadcrumbs.push({
            label: 'Test Cases',
            href: `/project/${projectId}/testcase`,
            icon: TestTube
          })
          
          // Check for specific test case
          if (pathSegments[3] && pathSegments[3] !== 'new') {
            const testCaseId = pathSegments[3]
            breadcrumbs.push({
              label: `Test Case`,
              href: `/project/${projectId}/testcase/${testCaseId}`,
              icon: FileText
            })
            
            // Check for action on test case
            if (pathSegments[4]) {
              const action = pathSegments[4]
              switch (action) {
                case 'edit':
                  breadcrumbs.push({
                    label: 'Edit',
                    icon: Edit
                  })
                  break
                case 'execute':
                  breadcrumbs.push({
                    label: 'Execute',
                    icon: Play
                  })
                  break
              }
            }
          } else if (pathSegments[3] === 'new') {
            breadcrumbs.push({
              label: 'New Test Case',
              icon: Plus
            })
          }
          break
          
        case 'testers':
          breadcrumbs.push({
            label: 'Testers',
            icon: Users
          })
          break
          
        case 'reports':
          breadcrumbs.push({
            label: 'Reports',
            icon: BarChart3
          })
          break
          
        case 'settings':
          breadcrumbs.push({
            label: 'Settings',
            icon: Settings
          })
          break
      }
    }
    
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          
          <div className="flex items-center space-x-1">
            {breadcrumb.icon && (
              <breadcrumb.icon className="h-4 w-4" />
            )}
            
            {breadcrumb.href ? (
              <Link 
                href={breadcrumb.href} 
                className="hover:text-foreground transition-colors"
              >
                {breadcrumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">
                {breadcrumb.label}
              </span>
            )}
          </div>
        </div>
      ))}
    </nav>
  )
}