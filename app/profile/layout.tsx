import { UserPortalShell } from '@/components/user/UserPortalShell'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <UserPortalShell>{children}</UserPortalShell>
}
