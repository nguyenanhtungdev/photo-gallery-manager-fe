import { ProfilePage } from '@/components/profile/ProfilePage'

export default function UserProfilePage() {
  return (
    <ProfilePage
      loginPath="/login"
      logoutPath="/login"
      changePasswordPath="/profile/change-password"
    />
  )
}
