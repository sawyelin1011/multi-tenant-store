import { useQuery } from '@tanstack/react-query'
import { apiClient, buildQueryString, fetcher } from '@/lib/api'
import type { Plugin, PaginatedResponse } from '@/types'

interface UsePluginsOptions {
  page?: number
  limit?: number
  enabled?: boolean
  search?: string
}

export function usePlugins(options: UsePluginsOptions = {}, fetchEnabled = true) {
  const queryString = buildQueryString({
    page: options.page,
    limit: options.limit,
    enabled: options.enabled,
    search: options.search,
  })

  return useQuery({
    queryKey: ['plugins', queryString],
    queryFn: () => fetcher<PaginatedResponse<Plugin>>(`/admin/plugins${queryString}`),
    enabled: fetchEnabled,
  })
}

export function usePlugin(id: string | null) {
  return useQuery({
    queryKey: ['plugins', id],
    queryFn: () => fetcher<Plugin>(`/admin/plugins/${id}`),
    enabled: !!id,
  })
}

export function usePluginSettings(id: string | null) {
  return useQuery({
    queryKey: ['plugins', id, 'settings'],
    queryFn: () => fetcher<Record<string, unknown>>(`/admin/plugins/${id}/settings`),
    enabled: !!id,
  })
}

export async function togglePlugin(id: string, enabled: boolean) {
  return apiClient.patch<Plugin>(`/admin/plugins/${id}`, { enabled })
}

export async function updatePluginSettings(id: string, settings: Record<string, unknown>) {
  return apiClient.put(`/admin/plugins/${id}/settings`, settings)
}
