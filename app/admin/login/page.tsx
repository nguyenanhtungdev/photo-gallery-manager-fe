import { LoginPage } from '@/components/auth/LoginPage'

export default function AdminLoginPage() {
  return <LoginPage role="admin" showRegisterLink={false} />
}
