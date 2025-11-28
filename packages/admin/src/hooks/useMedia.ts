import { useQuery } from '@tanstack/react-query'
import { apiClient, buildQueryString, fetcher } from '@/lib/api'
import type { Media, PaginatedResponse } from '@/types'

interface UseMediaOptions {
  page?: number
  limit?: number
  search?: string
  mimeType?: string
}

export function useMedia(options: UseMediaOptions = {}) {
  const queryString = buildQueryString({
    page: options.page,
    limit: options.limit,
    search: options.search,
    mimeType: options.mimeType,
  })

  return useQuery({
    queryKey: ['media', queryString],
    queryFn: () => fetcher<PaginatedResponse<Media>>(`/admin/media${queryString}`),
    refetchInterval: 0,
    refetchOnWindowFocus: false,
  })
}

export function useMediaItem(id: string | null) {
  return useQuery({
    queryKey: ['media', id],
    queryFn: () => fetcher<Media>(`/admin/media/${id}`),
    enabled: !!id,
  })
}

export async function uploadMedia(file: File, data?: { altText?: string; title?: string }) {
  const formData = new FormData()
  formData.append('file', file)
  if (data?.altText) formData.append('altText', data.altText)
  if (data?.title) formData.append('title', data.title)

  return apiClient.post<Media>('/admin/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export async function deleteMedia(id: string) {
  return apiClient.delete(`/admin/media/${id}`)
}
