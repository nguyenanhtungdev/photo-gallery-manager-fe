'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Eye, EyeOff, Lock, Mail, X, AlertCircle, CheckCircle2, UserPlus, ImageIcon, Layers, ShieldCheck } from 'lucide-react'
import { getDefaultRouteForRole, getStoredSession, register, saveSession } from '@/lib/auth'

function Toast({ type, message, onClose }: { type: 'error' | 'success'; message: string; onClose: () => void }) {
  const isErr = type === 'error'
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-xl max-w-[calc(100vw-2rem)] w-full sm:max-w-sm border animate-[fadeSlideDown_0.25s_ease-out] ${isErr ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
      <span className={`mt-0.5 shrink-0 ${isErr ? 'text-red-500' : 'text-emerald-500'}`}>
        {isErr ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button onClick={onClose} className={`shrink-0 p-1 rounded-lg transition-colors ${isErr ? 'hover:bg-red-100' : 'hover:bg-emerald-100'}`} aria-label="Đóng">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function FeaturePill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium w-fit">
      <Icon className="w-4 h-4 shrink-0" />{label}
    </div>
  )
}

function PasswordField({ id, label, value, onChange, showPass, onToggle, autoComplete = 'new-password' }:
  { id: string; label: string; value: string; onChange: (v: string) => void; showPass: boolean; onToggle: () => void; autoComplete?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative group">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
        <input id={id} type={showPass ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••" required minLength={6} autoComplete={autoComplete}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 hover:border-slate-300" />
        <button type="button" onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function AdminRegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  useEffect(() => {
    const session = getStoredSession()
    if (session) {
      router.replace(getDefaultRouteForRole(session.user.role))
    }
  }, [router])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setToast(null)
    if (!username.trim()) { setToast({ type: 'error', message: 'Vui lòng nhập địa chỉ email.' }); return }
    if (password.length < 6) { setToast({ type: 'error', message: 'Mật khẩu phải có ít nhất 6 ký tự.' }); return }
    if (password !== confirmPassword) { setToast({ type: 'error', message: 'Mật khẩu xác nhận không khớp.' }); return }
    startTransition(async () => {
      try {
        const session = await register({ username, password })
        saveSession(session)
        setToast({ type: 'success', message: 'Tạo tài khoản thành công! Đang chuyển hướng...' })
        setTimeout(() => router.replace(getDefaultRouteForRole(session.user.role)), 800)
      } catch (err) {
        setToast({ type: 'error', message: err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.' })
      }
    })
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthMeta = [null,
    { label: 'Yếu', bar: 'bg-red-500', text: 'text-red-500' },
    { label: 'Trung bình', bar: 'bg-amber-500', text: 'text-amber-500' },
    { label: 'Mạnh', bar: 'bg-emerald-500', text: 'text-emerald-500' },
  ][strength]

  return (
    <>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <div className="min-h-screen flex flex-col lg:flex-row">

        {/* LEFT */}
        <div className="relative hidden lg:flex lg:w-[48%] xl:w-[50%] flex-col justify-between overflow-hidden p-12 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-12 w-80 h-80 rounded-full bg-blue-300/20 blur-2xl" />
          </div>
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Photo Gallery</span>
          </div>

          <div className="relative z-10 space-y-7 my-auto">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                Tạo tài khoản mới
              </div>
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] tracking-tight drop-shadow">
                Bắt đầu hành trình<br />
                <span className="text-yellow-200">của bạn</span>
              </h1>
              <p className="text-white/75 text-base leading-relaxed max-w-xs">
                Tạo tài khoản quản trị để kiểm soát toàn bộ thư viện ảnh của bạn.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <FeaturePill icon={ImageIcon} label="Thư viện ảnh thông minh" />
              <FeaturePill icon={Layers} label="Quản lý album & danh mục" />
              <FeaturePill icon={ShieldCheck} label="Bảo mật & phân quyền" />
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2.5">
            {['from-white/30 to-white/10', 'from-yellow-200/50 to-amber-300/30', 'from-pink-200/40 to-rose-300/20', 'from-sky-200/40 to-blue-300/20', 'from-white/20 to-white/5', 'from-purple-200/40 to-violet-300/20'].map((grad, i) => (
              <div key={i} className={`h-16 rounded-xl bg-gradient-to-br ${grad} border border-white/20 hover:border-white/40 hover:scale-[1.03] transition-all duration-300`} />
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white overflow-y-auto">
          <div className="w-full max-w-[380px] py-4">

            <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-800 font-bold text-base">Photo Gallery</span>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Tạo tài khoản</h2>
              <p className="text-slate-500 text-sm">Dùng email làm tên đăng nhập</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                  <input id="reg-email" type="email" autoComplete="email" inputMode="email" value={username}
                    onChange={(e) => setUsername(e.target.value)} placeholder="admin@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 hover:border-slate-300" />
                </div>
              </div>

              <PasswordField id="reg-password" label="Mật khẩu" value={password} onChange={setPassword} showPass={showPass} onToggle={() => setShowPass(v => !v)} />

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="flex items-center gap-2 -mt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? (strengthMeta?.bar ?? 'bg-slate-300') : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${strengthMeta?.text}`}>{strengthMeta?.label}</span>
                </div>
              )}

              <PasswordField id="reg-confirm-password" label="Xác nhận mật khẩu" value={confirmPassword} onChange={setConfirmPassword} showPass={showConfirmPass} onToggle={() => setShowConfirmPass(v => !v)} />

              {confirmPassword.length > 0 && (
                <p className={`flex items-center gap-1.5 text-xs font-medium -mt-1 ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                  {password === confirmPassword
                    ? <><CheckCircle2 className="w-3.5 h-3.5" />Mật khẩu khớp</>
                    : <><AlertCircle className="w-3.5 h-3.5" />Mật khẩu chưa khớp</>}
                </p>
              )}

              <button id="btn-register" type="submit" disabled={isPending}
                className="w-full mt-1 rounded-xl py-3.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-violet-200 hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                <span className="flex items-center justify-center gap-2">
                  {isPending
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang tạo tài khoản...</>
                    : <><UserPlus className="w-4 h-4" />Tạo tài khoản</>}
                </span>
              </button>
            </form>

            <div className="relative flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">hoặc</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-500">
              Đã có tài khoản?{' '}
              <Link href="/admin/login" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors underline underline-offset-2 decoration-violet-300">
                Đăng nhập ngay
              </Link>
            </p>
            <p className="text-center text-xs text-slate-400 mt-6">Photo Gallery Manager © 2026</p>
          </div>
        </div>
      </div>
    </>
  )
}
