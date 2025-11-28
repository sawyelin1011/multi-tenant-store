import { useQuery } from '@tanstack/react-query'
import { apiClient, buildQueryString, fetcher } from '@/lib/api'
import type { Content, ContentPayload, PaginatedResponse } from '@/types'

interface UseContentOptions {
  page?: number
  limit?: number
  status?: 'draft' | 'published' | 'archived'
  collectionId?: string
  search?: string
}

export function useContent(options: UseContentOptions = {}) {
  const queryString = buildQueryString({
    page: options.page,
    limit: options.limit,
    status: options.status,
    collectionId: options.collectionId,
    search: options.search,
  })

  return useQuery({
    queryKey: ['content', queryString],
    queryFn: () => fetcher<PaginatedResponse<Content>>(`/admin/content${queryString}`),
  })
}

export function useContentItem(id: string | null) {
  return useQuery({
    queryKey: ['content', id],
    queryFn: () => fetcher<Content>(`/admin/content/${id}`),
    enabled: !!id,
  })
}

export async function createContent(payload: ContentPayload) {
  return apiClient.post<Content>('/admin/content', payload)
}

export async function updateContent(id: string, payload: Partial<ContentPayload>) {
  return apiClient.put<Content>(`/admin/content/${id}`, payload)
}

export async function deleteContent(id: string) {
  return apiClient.delete(`/admin/content/${id}`)
}

export async function publishContent(id: string) {
  return apiClient.post<Content>(`/admin/content/${id}/publish`)
}

export async function unpublishContent(id: string) {
  return apiClient.post<Content>(`/admin/content/${id}/unpublish`)
}
