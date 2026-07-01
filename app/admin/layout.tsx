'use client'

import { usePathname } from 'next/navigation'
import { FolderOpen, LayoutDashboard, Settings, Users } from 'lucide-react'
import { AppLayoutShell } from '@/components/app/AppLayoutShell'
import { AuthGuard } from '@/components/auth/AuthGuard'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/admin/projects',  icon: FolderOpen,       label: 'Dự án' },
  { href: '/admin/users',     icon: Users,            label: 'Người dùng' },
  { href: '/admin/settings',  icon: Settings,         label: 'Cấu hình' },
]

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/admin/dashboard': { title: 'Tổng quan', subtitle: 'Tổng quan hệ thống' },
  '/admin/projects':  { title: 'Dự án',  subtitle: 'Quản lý danh sách dự án' },
  '/admin/users':     { title: 'Người dùng', subtitle: 'Quản lý tài khoản người dùng' },
  '/admin/settings':  { title: 'Cấu hình', subtitle: 'Cấu hình hệ thống' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login' || pathname === '/admin/register') {
    return <>{children}</>
  }

  return (
    <AuthGuard>
      <AppLayoutShell navItems={navItems} pageMeta={PAGE_META} logoutPath="/admin/login" portalLabel="Cổng quản trị">
        {children}
      </AppLayoutShell>
    </AuthGuard>
  )
}
