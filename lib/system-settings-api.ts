import { apiFetch } from '@/lib/auth'

export type SystemSettings = {
  paidProjectPhotoRetentionDays: number
  paidProjectPhotoCleanupHour: number
  paidProjectPhotoCleanupMinute: number
  paidProjectPhotoCleanupTarget: 'all_users' | 'selected_users'
  paidProjectPhotoCleanupUserIds: string[]
}

export type CleanupJobLog = {
  id: string
  status: 'success' | 'partial_failed' | 'failed' | 'skipped'
  startedAt: string
  finishedAt: string
  durationMs: number
  retentionDays: number
  cutoffAt: string | null
  scheduleHour: number
  scheduleMinute: number
  target: 'all_users' | 'selected_users'
  userIds: string[]
  scannedProjects: number
  cleanedProjects: number
  deletedPhotos: number
  failedPhotos: number
  errorMessage: string | null
}

export async function getSystemSettings() {
  return request<SystemSettings>('/settings')
}

export async function listCleanupJobLogs(limit = 20) {
  return request<{ logs: CleanupJobLog[] }>(`/settings/cleanup-logs?limit=${limit}`)
}

export async function updateSystemSettings(payload: Partial<SystemSettings>) {
  return request<SystemSettings>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await apiFetch(path, init)
  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Không thể tải cấu hình hệ thống'))
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
  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message
  }

  return fallback
}
