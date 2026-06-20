'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck,
} from 'lucide-react'

/* ─── Password strength ───────────────────────────────────── */
function calcStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9!@#$%^&*]/.test(pw)) score++
  if (score === 1) return { level: 1, label: 'Yếu',    color: 'bg-red-400' }
  if (score === 2) return { level: 2, label: 'Trung bình', color: 'bg-amber-400' }
  return             { level: 3, label: 'Mạnh',   color: 'bg-green-500' }
}

/* ─── Single password field ───────────────────────────────── */
function PwField({
  id, label, placeholder, value, onChange, hint,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full pl-10 pr-10 py-3 text-sm rounded-2xl border border-border bg-secondary/50 outline-none transition-all focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground/50"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────── */
export default function ChangePasswordPage() {
  const router = useRouter()
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [error,      setError]      = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)

  const strength = calcStrength(newPw)

  function validate() {
    if (!currentPw)           return 'Vui lòng nhập mật khẩu hiện tại'
    if (newPw.length < 6)     return 'Mật khẩu mới cần ít nhất 6 ký tự'
    if (newPw !== confirmPw)  return 'Mật khẩu xác nhận không khớp'
    if (newPw === currentPw)  return 'Mật khẩu mới phải khác mật khẩu hiện tại'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setError(null)
    setSubmitting(true)
    // Simulate API call
    await new Promise((r) => setTimeout(r, 900))
    setSubmitting(false)
    setSuccess(true)
    setTimeout(() => router.replace('/admin/profile'), 1800)
  }

  // ── Success screen ──
  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold">Đổi mật khẩu thành công!</h2>
        <p className="mt-2 text-sm text-muted-foreground">Đang chuyển về trang Profile...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-5 p-4 md:p-6">

      {/* ── Back + Title ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-white shadow-sm transition-all hover:bg-secondary active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold leading-tight">Đổi mật khẩu</h1>
          <p className="text-xs text-muted-foreground">Cập nhật mật khẩu đăng nhập của bạn</p>
        </div>
      </div>

      {/* ── Security notice ── */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary/80">
          Mật khẩu mạnh nên có ít nhất <strong>8 ký tự</strong>, bao gồm chữ hoa, chữ số hoặc ký tự đặc biệt.
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 p-5">

          <PwField
            id="pw-current"
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPw}
            onChange={(v) => { setCurrentPw(v); setError(null) }}
          />

          <div className="border-t border-border/50" />

          <PwField
            id="pw-new"
            label="Mật khẩu mới"
            placeholder="Tối thiểu 6 ký tự"
            value={newPw}
            onChange={(v) => { setNewPw(v); setError(null) }}
          />

          {/* Strength meter */}
          {newPw && (
            <div className="space-y-1.5 -mt-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((seg) => (
                  <div
                    key={seg}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      strength.level >= seg ? strength.color : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${
                strength.level === 1 ? 'text-red-500'
                : strength.level === 2 ? 'text-amber-500'
                : 'text-green-600'
              }`}>
                {strength.label}
              </p>
            </div>
          )}

          <PwField
            id="pw-confirm"
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPw}
            onChange={(v) => { setConfirmPw(v); setError(null) }}
          />

          {/* Match indicator */}
          {confirmPw && newPw && (
            <p className={`-mt-1 flex items-center gap-1.5 text-xs font-medium ${
              newPw === confirmPw ? 'text-green-600' : 'text-red-500'
            }`}>
              {newPw === confirmPw
                ? <><CheckCircle2 className="h-3.5 w-3.5" /> Mật khẩu khớp</>
                : '✕ Mật khẩu chưa khớp'
              }
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-2xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 active:scale-[0.98]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !currentPw || !newPw || !confirmPw}
              className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang lưu...
                </span>
              ) : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
