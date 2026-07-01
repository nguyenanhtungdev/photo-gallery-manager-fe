'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
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
  Move,
  Palette,
  Pencil,
  Type,
  X,
  Loader2,
} from 'lucide-react'
import {
  clearSession,
  createAvatarUploadUrl,
  fetchCurrentUser,
  getStoredSession,
  updateUserSettings,
  uploadFileToPresignedUrl,
} from '@/lib/auth'
import {
  DEFAULT_IMAGE_RESIZE_WIDTH,
  IMAGE_RESIZE_OPTIONS,
  formatResizeSetting,
  type ImageResizeSetting,
} from '@/lib/image-resize'
import WatermarkCanvas from '@/components/gallery/WatermarkCanvas'
import {
  DEFAULT_WATERMARK_SETTINGS,
  WATERMARK_POSITION_OPTIONS,
  WATERMARK_STYLE_OPTIONS,
  normalizeWatermarkSettings,
  type WatermarkSettings,
} from '@/lib/watermark-settings'

const WATERMARK_SAMPLE_IMAGE_SRC = '/image/watermark-sample.png'

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

function WatermarkSettingsModal({
  currentValue,
  draftValue,
  onDraftChange,
  onClose,
  onConfirm,
  submitting,
}: {
  currentValue: WatermarkSettings
  draftValue: WatermarkSettings
  onDraftChange: (value: WatermarkSettings) => void
  onClose: () => void
  onConfirm: () => Promise<void>
  submitting: boolean
}) {
  const [sampleImageFailed, setSampleImageFailed] = useState(false)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const currentWatermark = normalizeWatermarkSettings(currentValue)
  const draftWatermark = normalizeWatermarkSettings(draftValue)
  const selectedPosition = WATERMARK_POSITION_OPTIONS.find(
    (option) => option.value === currentWatermark.position,
  )

  function updateDraft(patch: Partial<WatermarkSettings>) {
    onDraftChange(normalizeWatermarkSettings({ ...draftWatermark, ...patch }))
  }

  function moveCustomWatermark(clientX: number, clientY: number) {
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return

    updateDraft({
      position: 'custom',
      customX: (clientX - rect.left) / rect.width,
      customY: (clientY - rect.top) / rect.height,
    })
  }

  function handleCustomWatermarkPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    moveCustomWatermark(event.clientX, event.clientY)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />

      <div className="relative z-10 flex max-h-[calc(100svh-7rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-base font-bold">Cấu hình Watermark</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Áp dụng cho gallery khách khi project chưa thanh toán.
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

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div
            ref={previewRef}
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[linear-gradient(135deg,#bae6fd_0%,#f8fafc_42%,#16a34a_43%,#166534_100%)]"
          >
            {!sampleImageFailed ? (
              // Watermark sample is a static preview asset, not user-uploaded project media.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={WATERMARK_SAMPLE_IMAGE_SRC}
                alt="Ảnh mẫu watermark"
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => setSampleImageFailed(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(255,255,255,0.9)_0_8%,transparent_9%),linear-gradient(120deg,transparent_0_52%,rgba(15,23,42,0.22)_53%_100%)]" />
            )}
            <WatermarkCanvas mode="cover" settings={draftWatermark} />
            <button
              type="button"
              title="Kéo vị trí Watermark"
              onPointerDown={handleCustomWatermarkPointerDown}
              onPointerMove={(event) => {
                if (event.buttons !== 1 || !event.currentTarget.hasPointerCapture(event.pointerId)) {
                  return
                }
                moveCustomWatermark(event.clientX, event.clientY)
              }}
              className={`absolute z-20 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-black/55 text-white shadow-lg backdrop-blur-sm transition-opacity ${
                draftWatermark.position === 'custom' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                left: `${draftWatermark.customX * 100}%`,
                top: `${draftWatermark.customY * 100}%`,
                touchAction: 'none',
              }}
            >
              <Move className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Nội dung chữ
            </label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={draftWatermark.text}
                onChange={(event) => updateDraft({ text: event.target.value })}
                maxLength={80}
                disabled={submitting}
                className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Độ mờ
              </label>
              <span className="text-xs font-semibold text-primary">
                {Math.round(draftWatermark.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={Math.round(draftWatermark.opacity * 100)}
              onChange={(event) => updateDraft({ opacity: Number(event.target.value) / 100 })}
              disabled={submitting}
              className="h-2 w-full accent-primary"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/30 px-3 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Cỡ chữ
                </label>
                <span className="text-xs font-semibold text-primary">
                  {Math.round(draftWatermark.textScale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={300}
                step={5}
                value={Math.round(draftWatermark.textScale * 100)}
                onChange={(event) => updateDraft({ textScale: Number(event.target.value) / 100 })}
                disabled={submitting}
                className="h-2 w-full accent-primary"
              />
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 px-3 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Góc xoay
                </label>
                <span className="text-xs font-semibold text-primary">
                  {Math.round(draftWatermark.rotationDegrees)}°
                </span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={5}
                value={Math.round(draftWatermark.rotationDegrees)}
                onChange={(event) => updateDraft({ rotationDegrees: Number(event.target.value) })}
                disabled={submitting}
                className="h-2 w-full accent-primary"
              />
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[-90, 0, 90, 180].map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    onClick={() => updateDraft({ rotationDegrees: angle })}
                    disabled={submitting}
                    className="rounded-lg border border-border bg-white px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-60"
                  >
                    {angle}°
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/30 px-3 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Text / dòng
                </label>
                <span className="text-xs font-semibold text-primary">
                  {draftWatermark.textsPerLine}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={draftWatermark.textsPerLine}
                onChange={(event) => updateDraft({ textsPerLine: Number(event.target.value) })}
                disabled={submitting}
                className="h-2 w-full accent-primary"
              />
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 px-3 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Số dòng
                </label>
                <span className="text-xs font-semibold text-primary">
                  {draftWatermark.lineCount}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={draftWatermark.lineCount}
                onChange={(event) => updateDraft({ lineCount: Number(event.target.value) })}
                disabled={submitting}
                className="h-2 w-full accent-primary"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Vị trí
            </p>
            <div className="grid grid-cols-2 gap-2">
              {WATERMARK_POSITION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateDraft({ position: option.value })}
                  disabled={submitting}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-all disabled:opacity-60 ${
                    draftWatermark.position === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-white hover:bg-secondary/40'
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Style
            </p>
            <div className="grid grid-cols-4 gap-2">
              {WATERMARK_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateDraft({ style: option.value })}
                  disabled={submitting}
                  className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold transition-all disabled:opacity-60 ${
                    draftWatermark.style === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-white hover:bg-secondary/40'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Hiện tại: <b className="text-foreground">{selectedPosition?.label ?? 'Bốn góc'}</b>
            </span>
            <span className="text-primary">
              Chọn: <b>{Math.round(draftWatermark.opacity * 100)}% · {Math.round(draftWatermark.textScale * 100)}% · {Math.round(draftWatermark.rotationDegrees)}°</b>
            </span>
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
            disabled={submitting || isSameWatermarkSettings(draftWatermark, currentWatermark)}
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
  onClose,
  onSave,
  submitting,
  error,
}: {
  initialName: string
  initialPhone: string
  email: string
  onClose: () => void
  onSave: (payload: { name: string; phone: string }) => Promise<void>
  submitting: boolean
  error: string | null
}) {
  const [draftName, setDraftName] = useState(initialName)
  const [draftPhone, setDraftPhone] = useState(initialPhone)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    void onSave({
      name: draftName.trim(),
      phone: draftPhone.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-24 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />

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
            disabled={submitting}
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
              disabled={submitting}
              className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            />
          </Field>

          <Field label="Số điện thoại" icon={Phone}>
            <input
              value={draftPhone}
              onChange={(event) => setDraftPhone(event.target.value)}
              type="tel"
              disabled={submitting}
              className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            />
          </Field>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </div>
          ) : null}

          <div className="rounded-xl bg-secondary/40 p-3 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="mt-1 truncate font-medium text-foreground">{email}</p>
            </div>
          </div>

          <div className="flex gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary/50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
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
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [name, setName] = useState(sessionUser?.name || sessionUser?.username || '')
  const [email] = useState(sessionUser?.email || '')
  const [username] = useState(sessionUser?.username || '')
  const [phone, setPhone] = useState(sessionUser?.phone || '')
  const [role] = useState<'admin' | 'user'>(sessionUser?.role ?? 'user')
  const [joinedAt] = useState(sessionUser ? formatJoinDate(sessionUser.createdAt) : '')
  const [avatarUrl, setAvatarUrl] = useState(sessionUser?.avatarUrl || null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarSaved, setAvatarSaved] = useState(false)
  const [infoSaved, setInfoSaved] = useState(false)
  const [infoError, setInfoError] = useState<string | null>(null)
  const [savingInfo, setSavingInfo] = useState(false)
  const [showEditInfoModal, setShowEditInfoModal] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [imageResizeWidth, setImageResizeWidth] = useState<ImageResizeSetting>(
    sessionUser?.imageResizeWidth ?? DEFAULT_IMAGE_RESIZE_WIDTH,
  )
  const [draftImageResizeWidth, setDraftImageResizeWidth] = useState<ImageResizeSetting>(imageResizeWidth)
  const [showImageSettingsModal, setShowImageSettingsModal] = useState(false)
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>(
    normalizeWatermarkSettings(sessionUser?.watermarkSettings ?? DEFAULT_WATERMARK_SETTINGS),
  )
  const [draftWatermarkSettings, setDraftWatermarkSettings] = useState<WatermarkSettings>(watermarkSettings)
  const [showWatermarkSettingsModal, setShowWatermarkSettingsModal] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyView, setNotifyView] = useState(true)

  useEffect(() => {
    if (!sessionUser) {
      router.replace(loginPath)
    }
  }, [loginPath, router, sessionUser])

  useEffect(() => {
    let active = true
    const session = getStoredSession()
    if (!session?.accessToken) {
      return
    }
    const accessToken = session.accessToken

    async function refreshProfile() {
      try {
        const user = await fetchCurrentUser(accessToken)
        if (!active) {
          return
        }

        setAvatarUrl(user.avatarUrl ?? null)
        setName(user.name || user.username || '')
        setPhone(user.phone || '')
        setImageResizeWidth(user.imageResizeWidth ?? DEFAULT_IMAGE_RESIZE_WIDTH)
        setDraftImageResizeWidth(user.imageResizeWidth ?? DEFAULT_IMAGE_RESIZE_WIDTH)
        const nextWatermarkSettings = normalizeWatermarkSettings(user.watermarkSettings)
        setWatermarkSettings(nextWatermarkSettings)
        setDraftWatermarkSettings(nextWatermarkSettings)
        setSettingsError(null)
      } catch {
        // Keep the locally stored session data if the refresh fails.
      }
    }

    void refreshProfile()

    return () => {
      active = false
    }
  }, [])

  async function handleSaveInfo(payload: { name: string; phone: string }) {
    setSavingInfo(true)
    setInfoError(null)
    setInfoSaved(false)

    try {
      const user = await updateUserSettings({
        name: payload.name || null,
        phone: payload.phone || null,
      })

      setName(user.name || user.username || username)
      setPhone(user.phone || '')
      setShowEditInfoModal(false)
      setInfoSaved(true)
      setTimeout(() => setInfoSaved(false), 2500)
    } catch (err) {
      setInfoError(err instanceof Error ? err.message : 'Không thể lưu thông tin cá nhân')
    } finally {
      setSavingInfo(false)
    }
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

  async function handleSaveWatermarkSettings(value: WatermarkSettings) {
    setSavingSettings(true)
    setSettingsError(null)
    setSettingsSaved(false)

    try {
      const user = await updateUserSettings({ watermarkSettings: normalizeWatermarkSettings(value) })
      const savedValue = normalizeWatermarkSettings(user.watermarkSettings)
      setWatermarkSettings(savedValue)
      setDraftWatermarkSettings(savedValue)
      setShowWatermarkSettingsModal(false)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2500)
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Không thể lưu cấu hình Watermark')
    } finally {
      setSavingSettings(false)
    }
  }

  async function confirmWatermarkSettings() {
    await handleSaveWatermarkSettings(draftWatermarkSettings)
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      setAvatarError(null)
      setAvatarSaved(false)
      setAvatarUploading(true)
      setAvatarUploadProgress(0)

      if (!file.type.startsWith('image/')) {
        throw new Error('Chỉ hỗ trợ file ảnh')
      }

      if (file.size > 30 * 1024 * 1024) {
        throw new Error('Dung lượng ảnh tối đa 30MB')
      }

      const presign = await createAvatarUploadUrl({
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
        fileSize: file.size,
      })

      await uploadFileToPresignedUrl(presign.uploadUrl, file, (progress) => {
        setAvatarUploadProgress(progress)
      })

      const user = await updateUserSettings({
        avatarKey: presign.key,
      })

      setAvatarUrl(user.avatarUrl ?? null)
      setAvatarSaved(true)
      setTimeout(() => setAvatarSaved(false), 2500)
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Không thể cập nhật ảnh đại diện')
    } finally {
      setAvatarUploading(false)
      setAvatarUploadProgress(0)
      event.target.value = ''
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
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => void handleAvatarChange(event)}
            />

            <div className="hero-gradient relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl shadow-md">
              {avatarUrl ? (
                // Signed S3 URLs are generated at runtime, so we render them directly here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={`Ảnh đại diện của ${name || username}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-white">{initials}</span>
              )}

              {avatarUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow transition-colors hover:bg-primary/90"
              title={avatarUploading ? 'Đang tải ảnh đại diện' : 'Đổi ảnh đại diện'}
            >
              {avatarUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
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
            {avatarUploading ? (
              <p className="mt-2 text-[11px] font-medium text-primary">
                Đang cập nhật ảnh đại diện... {avatarUploadProgress}%
              </p>
            ) : avatarError ? (
              <p className="mt-2 text-[11px] font-medium text-red-500">{avatarError}</p>
            ) : avatarSaved ? (
              <p className="mt-2 text-[11px] font-medium text-green-600">Đã cập nhật ảnh đại diện</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
          <h2 className="text-sm font-semibold">Thông tin cá nhân</h2>
          <button
            type="button"
            onClick={() => {
              setInfoError(null)
              setInfoSaved(false)
              setShowEditInfoModal(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5" /> Sửa
          </button>
        </div>
        <div className="divide-y divide-border/60">
          <InfoRow icon={UserCircle} label="Họ và tên" value={name || username} />
          <InfoRow icon={Phone} label="Số điện thoại" value={phone} />
          <InfoRow icon={Mail} label="Email" value={email} muted />
        </div>
        {infoSaved ? (
          <div className="border-t border-border px-4 py-2 text-xs text-green-600">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Đã lưu thành công
            </span>
          </div>
        ) : null}
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
                Khách chưa thanh toán sẽ thấy ảnh preview {formatResizeSetting(imageResizeWidth)}. Ảnh gốc vẫn được giữ nguyên.
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

          <button
            type="button"
            onClick={() => {
              setDraftWatermarkSettings(watermarkSettings)
              setSettingsError(null)
              setSettingsSaved(false)
              setShowWatermarkSettingsModal(true)
            }}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-white hover:ring-2 hover:ring-primary/10"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
                <Palette className="h-4 w-4 text-primary" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  Watermark khi share khách
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {watermarkSettings.text} · {Math.round(watermarkSettings.opacity * 100)}% · {Math.round(watermarkSettings.textScale * 100)}% · {Math.round(watermarkSettings.rotationDegrees)}°
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
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

      {showWatermarkSettingsModal ? (
        <WatermarkSettingsModal
          currentValue={watermarkSettings}
          draftValue={draftWatermarkSettings}
          onDraftChange={setDraftWatermarkSettings}
          onClose={() => setShowWatermarkSettingsModal(false)}
          onConfirm={confirmWatermarkSettings}
          submitting={savingSettings}
        />
      ) : null}

      {showEditInfoModal ? (
        <EditProfileInfoModal
          initialName={name}
          initialPhone={phone}
          email={email}
          onClose={() => {
            setInfoError(null)
            setShowEditInfoModal(false)
          }}
          onSave={handleSaveInfo}
          submitting={savingInfo}
          error={infoError}
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

function isSameWatermarkSettings(first: WatermarkSettings, second: WatermarkSettings) {
  return (
    first.text === second.text &&
    first.position === second.position &&
    first.style === second.style &&
    Math.round(first.textScale * 100) === Math.round(second.textScale * 100) &&
    Math.round(first.rotationDegrees) === Math.round(second.rotationDegrees) &&
    first.textsPerLine === second.textsPerLine &&
    first.lineCount === second.lineCount &&
    Math.round(first.customX * 1000) === Math.round(second.customX * 1000) &&
    Math.round(first.customY * 1000) === Math.round(second.customY * 1000) &&
    Math.round(first.opacity * 100) === Math.round(second.opacity * 100)
  )
}
