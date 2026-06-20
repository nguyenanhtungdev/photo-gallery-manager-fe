import type { ProjectStatus } from '@/lib/mock-data'
import { apiFetch } from '@/lib/auth'

export type DashboardRecentProject = {
  id: string
  name: string
  clientName: string
  status: ProjectStatus
  paidAmount?: number | null
  createdAt: string
  photoCount: number
}

export type DashboardOverview = {
  summary: {
    totalProjects: number
    paidProjects: number
    waitingProjects: number
    totalPhotos: number
    totalViewSessions: number
    totalPaidAmount: number
    paidPercentage: number
    averagePhotosPerProject: number
  }
  recentProjects: DashboardRecentProject[]
}

export async function getDashboardOverview() {
  return request<DashboardOverview>('/dashboard/overview')
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await apiFetch(path, init)

  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        response.status === 401 ? 'Phien dang nhap da het han' : 'Khong the ket noi may chu',
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
