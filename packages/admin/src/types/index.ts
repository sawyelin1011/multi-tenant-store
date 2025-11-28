export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface DashboardStats {
  totalContent: number
  totalUsers: number
  totalCollections: number
  totalMedia: number
}

export interface RecentActivity {
  id: string
  type: 'content' | 'user' | 'collection' | 'media'
  action: 'created' | 'updated' | 'deleted'
  description: string
  user: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: string
}

export interface Content {
  id: string
  title: string
  slug: string
  content: string
  status: 'draft' | 'published' | 'archived'
  collection?: {
    id: string
    name: string
  }
  author: {
    id: string
    name: string
    avatar?: string
  }
  featured_image?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface ContentPayload {
  title: string
  slug: string
  content: string
  status: Content['status']
  collectionId?: string
  featuredImage?: string
  summary?: string
  meta?: Record<string, string>
}

export interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  contentCount: number
  createdAt: string
  updatedAt: string
}

export interface Media {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  uploadedBy: {
    id: string
    name: string
  }
  createdAt: string
}

export interface Plugin {
  id: string
  name: string
  slug: string
  description?: string
  version: string
  icon?: string
  enabled: boolean
  hasSettings: boolean
  menuItems?: PluginMenuItem[]
  createdAt: string
  updatedAt: string
}

export interface PluginMenuItem {
  label: string
  href: string
  icon?: string
}

export interface Settings {
  siteName: string
  siteDescription?: string
  siteLogo?: string
  siteFavicon?: string
  timezone: string
  dateFormat: string
  enableRegistration: boolean
  defaultRole: string
  maintenance: boolean
  customCSS?: string
  customJS?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
