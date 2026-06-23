import { ProfilePage } from '@/components/profile/ProfilePage'

export default function AdminProfilePage() {
  return (
    <ProfilePage
      loginPath="/admin/login"
      logoutPath="/admin/login"
      changePasswordPath="/admin/profile/change-password"
    />
  )
}
