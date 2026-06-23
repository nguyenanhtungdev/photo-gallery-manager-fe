import { apiFetch } from '@/lib/auth'

export type AdminUserRole = 'admin' | 'user'

export type AdminUser = {
  id: string
  username: string
  name: string | null
  email: string
  role: AdminUserRole
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  projectStats: {
    projectCount: number
    paidProjectCount: number
    waitingProjectCount: number
    totalPhotos: number
    totalViewSessions: number
    totalPaidAmount: number
    lastProjectAt: string | null
  }
}

export type ListUsersParams = {
  search?: string
  role?: AdminUserRole
  offset?: number
  limit?: number
}

export type ListUsersResponse = {
  users: AdminUser[]
  pagination: {
    offset: number
    limit: number
    total: number
    hasMore: boolean
    nextOffset: number
  }
  filters: {
    search: string | null
    role: AdminUserRole | null
  }
}

export async function listUsers(params: ListUsersParams = {}): Promise<ListUsersResponse> {
  const searchParams = new URLSearchParams()

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim())
  }

  if (params.role) {
    searchParams.set('role', params.role)
  }

  if (typeof params.offset === 'number') {
    searchParams.set('offset', String(params.offset))
  }

  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit))
  }

  const query = searchParams.toString()
  return request<ListUsersResponse>(query ? `/dashboard/admin/users?${query}` : '/dashboard/admin/users')
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await apiFetch(path, init)

  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        response.status === 401
          ? 'Phiên đăng nhập đã hết hạn'
          : response.status === 403
            ? 'Bạn không có quyền quản lý người dùng'
            : 'Không thể kết nối máy chủ',
      ),
    )
  }

  return data as T
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === 'object' && data && 'message' in data) {
    const { message } = data as { message?: string | string[] }
    if (Array.isArray(message)) {
      return message[0] ?? fallback
    }
    if (typeof message === 'string') {
      return message
    }
  }

  return fallback
}
