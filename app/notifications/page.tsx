'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCircle2, Clock, Eye, FolderPlus, Loader2, WalletCards } from 'lucide-react'
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
  type NotificationType,
} from '@/lib/notifications-api'
import { formatDate } from '@/lib/utils'

const PAGE_SIZE = 20

const TYPE_META: Record<NotificationType, { icon: typeof Eye; color: string; label: string }> = {
  share_accessed: {
    icon: Eye,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    label: 'Truy cập link',
  },
  project_created: {
    icon: FolderPlus,
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    label: 'Project mới',
  },
  payment_updated: {
    icon: WalletCards,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Thanh toán',
  },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [nextOffset, setNextOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadInitialNotifications() {
      try {
        const data = await listNotifications({
          offset: 0,
          limit: PAGE_SIZE,
        })

        if (!active) {
          return
        }

        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
        setNextOffset(data.pagination.nextOffset)
        setHasMore(data.pagination.hasMore)
        setError(null)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Không thể tải thông báo')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadInitialNotifications()

    return () => {
      active = false
    }
  }, [])

  async function loadMoreNotifications() {
    try {
      setLoadingMore(true)

      const data = await listNotifications({
        offset: nextOffset,
        limit: PAGE_SIZE,
      })

      setNotifications((current) => [...current, ...data.notifications])
      setUnreadCount(data.unreadCount)
      setNextOffset(data.pagination.nextOffset)
      setHasMore(data.pagination.hasMore)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông báo')
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      setUpdatingId(notificationId)
      const updated = await markNotificationAsRead(notificationId)
      setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item))
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật thông báo')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleMarkAllAsRead() {
    try {
      setMarkingAll(true)
      await markAllNotificationsAsRead()
      const readAt = new Date().toISOString()
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })))
      setUnreadCount(0)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật thông báo')
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi khách truy cập link share, project mới và cập nhật thanh toán.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleMarkAllAsRead()}
          disabled={markingAll || unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Đánh dấu đã đọc
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Chưa đọc</p>
          <p className="mt-2 text-2xl font-bold text-primary">{unreadCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Tổng thông báo đang tải</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{notifications.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Nguồn sự kiện</p>
          <p className="mt-2 text-sm font-semibold text-foreground">Share link • Project • Thanh toán</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Chưa có thông báo nào</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Khi khách mở link share, bạn tạo project hoặc cập nhật thanh toán, thông báo sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                updating={updatingId === notification.id}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void loadMoreNotifications()}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/30 hover:text-primary disabled:opacity-50"
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
            {loadingMore ? 'Đang tải...' : 'Tải thêm'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function NotificationRow({
  notification,
  updating,
  onMarkAsRead,
}: {
  notification: AppNotification
  updating: boolean
  onMarkAsRead: (notificationId: string) => Promise<void>
}) {
  const meta = TYPE_META[notification.type]
  const Icon = meta.icon
  const isUnread = !notification.readAt

  return (
    <div className={`flex gap-3 px-4 py-4 md:px-6 ${isUnread ? 'bg-primary/[0.03]' : ''}`}>
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{notification.title}</p>
          {isUnread ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
              Mới
            </span>
          ) : null}
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {meta.label}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{notification.message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(notification.createdAt)}</span>
          {notification.projectName ? <span>• {notification.projectName}</span> : null}
          {notification.projectId ? (
            <>
              <span>•</span>
              <Link href={`/projects/${notification.projectId}`} className="font-semibold text-primary hover:underline">
                Mở project
              </Link>
            </>
          ) : null}
        </div>
      </div>
      {isUnread ? (
        <button
          type="button"
          onClick={() => void onMarkAsRead(notification.id)}
          disabled={updating}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-primary/40 hover:text-primary disabled:opacity-50"
          aria-label="Đánh dấu đã đọc"
        >
          {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
      ) : null}
    </div>
  )
}
