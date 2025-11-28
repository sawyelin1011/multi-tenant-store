import { useQuery } from '@tanstack/react-query'
import { apiClient, buildQueryString, fetcher } from '@/lib/api'
import type { User, PaginatedResponse } from '@/types'

interface UseUsersOptions {
  page?: number
  limit?: number
  role?: 'admin' | 'editor' | 'viewer'
  search?: string
}

export function useUsers(options: UseUsersOptions = {}) {
  const queryString = buildQueryString({
    page: options.page,
    limit: options.limit,
    role: options.role,
    search: options.search,
  })

  return useQuery({
    queryKey: ['users', queryString],
    queryFn: () => fetcher<PaginatedResponse<User>>(`/admin/users${queryString}`),
  })
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => fetcher<User>(`/admin/users/${id}`),
    enabled: !!id,
  })
}

export async function createUser(payload: { email: string; name: string; role: User['role']; password: string }) {
  return apiClient.post<User>('/admin/users', payload)
}

export async function updateUser(id: string, payload: Partial<User>) {
  return apiClient.put<User>(`/admin/users/${id}`, payload)
}

export async function deleteUser(id: string) {
  return apiClient.delete(`/admin/users/${id}`)
}
