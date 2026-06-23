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
  Pencil,
  X,
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

function ImageSettingsModal({
  currentValue,
  draftValue,
  onDraftChange,
  onClose,
  onConfirm,
  submitting,
}: {
  currentValue: ImageResizeSetting
  draftValue: ImageResizeSetting
  onDraftChange: (value: ImageResizeSetting) => void
  onClose: () => void
  onConfirm: () => Promise<void>
  submitting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />

      <div className="relative z-10 flex max-h-[calc(100svh-7rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-base font-bold">Cấu hình ảnh share</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Chọn độ phân giải preview mặc định cho các project của user này.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-800">
            Ảnh gốc vẫn giữ nguyên; khách chưa thanh toán chỉ thấy ảnh preview.
          </div>

          <div className="grid grid-cols-2 gap-2">
            {IMAGE_RESIZE_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onDraftChange(option.value)}
                disabled={submitting}
                className={`relative rounded-xl border px-3 py-2.5 text-left transition-all disabled:opacity-60 ${
                  draftValue === option.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-white hover:bg-secondary/40'
                }`}
              >
                <span className="block pr-5 text-sm font-semibold">{option.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{option.description}</span>
                <span className={`absolute right-2.5 top-2.5 h-3.5 w-3.5 rounded-full border ${
                  draftValue === option.value ? 'border-primary bg-primary shadow-[inset_0_0_0_3px_white]' : 'border-border'
                }`} />
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Hiện tại: <b className="text-foreground">{formatResizeSetting(currentValue)}</b></span>
            <span className="text-primary">Chọn: <b>{formatResizeSetting(draftValue)}</b></span>
          </div>
        </div>

        <div className="flex gap-3 border-t border-border bg-white p-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary/50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={submitting || draftValue === currentValue}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
        </div>
      </div>
    </div>
  )
}

function EditProfileInfoModal({
  initialName,
  initialPhone,
  email,
  username,
  onClose,
  onSave,
}: {
  initialName: string
  initialPhone: string
  email: string
  username: string
  onClose: () => void
  onSave: (payload: { name: string; phone: string }) => void
}) {
  const [draftName, setDraftName] = useState(initialName)
  const [draftPhone, setDraftPhone] = useState(initialPhone)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSave({
      name: draftName.trim(),
      phone: draftPhone.trim() || DEFAULT_PHONE,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-base font-bold">Sửa thông tin cá nhân</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Cập nhật thông tin hiển thị trên tài khoản.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <Field label="Họ và tên" icon={UserCircle}>
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            />
          </Field>

          <Field label="Số điện thoại" icon={Phone}>
            <input
              value={draftPhone}
              onChange={(event) => setDraftPhone(event.target.value)}
              type="tel"
              className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 rounded-xl bg-secondary/40 p-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="mt-1 truncate font-medium text-foreground">{email}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tên đăng nhập</p>
              <p className="mt-1 truncate font-medium text-foreground">{username}</p>
            </div>
          </div>

          <div className="flex gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary/50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
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
  const [showEditInfoModal, setShowEditInfoModal] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [imageResizeWidth, setImageResizeWidth] = useState<ImageResizeSetting>(
    sessionUser?.imageResizeWidth ?? DEFAULT_IMAGE_RESIZE_WIDTH,
  )
  const [draftImageResizeWidth, setDraftImageResizeWidth] = useState<ImageResizeSetting>(imageResizeWidth)
  const [showImageSettingsModal, setShowImageSettingsModal] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyView, setNotifyView] = useState(true)

  useEffect(() => {
    if (!sessionUser) {
      router.replace(loginPath)
    }
  }, [loginPath, router, sessionUser])

  function handleSaveInfo(payload: { name: string; phone: string }) {
    setName(payload.name || username)
    setPhone(payload.phone || DEFAULT_PHONE)
    setShowEditInfoModal(false)
    setInfoSaved(true)
    setTimeout(() => setInfoSaved(false), 2500)
  }

  function handleLogout() {
    clearSession()
    router.replace(logoutPath)
  }

  async function handleSaveImageSettings(value: ImageResizeSetting) {
    setSavingSettings(true)
    setSettingsError(null)
    setSettingsSaved(false)

    try {
      const user = await updateUserSettings({ imageResizeWidth: value })
      const savedValue = user.imageResizeWidth ?? DEFAULT_IMAGE_RESIZE_WIDTH
      setImageResizeWidth(savedValue)
      setDraftImageResizeWidth(savedValue)
      setShowImageSettingsModal(false)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2500)
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Không thể lưu cấu hình ảnh')
    } finally {
      setSavingSettings(false)
    }
  }

  async function confirmImageSettings() {
    await handleSaveImageSettings(draftImageResizeWidth)
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
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
          <h2 className="text-sm font-semibold">Thông tin cá nhân</h2>
          <button
            type="button"
            onClick={() => setShowEditInfoModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5" /> Sửa
          </button>
        </div>
        <div className="divide-y divide-border/60">
          <InfoRow icon={UserCircle} label="Họ và tên" value={name || username} />
          <InfoRow icon={Phone} label="Số điện thoại" value={phone} />
          <InfoRow icon={Mail} label="Email" value={email} muted />
          <InfoRow icon={UserCircle} label="Tên đăng nhập" value={username} muted />
        </div>
        <div className={`border-t border-border px-4 py-2 text-xs transition-opacity duration-300 ${infoSaved ? 'opacity-100 text-green-600' : 'opacity-0'}`}>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Đã lưu thành công
          </span>
        </div>
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

      {role === 'user' ? (
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

          <button
            type="button"
            onClick={() => {
              setDraftImageResizeWidth(imageResizeWidth)
              setSettingsError(null)
              setSettingsSaved(false)
              setShowImageSettingsModal(true)
            }}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-white hover:ring-2 hover:ring-primary/10"
          >
            <span>
              <span className="block text-sm font-semibold text-foreground">
                {formatResizeSetting(imageResizeWidth)}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Bấm để mở popup cấu hình ảnh share
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

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
      ) : null}

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

      {showImageSettingsModal ? (
        <ImageSettingsModal
          currentValue={imageResizeWidth}
          draftValue={draftImageResizeWidth}
          onDraftChange={setDraftImageResizeWidth}
          onClose={() => setShowImageSettingsModal(false)}
          onConfirm={confirmImageSettings}
          submitting={savingSettings}
        />
      ) : null}

      {showEditInfoModal ? (
        <EditProfileInfoModal
          initialName={name}
          initialPhone={phone}
          email={email}
          username={username}
          onClose={() => setShowEditInfoModal(false)}
          onSave={handleSaveInfo}
        />
      ) : null}
    </div>
  )
}

function InfoRow({
  label,
  value,
  icon: Icon,
  muted = false,
}: {
  label: string
  value: string
  icon: typeof UserCircle
  muted?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-0.5 truncate text-sm font-medium ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>
          {value || 'Chưa cập nhật'}
        </p>
      </div>
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
