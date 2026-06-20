import type { Project, ProjectStatus } from '@/lib/mock-data'
import { clearSession, getApiUrl, getStoredSession } from '@/lib/auth'

export type CreateProjectInput = {
  name: string
  clientName: string
  clientPhone: string
  notes?: string
}

export async function listProjects() {
  const data = await request<{ projects: Project[] }>('/projects')
  return data.projects
}

export async function getProject(projectId: string) {
  const data = await request<{ project: Project }>(`/projects/${projectId}`)
  return data.project
}

export async function createProject(payload: CreateProjectInput) {
  const data = await request<{ project: Project }>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return data.project
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const data = await request<{ project: Project }>(`/projects/${projectId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

  return data.project
}

export async function deleteProject(projectId: string) {
  await request(`/projects/${projectId}`, {
    method: 'DELETE',
  })
}

async function request<T>(path: string, init: RequestInit = {}) {
  const session = getStoredSession()
  if (!session?.accessToken) {
    throw new Error('Vui long dang nhap lai')
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${session.accessToken}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(getApiUrl(path), {
    ...init,
    headers,
    cache: 'no-store',
  })

  const data = await readJson(response)
  if (!response.ok) {
    if (response.status === 401) {
      clearSession()
    }

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
