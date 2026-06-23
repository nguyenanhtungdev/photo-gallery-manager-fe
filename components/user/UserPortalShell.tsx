'use client'

import { FolderOpen, LayoutDashboard, UserCircle2 } from 'lucide-react'
import { AppLayoutShell } from '@/components/app/AppLayoutShell'
import { SessionGuard } from '@/components/auth/SessionGuard'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/profile', icon: UserCircle2, label: 'Profile' },
]

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Thống kê cá nhân' },
  '/projects': { title: 'Projects', subtitle: 'Quản lý danh sách project' },
  '/profile': { title: 'Profile', subtitle: 'Quản lý thông tin tài khoản' },
}

export function UserPortalShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard loginPath="/login" requiredRole="user" mismatchPath="/admin/dashboard">
      <AppLayoutShell navItems={navItems} pageMeta={PAGE_META} logoutPath="/login" portalLabel="User Portal">
        {children}
      </AppLayoutShell>
    </SessionGuard>
  )
}
