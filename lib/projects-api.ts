import type { Project, ProjectStatus } from '@/lib/mock-data'
import { apiFetch } from '@/lib/auth'

export type CreateProjectInput = {
  name: string
  clientName: string
  clientPhone: string
  notes?: string
}

export type UpdateProjectInput = {
  name: string
  clientName: string
  clientPhone: string
  notes?: string
}

export type PhotoUploadPresign = {
  key: string
  uploadUrl: string
  method: string
  contentType: string
  expiresIn: number
}

export type AddProjectPhotoInput = {
  key: string
  filename: string
  contentType: string
  fileSize: number
  width?: number
  height?: number
}

export type ListProjectsParams = {
  q?: string
  status?: 'all' | ProjectStatus
  offset?: number
  limit?: number
  dateFrom?: string
  dateTo?: string
}

export type ListProjectsResponse = {
  projects: Project[]
  pagination: {
    offset: number
    limit: number
    total: number
    hasMore: boolean
    nextOffset: number
  }
  stats: {
    all: number
    paid: number
    waiting_payment: number
  }
}

export async function listProjects(params: ListProjectsParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.q?.trim()) {
    searchParams.set('q', params.q.trim())
  }

  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status)
  }

  if (typeof params.offset === 'number') {
    searchParams.set('offset', String(params.offset))
  }

  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit))
  }

  if (params.dateFrom) {
    searchParams.set('dateFrom', params.dateFrom)
  }

  if (params.dateTo) {
    searchParams.set('dateTo', params.dateTo)
  }

  const query = searchParams.toString()
  return request<ListProjectsResponse>(query ? `/projects?${query}` : '/projects')
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

export async function updateProject(projectId: string, payload: UpdateProjectInput) {
  const data = await request<{ project: Project }>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return data.project
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  paidAmount?: number | null,
) {
  const data = await request<{ project: Project }>(`/projects/${projectId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, paidAmount }),
  })

  return data.project
}

export async function deleteProject(projectId: string) {
  await request(`/projects/${projectId}`, {
    method: 'DELETE',
  })
}

export async function createProjectPhotoUploadUrl(
  projectId: string,
  payload: { fileName: string; contentType: string; fileSize: number },
) {
  return request<PhotoUploadPresign>(`/projects/${projectId}/photos/presign-put`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function addProjectPhoto(projectId: string, payload: AddProjectPhotoInput) {
  const data = await request<{ project: Project }>(`/projects/${projectId}/photos`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return data.project
}

export async function deleteProjectPhoto(projectId: string, photoId: string) {
  const data = await request<{ project: Project }>(`/projects/${projectId}/photos/${photoId}`, {
    method: 'DELETE',
  })

  return data.project
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void,
) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) {
        return
      }

      const progress = Math.min(100, Math.round((event.loaded / event.total) * 100))
      onProgress(progress)
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve()
        return
      }

      reject(new Error(`Upload failed with status ${xhr.status}`))
    }

    xhr.onerror = () => reject(new Error('Upload failed due to network error'))
    xhr.send(file)
  })
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
