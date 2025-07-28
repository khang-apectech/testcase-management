"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, TestTube, Users, BarChart3, Settings } from 'lucide-react'

interface ProjectNavTabsProps {
  projectId: string
}

export function ProjectNavTabs({ projectId }: ProjectNavTabsProps) {
  const pathname = usePathname()

  const tabs = [
    {
      name: 'Dashboard',
      href: `/project/${projectId}/dashboard`,
      icon: Home,
      current: pathname === `/project/${projectId}/dashboard`
    },
    {
      name: 'Test Cases',  
      href: `/project/${projectId}/testcase`,
      icon: TestTube,
      current: pathname.startsWith(`/project/${projectId}/testcase`)
    },
    {
      name: 'Testers',
      href: `/project/${projectId}/tester`,
      icon: Users,
      current: pathname.startsWith(`/project/${projectId}/tester`)
    },
    {
      name: 'Reports',
      href: `/project/${projectId}/report`,
      icon: BarChart3,
      current: pathname === `/project/${projectId}/report`
    },
    {
      name: 'Settings',
      href: `/project/${projectId}/settings`,
      icon: Settings,
      current: pathname === `/project/${projectId}/settings`
    }
  ]

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-4 lg:space-x-8 px-4 lg:px-6 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                tab.current
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              )}
            >
              <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}