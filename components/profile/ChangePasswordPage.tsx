'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { confirmPasswordChange, requestPasswordChange } from '@/lib/auth'

function calcStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9!@#$%^&*]/.test(pw)) score++
  if (score === 1) return { level: 1, label: 'Yếu', color: 'bg-red-400' }
  if (score === 2) return { level: 2, label: 'Trung bình', color: 'bg-amber-400' }
  return { level: 3, label: 'Mạnh', color: 'bg-green-500' }
}

function PwField({
  id,
  label,
  placeholder,
  value,
  onChange,
  hint,
  numeric = false,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  hint?: string
  numeric?: boolean
}) {
  const [show, setShow] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={numeric || show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode={numeric ? 'numeric' : undefined}
          maxLength={numeric ? 6 : undefined}
          autoComplete="new-password"
          className={`w-full rounded-2xl border border-border bg-secondary/50 py-3 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 ${numeric ? 'text-center text-base font-semibold tracking-[0.5em]' : ''}`}
        />
        {!numeric && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function ChangePasswordPage({
  backPath,
  redirectPath,
}: {
  backPath: string
  redirectPath: string
}) {
  const router = useRouter()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [debugCode, setDebugCode] = useState('')
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = calcStrength(newPw)

  function validate() {
    if (!currentPw) return 'Vui lòng nhập mật khẩu hiện tại'
    if (newPw.length < 6) return 'Mật khẩu mới cần ít nhất 6 ký tự'
    if (newPw !== confirmPw) return 'Mật khẩu xác nhận không khớp'
    if (newPw === currentPw) return 'Mật khẩu mới phải khác mật khẩu hiện tại'
    return null
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      if (step === 'form') {
        const data = await requestPasswordChange({
          currentPassword: currentPw,
          newPassword: newPw,
        })
        setVerificationId(data.verificationId)
        setVerificationCode('')
        setDebugCode(data.debugCode ?? '')
        setStep('verify')
        return
      }

      if (!verificationId) {
        throw new Error('Vui lòng gửi mã xác minh trước')
      }

      await confirmPasswordChange({
        verificationId,
        code: verificationCode,
      })
      setSuccess(true)
      setTimeout(() => router.replace(redirectPath), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu')
    } finally {
      setSubmitting(false)
    }
  }

  async function resendCode() {
    try {
      setError(null)
      setSubmitting(true)
      const data = await requestPasswordChange({
        currentPassword: currentPw,
        newPassword: newPw,
      })
      setVerificationId(data.verificationId)
      setVerificationCode('')
      setDebugCode(data.debugCode ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại mã')
    } finally {
      setSubmitting(false)
    }
  }

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
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(backPath)}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-white shadow-sm transition-all hover:bg-secondary active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold leading-tight">Đổi mật khẩu</h1>
          <p className="text-xs text-muted-foreground">Cập nhật mật khẩu đăng nhập của bạn</p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary/80">
          Mật khẩu mạnh nên có ít nhất <strong>8 ký tự</strong>, bao gồm chữ hoa, chữ số hoặc ký tự đặc biệt.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <PwField
            id="pw-current"
            label="Mật khẩu hiện tại"
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPw}
            onChange={(value) => { setCurrentPw(value); setError(null) }}
          />

          <div className="border-t border-border/50" />

          <PwField
            id="pw-new"
            label="Mật khẩu mới"
            placeholder="Tối thiểu 6 ký tự"
            value={newPw}
            onChange={(value) => { setNewPw(value); setError(null) }}
          />

          {newPw && (
            <div className="space-y-1.5 -mt-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((segment) => (
                  <div
                    key={segment}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.level >= segment ? strength.color : 'bg-border'}`}
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
            onChange={(value) => { setConfirmPw(value); setError(null) }}
          />

          {confirmPw && newPw && (
            <p className={`-mt-1 flex items-center gap-1.5 text-xs font-medium ${newPw === confirmPw ? 'text-green-600' : 'text-red-500'}`}>
              {newPw === confirmPw
                ? <><CheckCircle2 className="h-3.5 w-3.5" /> Mật khẩu khớp</>
                : '✕ Mật khẩu chưa khớp'}
            </p>
          )}

          {step === 'verify' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Mã xác minh đã được gửi đến email của bạn</p>
                  <p className="text-xs text-emerald-700/80">
                    Nhập 6 chữ số để hoàn tất đổi mật khẩu.
                  </p>
                  {debugCode && (
                    <p className="text-xs font-semibold text-emerald-800">Mã dev: {debugCode}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <PwField
              id="pw-code"
              label="Mã xác minh"
              placeholder="Nhập 6 chữ số"
              value={verificationCode}
              onChange={(value) => { setVerificationCode(value.replace(/\D/g, '').slice(0, 6)); setError(null) }}
              hint="Mã sẽ hết hạn sau 10 phút"
              numeric
            />
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.push(backPath)}
              className="flex-1 rounded-2xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 active:scale-[0.98]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || (!currentPw || !newPw || !confirmPw) || (step === 'verify' && verificationCode.length !== 6)}
              className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : step === 'form' ? 'Gửi mã xác minh' : 'Xác minh & lưu'}
            </button>
          </div>

          {step === 'verify' && (
            <button
              type="button"
              onClick={resendCode}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Gửi lại mã
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
