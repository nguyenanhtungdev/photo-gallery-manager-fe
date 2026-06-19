'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Eye, EyeOff, Lock, User, Sparkles } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    if (username === 'admin' && password === 'admin123') {
      router.push('/admin/dashboard')
    } else {
      setError('Sai tên đăng nhập hoặc mật khẩu')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-svh flex flex-col">
      {/* Top hero strip */}
      <div className="hero-gradient px-6 pt-14 pb-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Photo Gallery</h1>
        <p className="text-white/75 text-sm mt-1">Hệ thống quản lý ảnh chuyên nghiệp</p>
      </div>

      {/* Card pulled up over hero */}
      <div className="flex-1 -mt-10 bg-[hsl(210,40%,98%)] rounded-t-3xl px-5 pt-8 pb-10">
        <div className="max-w-sm mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-1">Đăng nhập</h2>
          <p className="text-sm text-muted-foreground mb-6">Nhập thông tin tài khoản quản trị</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground" htmlFor="username">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground" htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-border rounded-xl pl-10 pr-12 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Demo hint */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-primary">
                Demo: <span className="font-mono font-semibold">admin</span> / <span className="font-mono font-semibold">admin123</span>
              </p>
            </div>

            {/* Submit */}
            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="w-full hero-gradient text-white font-semibold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm glow-primary text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Photo Gallery Manager © 2026
        </p>
      </div>
    </div>
  )
}
