'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AdminSidebarContent } from '@/components/admin/admin-sidebar'
import type { Plugin } from '@/types'

interface AdminHeaderProps {
  plugins?: Plugin[]
}

export function AdminHeader({ plugins }: AdminHeaderProps) {
  return (
    <header className="lg:hidden flex items-center gap-4 mb-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white -ml-2">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 border-r border-white/5 bg-[#0a0b11] w-64 border-none text-white">
          <AdminSidebarContent plugins={plugins} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
