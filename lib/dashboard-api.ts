import type { ProjectStatus } from '@/lib/mock-data'
import { apiFetch } from '@/lib/auth'

type DashboardSummary = {
  totalProjects: number
  paidProjects: number
  waitingProjects: number
  cancelledProjects: number
  totalPhotos: number
  totalViewSessions: number
  totalPaidAmount: number
  paidPercentage: number
  cancellationRate: number
  averagePhotosPerProject: number
}

export type AdminDashboardRecentUser = {
  id: string
  name: string | null
  email: string
  username: string
  role: 'admin' | 'user'
  createdAt: string
  lastLoginAt: string | null
}

export type AdminDashboardRecentProject = {
  id: string
  owner: {
    id: string
    name: string | null
    email: string
    username: string
    role: 'admin' | 'user'
  } | null
  name: string
  clientName: string
  status: ProjectStatus
  paidAmount?: number | null
  createdAt: string
  photoCount: number
}

export type AdminDashboardOverview = {
  summary: DashboardSummary & {
    totalUsers: number
    totalAdmins: number
    activeSessions: number
  }
  recentUsers: AdminDashboardRecentUser[]
  recentProjects: AdminDashboardRecentProject[]
}

export type UserDashboardRecentProject = {
  id: string
  name: string
  clientName: string
  status: ProjectStatus
  paidAmount?: number | null
  createdAt: string
  photoCount: number
}

export type UserDashboardOverview = {
  summary: DashboardSummary
  recentProjects: UserDashboardRecentProject[]
}

export async function getAdminDashboardOverview() {
  return request<AdminDashboardOverview>('/dashboard/admin/overview')
}

export async function getUserDashboardOverview() {
  return request<UserDashboardOverview>('/dashboard/overview')
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
            ? 'Bạn không có quyền truy cập khu vực quản trị'
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
