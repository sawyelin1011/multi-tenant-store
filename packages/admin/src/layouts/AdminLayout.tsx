import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import { usePlugins } from '@/hooks/usePlugins'
import { DashboardShell } from '@/components/dashboard-shell'

export function AdminLayout() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [hydrated, isAuthenticated, navigate])

  const { data: pluginsData } = usePlugins({ enabled: true }, hydrated && isAuthenticated)

  if (!hydrated) {
    return <div className="min-h-screen bg-[#0b0c15]" />
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0c15] flex items-center justify-center">
        <div className="text-white">Redirecting...</div>
      </div>
    )
  }

  const enabledPlugins = pluginsData?.data.filter((p: any) => p.enabled && p.menuItems) || []

  return (
    <DashboardShell plugins={enabledPlugins}>
      <Outlet />
    </DashboardShell>
  )
}
