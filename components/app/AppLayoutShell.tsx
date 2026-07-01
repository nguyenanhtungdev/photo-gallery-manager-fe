'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { Camera, LogOut } from 'lucide-react'
import { clearSession } from '@/lib/auth'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  icon: LucideIcon
  label: string
}

type PageMeta = {
  title: string
  subtitle: string
}

export function AppLayoutShell({
  children,
  navItems,
  pageMeta,
  logoutPath,
  portalLabel = 'Cổng thông tin',
  notificationBadgeCount = 0,
}: {
  children: React.ReactNode
  navItems: NavItem[]
  pageMeta: Record<string, PageMeta>
  logoutPath: string
  portalLabel?: string
  notificationBadgeCount?: number
}) {
  const pathname = usePathname()
  const router = useRouter()

  const metaKey = Object.keys(pageMeta).find((key) => pathname.startsWith(key)) ?? Object.keys(pageMeta)[0]
  const meta = pageMeta[metaKey]

  function handleLogout() {
    clearSession()
    router.replace(logoutPath)
  }

  const displayUnreadCount = notificationBadgeCount > 99 ? '99+' : notificationBadgeCount

  return (
    <div className="flex h-svh overflow-hidden bg-[hsl(210,40%,98%)]">
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-border bg-white md:flex">
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <div className="hero-gradient flex h-9 w-9 items-center justify-center rounded-xl shadow-sm shadow-primary/30">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-foreground">Thư viện ảnh</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{portalLabel}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            const showUnreadBadge = href === '/notifications' && notificationBadgeCount > 0
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <div className="relative flex h-4 w-4 flex-shrink-0 items-center justify-center">
                  <Icon className="h-4 w-4" />
                  {showUnreadBadge ? (
                    <span className="absolute -right-3 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-5 text-white shadow-sm shadow-red-500/30">
                      {displayUnreadCount}
                    </span>
                  ) : null}
                </div>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">


        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      <nav className="bottom-nav-pad fixed right-0 bottom-0 left-0 z-50 border-t border-border/60 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden">
        <div className="flex px-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            const showUnreadBadge = href === '/notifications' && notificationBadgeCount > 0
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-all duration-200',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <div
                  className={cn(
                    'relative flex h-7 w-11 items-center justify-center rounded-2xl transition-all duration-200',
                    active ? 'scale-105 bg-primary shadow-sm shadow-primary/40' : 'hover:bg-secondary/80',
                  )}
                >
                  <Icon className={cn('h-4.5 w-4.5 transition-colors', active ? 'text-white' : '')} />
                  {showUnreadBadge ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-4.5 text-white shadow-sm shadow-red-500/30">
                      {displayUnreadCount}
                    </span>
                  ) : null}
                </div>
                <span className={active ? 'text-primary' : ''}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
