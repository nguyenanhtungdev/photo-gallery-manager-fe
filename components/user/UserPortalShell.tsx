'use client'

import { useEffect, useState } from 'react'
import { Bell, FolderOpen, LayoutDashboard, UserCircle2 } from 'lucide-react'
import { AppLayoutShell } from '@/components/app/AppLayoutShell'
import { SessionGuard } from '@/components/auth/SessionGuard'
import {
  emitNotificationCreated,
  emitNotificationRead,
  emitNotificationsAllRead,
  emitUnreadNotificationsCount,
  getUnreadNotificationsCount,
  NOTIFICATIONS_UNREAD_EVENT,
} from '@/lib/notifications-api'
import { subscribeToNotificationsRealtime } from '@/lib/notifications-realtime'

const navItems = [
  { href: '/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/notifications', icon: Bell, label: 'Thông báo' },
  { href: '/profile', icon: UserCircle2, label: 'Profile' },
]

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Thống kê cá nhân' },
  '/projects': { title: 'Projects', subtitle: 'Quản lý danh sách project' },
  '/notifications': { title: 'Thông báo', subtitle: 'Lịch sử sự kiện tài khoản' },
  '/profile': { title: 'Profile', subtitle: 'Quản lý thông tin tài khoản' },
}

export function UserPortalShell({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let active = true

    async function loadUnreadCount() {
      try {
        const count = await getUnreadNotificationsCount()
        if (active) {
          setUnreadCount(count)
        }
      } catch {
        if (active) {
          setUnreadCount(0)
        }
      }
    }

    function handleUnreadCountChange(event: Event) {
      const customEvent = event as CustomEvent<number>
      setUnreadCount(Math.max(0, customEvent.detail ?? 0))
    }

    const unsubscribeRealtime = subscribeToNotificationsRealtime({
      onCreated: (detail) => {
        setUnreadCount(detail.unreadCount)
        emitUnreadNotificationsCount(detail.unreadCount)
        emitNotificationCreated(detail)
      },
      onRead: (detail) => {
        setUnreadCount(detail.unreadCount)
        emitUnreadNotificationsCount(detail.unreadCount)
        emitNotificationRead(detail)
      },
      onAllRead: (detail) => {
        setUnreadCount(detail.unreadCount)
        emitUnreadNotificationsCount(detail.unreadCount)
        emitNotificationsAllRead(detail)
      },
    })

    void loadUnreadCount()
    window.addEventListener(NOTIFICATIONS_UNREAD_EVENT, handleUnreadCountChange)

    return () => {
      active = false
      unsubscribeRealtime()
      window.removeEventListener(NOTIFICATIONS_UNREAD_EVENT, handleUnreadCountChange)
    }
  }, [])

  return (
    <SessionGuard loginPath="/login" requiredRole="user" mismatchPath="/admin/dashboard">
      <AppLayoutShell
        navItems={navItems}
        pageMeta={PAGE_META}
        logoutPath="/login"
        portalLabel="User Portal"
        notificationBadgeCount={unreadCount}
      >
        {children}
      </AppLayoutShell>
    </SessionGuard>
  )
}
