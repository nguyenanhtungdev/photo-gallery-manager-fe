'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearSession, getStoredSession } from '@/lib/auth'

export function SessionGuard({
  children,
  loginPath = '/login',
  requiredRole,
  mismatchPath,
}: {
  children: React.ReactNode
  loginPath?: string
  requiredRole?: 'admin' | 'user'
  mismatchPath?: string
}) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true

    function verifySession() {
      const session = getStoredSession()
      if (!session) {
        router.replace(loginPath)
        return
      }

      if (requiredRole && session.user.role !== requiredRole) {
        clearSession()
        router.replace(mismatchPath ?? loginPath)
        return
      }

      if (!active) {
        return
      }

      setChecking(false)
    }

    verifySession()

    return () => {
      active = false
    }
  }, [loginPath, mismatchPath, requiredRole, router])

  if (checking) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
        <div className="rounded-3xl border border-border bg-white px-6 py-5 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm font-medium text-foreground">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
