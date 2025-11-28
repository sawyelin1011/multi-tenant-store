import { useQuery } from '@tanstack/react-query'
import { apiClient, fetcher } from '@/lib/api'
import type { Settings } from '@/types'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => fetcher<Settings>('/admin/settings'),
  })
}

export async function updateSettings(payload: Partial<Settings>) {
  return apiClient.put<Settings>('/admin/settings', payload)
}
