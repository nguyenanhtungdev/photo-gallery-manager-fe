'use client'

import { io, type Socket } from 'socket.io-client'
import { getStoredSession } from '@/lib/auth'
import { getApiKey, getApiOrigin } from '@/lib/api-config'
import type {
  NotificationCreatedEventDetail,
  NotificationReadEventDetail,
  NotificationsAllReadEventDetail,
} from '@/lib/notifications-api'

type NotificationsSocketEvents = {
  onCreated?: (detail: NotificationCreatedEventDetail) => void
  onRead?: (detail: NotificationReadEventDetail) => void
  onAllRead?: (detail: NotificationsAllReadEventDetail) => void
}

let notificationsSocket: Socket | null = null
let activeSocketKey: string | null = null

function buildSocketKey(userId: string, accessToken: string) {
  return `${userId}:${accessToken}`
}

function createNotificationsSocket() {
  const session = getStoredSession()
  if (!session?.accessToken) {
    return null
  }

  const socketKey = buildSocketKey(session.user.id, session.accessToken)
  if (notificationsSocket && activeSocketKey === socketKey) {
    return notificationsSocket
  }

  notificationsSocket?.disconnect()

  notificationsSocket = io(`${getApiOrigin()}/notifications`, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: {
      token: session.accessToken,
      apiKey: getApiKey(),
    },
  })
  activeSocketKey = socketKey

  return notificationsSocket
}

export function subscribeToNotificationsRealtime({
  onCreated,
  onRead,
  onAllRead,
}: NotificationsSocketEvents) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const socket = createNotificationsSocket()
  if (!socket) {
    return () => undefined
  }

  if (onCreated) {
    socket.on('notification.created', onCreated)
  }

  if (onRead) {
    socket.on('notification.read', onRead)
  }

  if (onAllRead) {
    socket.on('notification.all-read', onAllRead)
  }

  if (!socket.connected) {
    socket.connect()
  }

  return () => {
    if (onCreated) {
      socket.off('notification.created', onCreated)
    }

    if (onRead) {
      socket.off('notification.read', onRead)
    }

    if (onAllRead) {
      socket.off('notification.all-read', onAllRead)
    }
  }
}

export function disconnectNotificationsRealtime() {
  notificationsSocket?.disconnect()
  notificationsSocket = null
  activeSocketKey = null
}
