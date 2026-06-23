'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getDefaultRouteForRole, getStoredSession } from '@/lib/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const session = getStoredSession()
    router.replace(session ? getDefaultRouteForRole(session.user.role) : '/login')
  }, [router])

  return (
    <div className="flex min-h-svh items-center justify-center px-6">
      <div className="rounded-3xl border border-border bg-white px-6 py-5 text-center shadow-sm">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-sm font-medium text-foreground">Đang chuyển hướng...</p>
      </div>
    </div>
  )
}
