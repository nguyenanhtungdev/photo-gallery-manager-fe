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
  rememberToken?: string
  deviceId?: string
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

type AuthRequestPayload = Record<string, unknown>

const STORAGE_KEY = 'photo-gallery-admin-session'
const DEVICE_KEY = 'photo-gallery-admin-device-id'
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
  const deviceId = getDeviceId()
  const deviceName = getDeviceName()
  const session = await requestAuth('/auth/login', {
    ...payload,
    deviceId,
    deviceName,
    rememberAccount: true,
  })

  return {
    ...session,
    deviceId,
  }
}

export async function register(payload: RegisterPayload) {
  const session = await requestAuth('/auth/register', payload)
  return {
    ...session,
    deviceId: getDeviceId(),
  }
}

export async function fetchCurrentUser(accessToken: string) {
  const response = await apiFetch('/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await readJson(response)
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Phiên đăng nhập đã hết hạn'))
  }

  return data.user as AuthUser
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const session = getStoredSession()
  if (!session?.accessToken) {
    throw new Error('Vui long dang nhap lai')
  }

  return requestWithSession(path, init, session, true)
}

async function requestAuth(path: string, payload: AuthRequestPayload) {
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

async function requestWithSession(
  path: string,
  init: RequestInit,
  session: AuthSession,
  allowRetry: boolean,
) {
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

  if (response.status !== 401 || !allowRetry) {
    if (response.status === 401) {
      clearSession()
    }
    return response
  }

  const refreshedSession = await tryRememberedLogin(session)
  if (!refreshedSession) {
    clearSession()
    return response
  }

  saveSession(refreshedSession)
  return requestWithSession(path, init, refreshedSession, false)
}

async function tryRememberedLogin(session: AuthSession) {
  if (!session.rememberToken || !session.deviceId) {
    return null
  }

  const response = await fetch(getApiUrl('/auth/remembered-login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rememberToken: session.rememberToken,
      deviceId: session.deviceId,
    }),
  })

  const data = await readJson(response)
  if (!response.ok) {
    return null
  }

  const nextSession = data as AuthSession
  return {
    ...nextSession,
    rememberToken: nextSession.rememberToken ?? session.rememberToken,
    deviceId: session.deviceId,
  }
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

function getDeviceId() {
  if (typeof window === 'undefined') {
    return `device-${Date.now()}`
  }

  let deviceId = window.localStorage.getItem(DEVICE_KEY)
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    window.localStorage.setItem(DEVICE_KEY, deviceId)
  }

  return deviceId
}

function getDeviceName() {
  if (typeof window === 'undefined') {
    return 'Unknown Device'
  }

  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Edge')) return 'Edge'

  return userAgent.split(' ')[0] || 'Unknown Device'
}
