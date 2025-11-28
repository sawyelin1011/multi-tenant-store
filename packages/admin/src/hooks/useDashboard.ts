import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/api'
import type { DashboardStats, RecentActivity } from '@/types'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => fetcher<DashboardStats>('/admin/dashboard/stats'),
    refetchInterval: 30000,
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => fetcher<RecentActivity[]>('/admin/dashboard/recent-activity'),
    refetchInterval: 30000,
  })
}
