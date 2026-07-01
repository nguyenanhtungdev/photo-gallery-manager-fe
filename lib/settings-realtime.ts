'use client'

import { io, type Socket } from 'socket.io-client'
import { getApiKey, getApiOrigin } from '@/lib/api-config'
import { getStoredSession } from '@/lib/auth'
import type { CleanupJobLog } from '@/lib/system-settings-api'

export type CleanupLogsRealtimeStatus = 'connecting' | 'connected' | 'disconnected'

type CleanupLogsSocketEvents = {
  onCreated?: (detail: { log: CleanupJobLog }) => void
  onStatusChange?: (status: CleanupLogsRealtimeStatus) => void
}

let settingsSocket: Socket | null = null
let activeSocketKey: string | null = null

function buildSocketKey(userId: string, accessToken: string) {
  return `${userId}:${accessToken}`
}

function createSettingsSocket() {
  const session = getStoredSession()
  if (!session?.accessToken) {
    return null
  }

  const socketKey = buildSocketKey(session.user.id, session.accessToken)
  if (settingsSocket && activeSocketKey === socketKey) {
    return settingsSocket
  }

  settingsSocket?.disconnect()

  settingsSocket = io(`${getApiOrigin()}/settings`, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: {
      token: session.accessToken,
      apiKey: getApiKey(),
    },
  })
  activeSocketKey = socketKey

  return settingsSocket
}

export function subscribeToCleanupLogsRealtime({
  onCreated,
  onStatusChange,
}: CleanupLogsSocketEvents) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const socket = createSettingsSocket()
  if (!socket) {
    onStatusChange?.('disconnected')
    return () => undefined
  }

  const handleConnect = () => onStatusChange?.('connected')
  const handleDisconnect = () => onStatusChange?.('disconnected')
  const handleConnectError = () => onStatusChange?.('disconnected')

  onStatusChange?.(socket.connected ? 'connected' : 'connecting')
  socket.on('connect', handleConnect)
  socket.on('disconnect', handleDisconnect)
  socket.on('connect_error', handleConnectError)

  if (onCreated) {
    socket.on('cleanup-log.created', onCreated)
  }

  if (!socket.connected) {
    socket.connect()
  }

  return () => {
    socket.off('connect', handleConnect)
    socket.off('disconnect', handleDisconnect)
    socket.off('connect_error', handleConnectError)

    if (onCreated) {
      socket.off('cleanup-log.created', onCreated)
    }
  }
}

export function disconnectSettingsRealtime() {
  settingsSocket?.disconnect()
  settingsSocket = null
  activeSocketKey = null
}
