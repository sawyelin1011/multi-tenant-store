'use client'

import * as React from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { cn } from '@/lib/utils'
import type { Plugin } from '@/types'

interface DashboardShellProps {
  children: React.ReactNode
  plugins?: Plugin[]
}

export function DashboardShell({ children, plugins }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(true)

  return (
    <div className="relative min-h-screen bg-[#0b0c15] flex">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} plugins={plugins} />
      <main
        className={cn(
          'flex-1 min-w-0 transition-all duration-300 ease-in-out p-4 md:p-6 lg:p-8',
          isCollapsed
            ? 'ml-[70px]'
            : 'ml-[calc(3.5rem+8vw)] sm:ml-[18rem] lg:ml-64',
        )}
      >
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">{children}</div>
      </main>
    </div>
  )
}
