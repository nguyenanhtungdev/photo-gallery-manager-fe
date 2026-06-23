import { UserPortalShell } from '@/components/user/UserPortalShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <UserPortalShell>{children}</UserPortalShell>
}
