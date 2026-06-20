'use client'

export type AuthUser = {
  id: string
  name: string | null
  email: string
  username: string
  createdAt: string
  updatedAt: string
}

export type AuthSession = {
  accessToken: string
  user: AuthUser
}

type LoginPayload = {
  username: string
  password: string
}

type RegisterPayload = {
  username: string
  password: string
}

const STORAGE_KEY = 'photo-gallery-admin-session'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export function getApiUrl(path: string) {
  return `${API_URL}${path}`
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export async function login(payload: LoginPayload) {
  return requestAuth('/auth/login', payload)
}

export async function register(payload: RegisterPayload) {
  return requestAuth('/auth/register', payload)
}

export async function fetchCurrentUser(accessToken: string) {
  const response = await fetch(getApiUrl('/auth/me'), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Phiên đăng nhập đã hết hạn'))
  }

  return data.user as AuthUser
}

async function requestAuth(path: string, payload: LoginPayload | RegisterPayload) {
  const response = await fetch(getApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Không thể kết nối máy chủ'))
  }

  return data as AuthSession
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
