"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FolderPlus,
  Loader2,
  WalletCards,
} from "lucide-react";
import {
  emitUnreadNotificationsCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NOTIFICATION_CREATED_EVENT,
  NOTIFICATION_READ_EVENT,
  NOTIFICATIONS_ALL_READ_EVENT,
  type AppNotification,
  type NotificationCreatedEventDetail,
  type NotificationReadEventDetail,
  type NotificationType,
  type NotificationsAllReadEventDetail,
} from "@/lib/notifications-api";
import { cn, formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

const TYPE_META: Record<
  NotificationType,
  {
    icon: typeof Eye;
    label: string;
    iconClassName: string;
    badgeClassName: string;
  }
> = {
  share_accessed: {
    icon: Eye,
    label: "Truy cập link",
    iconClassName: "border-sky-200 bg-sky-50 text-sky-700",
    badgeClassName: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/80",
  },
  project_created: {
    icon: FolderPlus,
    label: "Project mới",
    iconClassName: "border-violet-200 bg-violet-50 text-violet-700",
    badgeClassName: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/80",
  },
  payment_updated: {
    icon: WalletCards,
    label: "Thanh toán",
    iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    badgeClassName: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInitialNotifications() {
      try {
        const data = await listNotifications({
          offset: 0,
          limit: PAGE_SIZE,
        });

        if (!active) {
          return;
        }

        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        emitUnreadNotificationsCount(data.unreadCount);
        setNextOffset(data.pagination.nextOffset);
        setHasMore(data.pagination.hasMore);
        setError(null);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Không thể tải thông báo",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialNotifications();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleNotificationCreated(event: Event) {
      const customEvent = event as CustomEvent<NotificationCreatedEventDetail>;
      const detail = customEvent.detail;
      if (!detail?.notification) {
        return;
      }

      setNotifications((current) => {
        const exists = current.some(
          (item) => item.id === detail.notification.id,
        );
        if (exists) {
          return current;
        }

        return [detail.notification, ...current];
      });
      setUnreadCount(detail.unreadCount);
      setError(null);
    }

    function handleNotificationRead(event: Event) {
      const customEvent = event as CustomEvent<NotificationReadEventDetail>;
      const detail = customEvent.detail;
      if (!detail?.notificationId) {
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === detail.notificationId
            ? { ...item, readAt: detail.readAt }
            : item,
        ),
      );
      setUnreadCount(detail.unreadCount);
    }

    function handleAllNotificationsRead(event: Event) {
      const customEvent = event as CustomEvent<NotificationsAllReadEventDetail>;
      const detail = customEvent.detail;
      if (!detail?.readAt) {
        return;
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt ?? detail.readAt,
        })),
      );
      setUnreadCount(detail.unreadCount);
    }

    window.addEventListener(
      NOTIFICATION_CREATED_EVENT,
      handleNotificationCreated,
    );
    window.addEventListener(NOTIFICATION_READ_EVENT, handleNotificationRead);
    window.addEventListener(
      NOTIFICATIONS_ALL_READ_EVENT,
      handleAllNotificationsRead,
    );

    return () => {
      window.removeEventListener(
        NOTIFICATION_CREATED_EVENT,
        handleNotificationCreated,
      );
      window.removeEventListener(
        NOTIFICATION_READ_EVENT,
        handleNotificationRead,
      );
      window.removeEventListener(
        NOTIFICATIONS_ALL_READ_EVENT,
        handleAllNotificationsRead,
      );
    };
  }, []);

  async function loadMoreNotifications() {
    try {
      setLoadingMore(true);

      const data = await listNotifications({
        offset: nextOffset,
        limit: PAGE_SIZE,
      });

      setNotifications((current) => [...current, ...data.notifications]);
      setUnreadCount(data.unreadCount);
      emitUnreadNotificationsCount(data.unreadCount);
      setNextOffset(data.pagination.nextOffset);
      setHasMore(data.pagination.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thông báo");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      setUpdatingId(notificationId);
      const updated = await markNotificationAsRead(notificationId);
      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setUnreadCount((count) => {
        const nextCount = Math.max(0, count - 1);
        emitUnreadNotificationsCount(nextCount);
        return nextCount;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể cập nhật thông báo",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
      );
      setUnreadCount(0);
      emitUnreadNotificationsCount(0);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể cập nhật thông báo",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  function getNotificationDestination(notification: AppNotification) {
    if (!notification.projectId) {
      return null;
    }

    if (notification.type === "share_accessed") {
      return `/projects/${notification.projectId}?section=access_logs`;
    }

    if (notification.type === "payment_updated") {
      return `/projects/${notification.projectId}?section=payment`;
    }

    return `/projects/${notification.projectId}`;
  }

  function handleOpenNotification(notification: AppNotification) {
    const destination = getNotificationDestination(notification);
    if (!destination) {
      return;
    }

    if (!notification.readAt && updatingId !== notification.id) {
      void handleMarkAsRead(notification.id);
    }

    router.push(destination);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-6 pt-3 md:px-6 md:py-6">
      <section className="mt-3 md:mt-0">
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.8rem] font-bold leading-tight tracking-[-0.03em] text-foreground md:text-3xl">
              Thông báo
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cập nhật mới nhất về project, thanh toán và lượt xem link share.
            </p>
            {!loading ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:flex-nowrap">
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/8 px-3.5 text-sm font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {unreadCount > 0 ? `${unreadCount} chưa đọc` : "Đã đọc hết"}
                </span>
                <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3.5 text-sm font-medium">
                  <Bell className="h-3.5 w-3.5" />
                  {notifications.length} thông báo
                </span>
                <button
                  type="button"
                  onClick={() => void handleMarkAllAsRead()}
                  disabled={markingAll || unreadCount === 0}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-white px-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 md:ml-0.5"
                >
                  {markingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Đọc tất cả
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground md:text-xl">
              Mới nhất
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hiển thị theo thời gian giống luồng thông báo quen thuộc.
            </p>
          </div>
          {!loading && unreadCount > 0 ? (
            <div className="hidden rounded-full bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary md:inline-flex">
              Có mục mới chưa đọc
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-[28px] border border-border bg-white/90 px-6 py-16 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-border bg-white/90 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary text-muted-foreground">
              <Bell className="h-8 w-8" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">
              Chưa có thông báo nào
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Khi khách mở link share, bạn tạo project hoặc trạng thái thanh
              toán thay đổi, mục này sẽ tự cập nhật.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[26px] border border-border/70 bg-white shadow-[0_18px_40px_-34px_rgba(15,23,42,0.32)]">
            <div className="max-h-[calc(100svh-21rem)] overflow-y-auto divide-y divide-border/70 md:max-h-[calc(100svh-18rem)]">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  updating={updatingId === notification.id}
                  href={getNotificationDestination(notification)}
                  onOpen={handleOpenNotification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>

            {hasMore ? (
              <div className="border-t border-border/70 bg-white px-4 py-3">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => void loadMoreNotifications()}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/20 hover:text-primary disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    {loadingMore ? "Đang tải..." : "Tải thêm thông báo"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function NotificationRow({
  notification,
  updating,
  href,
  onOpen,
  onMarkAsRead,
}: {
  notification: AppNotification;
  updating: boolean;
  href: string | null;
  onOpen: (notification: AppNotification) => void;
  onMarkAsRead: (notificationId: string) => Promise<void>;
}) {
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;
  const isUnread = !notification.readAt;

  return (
    <article
      role={href ? "link" : undefined}
      tabIndex={href ? 0 : undefined}
      onClick={href ? () => onOpen(notification) : undefined}
      onKeyDown={
        href
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen(notification);
              }
            }
          : undefined
      }
      className={cn(
        "relative flex gap-3 px-3.5 py-3 transition-colors md:px-4 md:py-3.5",
        isUnread ? "bg-primary/[0.055]" : "bg-white hover:bg-slate-50/80",
        href ? "cursor-pointer" : "",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-3 left-0 w-1 rounded-r-full",
          isUnread ? "hero-gradient" : "bg-transparent",
        )}
      />

      <div
        className={cn(
          "mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border shadow-sm",
          meta.iconClassName,
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                  meta.badgeClassName,
                )}
              >
                {meta.label}
              </span>
              {isUnread ? (
                <span className="h-2 w-2 rounded-full bg-primary" />
              ) : null}
            </div>

            <p className="mt-1.5 text-sm leading-6 text-foreground md:text-[15px]">
              <span className="font-bold">{notification.title}</span>{" "}
              <span className="text-muted-foreground">
                {notification.message}
              </span>
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
              <span
                className={cn("font-medium", isUnread ? "text-primary" : "")}
              >
                {formatDate(notification.createdAt)}
              </span>
              {notification.projectName ? (
                <span>• {notification.projectName}</span>
              ) : null}
            </div>
          </div>

          {isUnread ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void onMarkAsRead(notification.id);
              }}
              disabled={updating}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary transition-all hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Đọc tất cả"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
