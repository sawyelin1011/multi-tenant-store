import { useQuery } from '@tanstack/react-query'
import { apiClient, buildQueryString, fetcher } from '@/lib/api'
import type { Collection, PaginatedResponse } from '@/types'

interface UseCollectionsOptions {
  page?: number
  limit?: number
  search?: string
}

export function useCollections(options: UseCollectionsOptions = {}) {
  const queryString = buildQueryString({
    page: options.page,
    limit: options.limit,
    search: options.search,
  })

  return useQuery({
    queryKey: ['collections', queryString],
    queryFn: () => fetcher<PaginatedResponse<Collection>>(`/admin/collections${queryString}`),
  })
}

export function useCollection(id: string | null) {
  return useQuery({
    queryKey: ['collections', id],
    queryFn: () => fetcher<Collection>(`/admin/collections/${id}`),
    enabled: !!id,
  })
}

export async function createCollection(payload: Pick<Collection, 'name' | 'slug' | 'description'>) {
  return apiClient.post<Collection>('/admin/collections', payload)
}

export async function updateCollection(id: string, payload: Partial<Collection>) {
  return apiClient.put<Collection>(`/admin/collections/${id}`, payload)
}

export async function deleteCollection(id: string) {
  return apiClient.delete(`/admin/collections/${id}`)
}
