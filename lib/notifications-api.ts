import { apiFetch } from '@/lib/auth'

export type NotificationType = 'share_accessed' | 'project_created' | 'payment_updated'

export type AppNotification = {
  id: string
  ownerId: string
  projectId: string | null
  type: NotificationType
  title: string
  message: string
  projectName: string | null
  metadata: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export type ListNotificationsResponse = {
  notifications: AppNotification[]
  unreadCount: number
  pagination: {
    offset: number
    limit: number
    total: number
    hasMore: boolean
    nextOffset: number
  }
}

export async function listNotifications(params: { offset?: number; limit?: number } = {}) {
  const searchParams = new URLSearchParams()

  if (typeof params.offset === 'number') {
    searchParams.set('offset', String(params.offset))
  }

  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit))
  }

  const query = searchParams.toString()
  return request<ListNotificationsResponse>(query ? `/notifications?${query}` : '/notifications')
}

export async function markNotificationAsRead(notificationId: string) {
  const data = await request<{ notification: AppNotification }>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  })

  return data.notification
}

export async function markAllNotificationsAsRead() {
  await request('/notifications/read-all', {
    method: 'PATCH',
  })
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await apiFetch(path, init)
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Không thể tải thông báo'))
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
