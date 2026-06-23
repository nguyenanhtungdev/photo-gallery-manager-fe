'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserCircle,
  Camera,
  Mail,
  Phone,
  LogOut,
  CheckCircle2,
  Shield,
  ChevronRight,
  KeyRound,
  ImageIcon,
} from 'lucide-react'
import { clearSession, getStoredSession, updateUserSettings } from '@/lib/auth'
import {
  DEFAULT_IMAGE_RESIZE_WIDTH,
  IMAGE_RESIZE_OPTIONS,
  formatResizeSetting,
  type ImageResizeSetting,
} from '@/lib/image-resize'

const DEFAULT_PHONE = 'Chưa cập nhật'

function formatRoleLabel(role?: 'admin' | 'user') {
  return role === 'admin' ? 'Quản trị viên' : 'Người dùng'
}

function getInitialSessionUser() {
  return getStoredSession()?.user ?? null
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={value}
      className={`relative flex-shrink-0 h-6 w-10 rounded-full transition-colors duration-200 ${value ? 'bg-primary' : 'bg-border'}`}
    >
      <span
        className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}

export function ProfilePage({
  loginPath,
  logoutPath,
  changePasswordPath,
}: {
  loginPath: string
  logoutPath: string
  changePasswordPath: string
}) {
  const router = useRouter()
  const [sessionUser] = useState(getInitialSessionUser)
  const [name, setName] = useState(sessionUser?.name || sessionUser?.username || '')
  const [email] = useState(sessionUser?.email || '')
  const [username] = useState(sessionUser?.username || '')
  const [phone, setPhone] = useState(DEFAULT_PHONE)
  const [role] = useState<'admin' | 'user'>(sessionUser?.role ?? 'user')
  const [joinedAt] = useState(sessionUser ? formatJoinDate(sessionUser.createdAt) : '')
  const [infoSaved, setInfoSaved] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [imageResizeWidth, setImageResizeWidth] = useState<ImageResizeSetting>(
    sessionUser?.imageResizeWidth ?? DEFAULT_IMAGE_RESIZE_WIDTH,
  )
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyView, setNotifyView] = useState(true)

  useEffect(() => {
    if (!sessionUser) {
      router.replace(loginPath)
    }
  }, [loginPath, router, sessionUser])

  function handleSaveInfo(event: React.FormEvent) {
    event.preventDefault()
    setInfoSaved(true)
    setTimeout(() => setInfoSaved(false), 2500)
  }

  function handleLogout() {
    clearSession()
    router.replace(logoutPath)
  }

  async function handleSaveImageSettings(value: ImageResizeSetting) {
    setImageResizeWidth(value)
    setSavingSettings(true)
    setSettingsError(null)
    setSettingsSaved(false)

    try {
      const user = await updateUserSettings({ imageResizeWidth: value })
      setImageResizeWidth(user.imageResizeWidth ?? DEFAULT_IMAGE_RESIZE_WIDTH)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2500)
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Không thể lưu cấu hình ảnh')
    } finally {
      setSavingSettings(false)
    }
  }

  const initials = (name || username || 'AD')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:space-y-5 md:p-6">
      <div className="hidden md:block">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold">
          <span className="hero-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm">
            <UserCircle className="h-4 w-4 text-white" />
          </span>
          Profile
        </h1>
        <p className="mt-1 ml-11 text-sm text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="hero-gradient flex h-14 w-14 items-center justify-center rounded-2xl shadow-md">
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
            <button
              type="button"
              className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow transition-colors hover:bg-primary/90"
              title="Đổi ảnh đại diện"
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold">{name || username}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Shield className="h-2.5 w-2.5" /> {formatRoleLabel(role)}
              </span>
              <span className="text-[10px] text-muted-foreground">Từ {joinedAt || 'Vừa tạo'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border bg-secondary/30 px-4 py-3">
          <h2 className="text-sm font-semibold">Thông tin cá nhân</h2>
        </div>
        <form onSubmit={handleSaveInfo} className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Họ và tên" icon={UserCircle}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
              />
            </Field>

            <Field label="Số điện thoại" icon={Phone}>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                type="tel"
                className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
              />
            </Field>

            <Field label="Email" icon={Mail}>
              <input
                value={email}
                readOnly
                className="w-full cursor-default rounded-xl border border-border bg-secondary/20 py-2.5 pl-9 pr-3 text-sm text-muted-foreground"
              />
            </Field>

            <Field label="Tên đăng nhập" icon={UserCircle}>
              <input
                value={username}
                readOnly
                className="w-full cursor-default rounded-xl border border-border bg-secondary/20 py-2.5 pl-9 pr-3 text-sm text-muted-foreground"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className={`flex items-center gap-1.5 text-xs transition-opacity duration-300 ${infoSaved ? 'opacity-100 text-green-600' : 'opacity-0'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Đã lưu thành công
            </div>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border bg-secondary/30 px-4 py-3">
          <h2 className="text-sm font-semibold">Bảo mật</h2>
        </div>
        <Link
          href={changePasswordPath}
          className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-secondary/30 active:bg-secondary/50 group"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
              <KeyRound className="h-4 w-4 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold">Đổi mật khẩu</p>
              <p className="text-xs text-muted-foreground">Cập nhật mật khẩu đăng nhập</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border bg-secondary/30 px-4 py-3">
          <h2 className="text-sm font-semibold">Cấu hình ảnh</h2>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ImageIcon className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Độ phân giải ảnh share mặc định</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Khách chưa thanh toán sẽ thấy ảnh preview {formatResizeSetting(imageResizeWidth)}, trừ project có cấu hình riêng. Ảnh gốc vẫn được giữ nguyên.
              </p>
            </div>
          </div>

          <select
            value={imageResizeWidth ?? 'original'}
            onChange={(event) => {
              const value = event.target.value
              void handleSaveImageSettings(value === 'original' ? null : Number(value) as ImageResizeSetting)
            }}
            disabled={savingSettings}
            className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
          >
            {IMAGE_RESIZE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value ?? 'original'}>
                {option.label} — {option.description}
              </option>
            ))}
          </select>

          <div className="min-h-4 text-xs">
            {settingsError ? (
              <span className="text-red-500">{settingsError}</span>
            ) : settingsSaved ? (
              <span className="inline-flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Đã lưu cấu hình ảnh
              </span>
            ) : (
              <span className="text-muted-foreground">
                Gợi ý: 720px đủ xem duyệt; 480px hoặc 360px phù hợp gallery nhiều ảnh/chưa thanh toán.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border bg-secondary/30 px-4 py-3">
          <h2 className="text-sm font-semibold">Thông báo</h2>
        </div>
        <div className="divide-y divide-border/60">
          {[
            { label: 'Email khi có lượt xem mới', sub: 'Nhận email khi khách xem gallery', value: notifyEmail, set: () => setNotifyEmail((v) => !v) },
            { label: 'Thông báo thanh toán', sub: 'Nhận thông báo khi trạng thái thay đổi', value: notifyView, set: () => setNotifyView((v) => !v) },
          ].map(({ label, sub, value, set }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
              </div>
              <Toggle value={value} onChange={set} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="group flex w-full items-center justify-between rounded-2xl border border-border bg-white px-4 py-3.5 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 transition-colors group-hover:bg-red-100">
            <LogOut className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-red-500">Đăng xuất</p>
            <p className="text-xs text-muted-foreground">Kết thúc phiên làm việc</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-red-400" />
      </button>

      <div className="h-2" />
    </div>
  )
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: typeof UserCircle
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  )
}

function formatJoinDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date)
}
