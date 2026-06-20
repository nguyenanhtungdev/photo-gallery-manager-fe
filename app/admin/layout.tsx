'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Camera, LayoutDashboard, FolderOpen, ScrollText, UserCircle } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/projects',  icon: FolderOpen,       label: 'Projects' },
  { href: '/admin/logs',      icon: ScrollText,       label: 'Logs' },
  { href: '/admin/profile',   icon: UserCircle,       label: 'Profile' },
]

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/admin/dashboard': { title: 'Dashboard',    subtitle: 'Tổng quan hoạt động của bạn' },
  '/admin/projects':  { title: 'Projects',     subtitle: 'Quản lý các dự án ảnh' },
  '/admin/logs':      { title: 'Access Logs',  subtitle: 'Theo dõi lượt truy cập gallery' },
  '/admin/profile':   { title: 'Profile',      subtitle: 'Thông tin tài khoản của bạn' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login' || pathname === '/admin/register') return <>{children}</>

  // Resolve current page meta (match prefix for nested routes)
  const metaKey = Object.keys(PAGE_META).find((k) => pathname.startsWith(k)) ?? '/admin/dashboard'
  const meta = PAGE_META[metaKey]

  return (
    <AuthGuard>
      <div className="flex h-svh bg-[hsl(210,40%,98%)] overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-border flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl hero-gradient flex items-center justify-center shadow-sm shadow-primary/30">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground leading-none">Photo Gallery</p>
            <p className="text-xs text-muted-foreground mt-0.5">Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Mobile gradient header ── */}
        <header
          className="md:hidden flex-shrink-0 px-4 pt-6 pb-5 rounded-b-3xl"
          style={{
            background: 'linear-gradient(135deg, hsl(221,83%,53%) 0%, hsl(199,89%,48%) 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-tight">{meta.title}</p>
              <p className="text-white/70 text-xs mt-0.5">{meta.subtitle}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border/60 bottom-nav-pad shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex px-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-all duration-200',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'w-11 h-7 rounded-2xl flex items-center justify-center transition-all duration-200',
                  active ? 'bg-primary shadow-sm shadow-primary/40 scale-105' : 'hover:bg-secondary/80'
                )}>
                  <Icon className={cn('w-4.5 h-4.5 transition-colors', active ? 'text-white' : '')} />
                </div>
                <span className={active ? 'text-primary' : ''}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      </div>
    </AuthGuard>
  )
}
