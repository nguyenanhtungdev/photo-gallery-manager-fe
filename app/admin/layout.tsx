'use client'

import { usePathname } from 'next/navigation'
import { FolderOpen, LayoutDashboard, Users } from 'lucide-react'
import { AppLayoutShell } from '@/components/app/AppLayoutShell'
import { AuthGuard } from '@/components/auth/AuthGuard'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/projects',  icon: FolderOpen,       label: 'Projects' },
  { href: '/admin/users',     icon: Users,            label: 'Users' },
]

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/admin/dashboard': { title: 'Dashboard', subtitle: 'Tổng quan hệ thống' },
  '/admin/projects':  { title: 'Projects',  subtitle: 'Quản lý danh sách project' },
  '/admin/users':     { title: 'Users',     subtitle: 'Quản lý tài khoản người dùng' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/admin/login' || pathname === '/admin/register') {
    return <>{children}</>
  }

  return (
    <AuthGuard>
      <AppLayoutShell navItems={navItems} pageMeta={PAGE_META} logoutPath="/admin/login" portalLabel="Admin Portal">
        {children}
      </AppLayoutShell>
    </AuthGuard>
  )
}
