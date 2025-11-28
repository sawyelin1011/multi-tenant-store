import type {
  AuthResponse,
  Content,
  ContentPayload,
  Collection,
  Media,
  Plugin,
  User,
  Settings,
  DashboardStats,
  RecentActivity,
  PaginatedResponse,
} from '@/types'
import { useAuthStore } from '@/store/authStore'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    avatar: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'editor@example.com',
    name: 'Editor User',
    role: 'editor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockContent: Content[] = [
  {
    id: '1',
    title: 'Getting Started with CF CMS',
    slug: 'getting-started',
    content: 'Welcome to CF CMS! This is your first content item.',
    status: 'published',
    collection: { id: '1', name: 'Blog Posts' },
    author: mockUsers[0],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Draft Content Example',
    slug: 'draft-content',
    content: 'This is a draft content item.',
    status: 'draft',
    author: mockUsers[1],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Blog Posts',
    slug: 'blog-posts',
    description: 'Articles and blog content',
    icon: 'file-text',
    color: '#6366f1',
    contentCount: 15,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Pages',
    slug: 'pages',
    description: 'Static pages',
    icon: 'file',
    color: '#8b5cf6',
    contentCount: 5,
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockMedia: Media[] = [
  {
    id: '1',
    filename: 'hero-image.jpg',
    originalName: 'hero-image.jpg',
    mimeType: 'image/jpeg',
    size: 245678,
    url: '/placeholder-image.jpg',
    uploadedBy: mockUsers[0],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

const mockPlugins: Plugin[] = [
  {
    id: '1',
    name: 'Analytics Dashboard',
    slug: 'analytics',
    description: 'View site analytics and visitor statistics',
    version: '1.0.0',
    icon: 'bar-chart',
    enabled: true,
    hasSettings: true,
    menuItems: [
      { label: 'Analytics', href: '/admin/plugins/analytics', icon: 'bar-chart' },
    ],
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'SEO Manager',
    slug: 'seo',
    description: 'Manage SEO settings and metadata',
    version: '1.2.0',
    enabled: false,
    hasSettings: true,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockSettings: Settings = {
  siteName: 'CF CMS',
  siteDescription: 'A modern content management system',
  timezone: 'UTC',
  dateFormat: 'yyyy-MM-dd',
  enableRegistration: false,
  defaultRole: 'viewer',
  maintenance: false,
}

const mockDashboardStats: DashboardStats = {
  totalContent: 42,
  totalUsers: 8,
  totalCollections: 6,
  totalMedia: 134,
}

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'content',
    action: 'created',
    description: 'New blog post created',
    user: { id: mockUsers[0].id, name: mockUsers[0].name, avatar: mockUsers[0].avatar },
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    type: 'user',
    action: 'updated',
    description: 'User profile updated',
    user: { id: mockUsers[1].id, name: mockUsers[1].name },
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    type: 'media',
    action: 'created',
    description: 'Image uploaded',
    user: { id: mockUsers[0].id, name: mockUsers[0].name, avatar: mockUsers[0].avatar },
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  },
]

class MockApiClient {
  async get<T>(url: string): Promise<T> {
    await delay(300 + Math.random() * 200)

    if (url === '/admin/auth/me') {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('Not authenticated')
      return { user } as T
    }

    if (url === '/admin/dashboard/stats') {
      return mockDashboardStats as T
    }

    if (url === '/admin/dashboard/recent-activity') {
      return mockRecentActivity as T
    }

    if (url.startsWith('/admin/content')) {
      if (url.match(/\/admin\/content\/\d+$/)) {
        const id = url.split('/').pop()
        const content = mockContent.find((c) => c.id === id)
        if (!content) throw new Error('Content not found')
        return content as T
      }
      const response: PaginatedResponse<Content> = {
        data: mockContent,
        meta: { total: mockContent.length, page: 1, limit: 10, totalPages: 1 },
      }
      return response as T
    }

    if (url.startsWith('/admin/collections')) {
      if (url.match(/\/admin\/collections\/\d+$/)) {
        const id = url.split('/').pop()
        const collection = mockCollections.find((c) => c.id === id)
        if (!collection) throw new Error('Collection not found')
        return collection as T
      }
      const response: PaginatedResponse<Collection> = {
        data: mockCollections,
        meta: { total: mockCollections.length, page: 1, limit: 10, totalPages: 1 },
      }
      return response as T
    }

    if (url.startsWith('/admin/media')) {
      if (url.match(/\/admin\/media\/\d+$/)) {
        const id = url.split('/').pop()
        const media = mockMedia.find((m) => m.id === id)
        if (!media) throw new Error('Media not found')
        return media as T
      }
      const response: PaginatedResponse<Media> = {
        data: mockMedia,
        meta: { total: mockMedia.length, page: 1, limit: 10, totalPages: 1 },
      }
      return response as T
    }

    if (url.startsWith('/admin/users')) {
      if (url.match(/\/admin\/users\/\d+$/)) {
        const id = url.split('/').pop()
        const user = mockUsers.find((u) => u.id === id)
        if (!user) throw new Error('User not found')
        return user as T
      }
      const response: PaginatedResponse<User> = {
        data: mockUsers,
        meta: { total: mockUsers.length, page: 1, limit: 10, totalPages: 1 },
      }
      return response as T
    }

    if (url.startsWith('/admin/plugins')) {
      if (url.match(/\/admin\/plugins\/\w+\/settings$/)) {
        return {} as T
      }
      if (url.match(/\/admin\/plugins\/\d+$/)) {
        const id = url.split('/').slice(-1)[0]
        const plugin = mockPlugins.find((p) => p.id === id)
        if (!plugin) throw new Error('Plugin not found')
        return plugin as T
      }
      const response: PaginatedResponse<Plugin> = {
        data: url.includes('enabled=true') ? mockPlugins.filter((p) => p.enabled) : mockPlugins,
        meta: { total: mockPlugins.length, page: 1, limit: 10, totalPages: 1 },
      }
      return response as T
    }

    if (url === '/admin/settings') {
      return mockSettings as T
    }

    throw new Error(`Mock API: Unhandled GET ${url}`)
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    await delay(300 + Math.random() * 200)

    if (url === '/admin/auth/login') {
      const { email, password } = data as { email: string; password: string }
      if (email === 'admin@example.com' && password === 'admin') {
        const response: AuthResponse = {
          token: 'mock-token-' + Date.now(),
          user: mockUsers[0],
        }
        return response as T
      }
      throw new Error('Invalid credentials')
    }

    if (url === '/admin/auth/logout') {
      return {} as T
    }

    if (url === '/admin/auth/refresh') {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('Not authenticated')
      const response: AuthResponse = {
        token: 'mock-token-' + Date.now(),
        user,
      }
      return response as T
    }

    if (url === '/admin/content') {
      const payload = data as ContentPayload
      const newContent: Content = {
        id: String(mockContent.length + 1),
        title: payload.title,
        slug: payload.slug,
        content: payload.content,
        status: payload.status,
        collection: payload.collectionId
          ? mockCollections.find((c) => c.id === payload.collectionId)
          : undefined,
        author: mockUsers[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: payload.status === 'published' ? new Date().toISOString() : undefined,
      }
      mockContent.push(newContent)
      return newContent as T
    }

    if (url === '/admin/collections') {
      const payload = data as Partial<Collection>
      const newCollection: Collection = {
        id: String(mockCollections.length + 1),
        name: payload.name || 'New Collection',
        slug: payload.slug || 'new-collection',
        description: payload.description,
        icon: payload.icon,
        color: payload.color,
        contentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockCollections.push(newCollection)
      return newCollection as T
    }

    if (url === '/admin/users') {
      const payload = data as Partial<User>
      const newUser: User = {
        id: String(mockUsers.length + 1),
        email: payload.email || 'new@example.com',
        name: payload.name || 'New User',
        role: payload.role || 'viewer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockUsers.push(newUser)
      return newUser as T
    }

    if (url.startsWith('/admin/media/upload')) {
      const newMedia: Media = {
        id: String(mockMedia.length + 1),
        filename: 'uploaded-file.jpg',
        originalName: 'uploaded-file.jpg',
        mimeType: 'image/jpeg',
        size: 123456,
        url: '/placeholder-upload.jpg',
        uploadedBy: mockUsers[0],
        createdAt: new Date().toISOString(),
      }
      mockMedia.push(newMedia)
      return newMedia as T
    }

    return {} as T
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    await delay(300 + Math.random() * 200)

    if (url.match(/\/admin\/content\/\d+$/)) {
      const id = url.split('/').pop()
      const index = mockContent.findIndex((c) => c.id === id)
      if (index !== -1) {
        const payload = data as ContentPayload
        mockContent[index] = {
          ...mockContent[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        }
        return mockContent[index] as T
      }
    }

    if (url.match(/\/admin\/collections\/\d+$/)) {
      const id = url.split('/').pop()
      const index = mockCollections.findIndex((c) => c.id === id)
      if (index !== -1) {
        const payload = data as Partial<Collection>
        mockCollections[index] = {
          ...mockCollections[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        }
        return mockCollections[index] as T
      }
    }

    if (url.match(/\/admin\/users\/\d+$/)) {
      const id = url.split('/').pop()
      const index = mockUsers.findIndex((u) => u.id === id)
      if (index !== -1) {
        const payload = data as Partial<User>
        mockUsers[index] = {
          ...mockUsers[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        }
        return mockUsers[index] as T
      }
    }

    if (url === '/admin/settings') {
      Object.assign(mockSettings, data)
      return mockSettings as T
    }

    if (url.match(/\/admin\/plugins\/\w+\/settings$/)) {
      return {} as T
    }

    return {} as T
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    await delay(300 + Math.random() * 200)

    if (url.match(/\/admin\/plugins\/\d+$/)) {
      const id = url.split('/').pop()
      const index = mockPlugins.findIndex((p) => p.id === id)
      if (index !== -1) {
        const payload = data as Partial<Plugin>
        mockPlugins[index] = {
          ...mockPlugins[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        }
        return mockPlugins[index] as T
      }
    }

    return {} as T
  }

  async delete<T>(url: string): Promise<T> {
    await delay(300 + Math.random() * 200)

    if (url.match(/\/admin\/content\/\d+$/)) {
      const id = url.split('/').pop()
      const index = mockContent.findIndex((c) => c.id === id)
      if (index !== -1) {
        mockContent.splice(index, 1)
      }
    }

    if (url.match(/\/admin\/collections\/\d+$/)) {
      const id = url.split('/').pop()
      const index = mockCollections.findIndex((c) => c.id === id)
      if (index !== -1) {
        mockCollections.splice(index, 1)
      }
    }

    if (url.match(/\/admin\/media\/\d+$/)) {
      const id = url.split('/').pop()
      const index = mockMedia.findIndex((m) => m.id === id)
      if (index !== -1) {
        mockMedia.splice(index, 1)
      }
    }

    if (url.match(/\/admin\/users\/\d+$/)) {
      const id = url.split('/').pop()
      const index = mockUsers.findIndex((u) => u.id === id)
      if (index !== -1) {
        mockUsers.splice(index, 1)
      }
    }

    return {} as T
  }
}

let mockApiInstance: MockApiClient | null = null

export function getMockApi(): MockApiClient {
  if (!mockApiInstance) {
    mockApiInstance = new MockApiClient()
  }
  return mockApiInstance
}
