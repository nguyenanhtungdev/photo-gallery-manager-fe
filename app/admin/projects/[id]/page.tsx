'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getStoredSession } from '@/lib/auth'
import {
  DEFAULT_IMAGE_RESIZE_WIDTH,
  IMAGE_RESIZE_OPTIONS,
  PHOTO_BATCH_SIZE,
  formatResizeSetting,
  type ImageResizeSetting,
} from '@/lib/image-resize'
import type { Project } from '@/lib/mock-data'
import { buildCurrencySuggestions, formatCurrency, formatDate, maskPhone } from '@/lib/utils'
import {
  addProjectPhoto,
  createProjectPhotoUploadUrl,
  deleteProjectPhoto,
  getProject,
  updateProject,
  updateProjectStatus,
  type UpdateProjectInput,
  uploadFileToPresignedUrl,
} from '@/lib/projects-api'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  ImageIcon,
  Loader2,
  Phone,
  ScrollText,
  Trash2,
  Upload,
  User,
  X,
  ZoomIn,
  Pencil,
} from 'lucide-react'

/* ─── Lightbox ─────────────────────────────────────────────── */
type LightboxPhoto = { id: string; previewUrl: string; filename: string }

function parsePaidAmountInput(value: string) {
  const normalized = value.replace(/[^\d]/g, '')
  if (!normalized) {
    return null
  }

  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Số tiền thanh toán không hợp lệ')
  }

  return amount
}

function parseAccessClient(userAgent: string) {
  const normalized = userAgent || 'Anonymous visitor'
  const browser = /Edg\//.test(normalized)
    ? 'Edge'
    : /Chrome\//.test(normalized)
      ? 'Chrome'
      : /Safari\//.test(normalized)
        ? 'Safari'
        : /Firefox\//.test(normalized)
          ? 'Firefox'
          : 'Trình duyệt ẩn danh'
  const device = /iPhone|iPad|iOS/.test(normalized)
    ? 'iOS'
    : /Android/.test(normalized)
      ? 'Android'
      : /Macintosh|Mac OS/.test(normalized)
        ? 'macOS'
        : /Windows/.test(normalized)
          ? 'Windows'
          : /Linux/.test(normalized)
            ? 'Linux'
            : 'Thiết bị ẩn danh'

  return {
    browser,
    device,
    label: `${browser} • ${device}`,
  }
}

function EditProjectModal({
  project,
  onClose,
  onSave,
}: {
  project: Project
  onClose: () => void
  onSave: (payload: UpdateProjectInput) => Promise<void>
}) {
  const [form, setForm] = useState<UpdateProjectInput>({
    name: project.name,
    clientName: project.clientName,
    clientPhone: project.clientPhone ?? '',
    notes: project.notes ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />

      <div className="relative z-10 flex w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: 'min(90svh, 620px)' }}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold">Cập nhật project</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Sửa thông tin hiển thị và dữ liệu tìm kiếm</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden min-h-0">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {[
              { key: 'name', label: 'Tên project', placeholder: 'Để trống sẽ lấy tên khách hàng', required: false },
              { key: 'clientName', label: 'Tên khách hàng', placeholder: 'Nguyễn Văn A', required: true },
              { key: 'clientPhone', label: 'Số điện thoại', placeholder: 'Không bắt buộc', required: false },
            ].map(({ key, label, placeholder, required }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </label>
                <input
                  value={form[key as keyof UpdateProjectInput] ?? ''}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  placeholder={placeholder}
                  required={required}
                  disabled={submitting}
                  className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
                {key === 'clientPhone' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Có thể để trống nếu chưa cần lưu số điện thoại.
                  </p>
                )}
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ghi chú
              </label>
              <textarea
                value={form.notes ?? ''}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Ghi chú thêm..."
                rows={4}
                disabled={submitting}
                className="w-full resize-none rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary/50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeletePhotoModal({
  photoFilename,
  onClose,
  onConfirm,
  submitting,
}: {
  photoFilename: string
  onClose: () => void
  onConfirm: () => Promise<void>
  submitting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-red-600">Xóa ảnh</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Hành động này không thể hoàn tác</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Bạn có chắc chắn muốn ẩn ảnh <span className="font-semibold">{photoFilename}</span> không?
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Ảnh sẽ chỉ bị ẩn khỏi project và gallery, không xóa file gốc trên storage.
          </p>

          <div className="flex gap-3 pt-1">
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
              disabled={submitting}
              className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-sm shadow-red-500/20 transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang ẩn...' : 'Ẩn ảnh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResizeSettingConfirmModal({
  currentValue,
  nextValue,
  globalValue,
  onClose,
  onConfirm,
  submitting,
}: {
  currentValue: ImageResizeSetting
  nextValue: ImageResizeSetting
  globalValue: ImageResizeSetting
  onClose: () => void
  onConfirm: () => Promise<void>
  submitting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold">Xác nhận cấu hình ảnh share</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cấu hình này chỉ áp dụng cho ảnh khách xem thử khi project chưa thanh toán.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Ảnh gốc vẫn được giữ nguyên. Khách chưa thanh toán sẽ chỉ thấy bản preview theo cấu hình này.
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">Hiện tại</p>
              <p className="mt-1 font-semibold text-foreground">
                {formatProjectResizeSetting(currentValue, globalValue)}
              </p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="text-xs text-primary/80">Sắp đổi thành</p>
              <p className="mt-1 font-semibold text-primary">
                {formatProjectResizeSetting(nextValue, globalValue)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
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
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang lưu...' : 'Hoàn tất'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatProjectResizeSetting(value: ImageResizeSetting, globalValue: ImageResizeSetting) {
  return value === null ? `Theo cấu hình tổng (${formatResizeSetting(globalValue)})` : formatResizeSetting(value)
}

function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
  onDelete,
  deletingId,
}: {
  photos: LightboxPhoto[]
  initialIndex: number
  onClose: () => void
  onDelete: (id: string) => void
  deletingId: string | null
}) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)
  const photo = photos[index]

  const prev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  { prev(); return }
      if (e.key === 'ArrowRight') { next(); return }
      if (e.key === 'Escape')     { onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Touch swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50)  prev()
    if (dx < -50) next()
    touchStartX.current = null
  }

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Top bar ── */}
      <div className="flex flex-shrink-0 items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          {/* Counter */}
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            {index + 1} / {photos.length}
          </span>
          {/* Filename */}
          <p className="max-w-[180px] truncate text-xs text-white/60 sm:max-w-xs">{photo.filename}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete button */}
            <button
            onClick={() => onDelete(photo.id)}
            disabled={deletingId === photo.id}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-400 transition-all hover:bg-red-500/30 hover:text-red-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            title="Ẩn ảnh"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
            title="Đóng (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Image area ── */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
        {/* Prev button */}
        {photos.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 md:left-4 md:h-12 md:w-12"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Image */}
        <div className="relative h-full w-full max-w-4xl">
          <Image
            key={photo.id}
            src={photo.previewUrl}
            alt={photo.filename}
            fill
            className="object-contain"
            sizes="100vw"
            unoptimized
            priority
          />
        </div>

        {/* Next button */}
        {photos.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 md:right-4 md:h-12 md:w-12"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* ── Thumbnail strip (mobile: scrollable row) ── */}
      {photos.length > 1 && (
        <div className="flex flex-shrink-0 items-center gap-2 overflow-x-auto px-4 py-3 md:justify-center">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIndex(i)}
              className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all md:h-16 md:w-16 ${
                i === index
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <Image
                src={p.previewUrl}
                alt={p.filename}
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const pathname = usePathname()
  const projectBasePath = pathname.startsWith('/admin') ? '/admin/projects' : '/projects'
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [paymentInput, setPaymentInput] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)
  const [showPaymentEdit, setShowPaymentEdit] = useState(false)
  const [savingResizeSetting, setSavingResizeSetting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0)
  const [uploadProgressLabel, setUploadProgressLabel] = useState('')
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<{ id: string; filename: string } | null>(null)
  const [pendingResizeSetting, setPendingResizeSetting] = useState<{ value: ImageResizeSetting } | null>(null)
  const [visiblePhotoCount, setVisiblePhotoCount] = useState(PHOTO_BATCH_SIZE)
  const [loadingMorePhotos, setLoadingMorePhotos] = useState(false)
  const [visibleAccessLogCount, setVisibleAccessLogCount] = useState(PHOTO_BATCH_SIZE)
  const [loadingMoreAccessLogs, setLoadingMoreAccessLogs] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const loadMorePhotosRef = useRef<HTMLDivElement | null>(null)
  const loadMoreAccessLogsRef = useRef<HTMLDivElement | null>(null)
  const globalResizeWidth = getStoredSession()?.user.imageResizeWidth ?? DEFAULT_IMAGE_RESIZE_WIDTH

  useEffect(() => {
    let active = true

    async function loadProject() {
      try {
        const data = await getProject(id)
        if (!active) {
          return
        }

        setProject(data)
        setPaymentInput(data.paidAmount != null ? String(data.paidAmount) : '')
        setError(null)
      } catch (err) {
        if (!active) {
          return
        }

        setError(err instanceof Error ? err.message : 'Không thể tải project')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadProject()

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    const node = loadMorePhotosRef.current
    const photoCount = project?.photos.length ?? 0
    const hasMorePhotos = visiblePhotoCount < photoCount

    if (!node || !hasMorePhotos || loadingMorePhotos) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        setLoadingMorePhotos(true)
        window.setTimeout(() => {
          setVisiblePhotoCount((count) => Math.min(count + PHOTO_BATCH_SIZE, photoCount))
          setLoadingMorePhotos(false)
        }, 180)
      },
      { rootMargin: '500px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [loadingMorePhotos, project?.photos.length, visiblePhotoCount])

  useEffect(() => {
    const node = loadMoreAccessLogsRef.current
    const accessLogCount = project?.accessLogs.length ?? 0
    const hasMoreAccessLogs = visibleAccessLogCount < accessLogCount

    if (!node || !hasMoreAccessLogs || loadingMoreAccessLogs) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        setLoadingMoreAccessLogs(true)
        window.setTimeout(() => {
          setVisibleAccessLogCount((count) => Math.min(count + PHOTO_BATCH_SIZE, accessLogCount))
          setLoadingMoreAccessLogs(false)
        }, 180)
      },
      { rootMargin: '160px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [loadingMoreAccessLogs, project?.accessLogs.length, visibleAccessLogCount])

  function copyLink() {
    if (!project) {
      return
    }

    const url = `${window.location.origin}/gallery/${project.shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function toggleStatus() {
    if (!project) {
      return
    }

    try {
      setUpdatingStatus(true)
      const nextStatus = project.status === 'paid' ? 'waiting_payment' : 'paid'
      const nextPaidAmount = nextStatus === 'paid'
        ? parsePaidAmountInput(paymentInput)
        : null
      const updatedProject = await updateProjectStatus(project.id, nextStatus, nextPaidAmount)
      setProject(updatedProject)
      setPaymentInput(updatedProject.paidAmount != null ? String(updatedProject.paidAmount) : '')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái project')
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleUpdateProject(payload: UpdateProjectInput) {
    if (!project) {
      return
    }

    try {
      setSavingInfo(true)
      const updatedProject = await updateProject(project.id, payload)
      setProject(updatedProject)
      setPaymentInput(updatedProject.paidAmount != null ? String(updatedProject.paidAmount) : '')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật project')
      throw err
    } finally {
      setSavingInfo(false)
    }
  }

  async function savePaidAmount() {
    if (!project) {
      return
    }

    try {
      setSavingPayment(true)
      const paidAmount = parsePaidAmountInput(paymentInput)
      const updatedProject = await updateProjectStatus(project.id, 'paid', paidAmount)
      setProject(updatedProject)
      setPaymentInput(updatedProject.paidAmount != null ? String(updatedProject.paidAmount) : '')
      setShowPaymentEdit(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu số tiền thanh toán')
    } finally {
      setSavingPayment(false)
    }
  }

  async function updateResizeSetting(value: ImageResizeSetting) {
    if (!project) {
      return
    }

    try {
      setSavingResizeSetting(true)
      const updatedProject = await updateProject(project.id, {
        name: project.name,
        clientName: project.clientName,
        clientPhone: project.clientPhone,
        notes: project.notes,
        imageResizeWidth: value,
      })
      setProject(updatedProject)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu cấu hình ảnh')
    } finally {
      setSavingResizeSetting(false)
    }
  }

  async function confirmResizeSetting() {
    if (!pendingResizeSetting) {
      return
    }

    await updateResizeSetting(pendingResizeSetting.value)
    setPendingResizeSetting(null)
  }

  async function handlePickPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    if (!project) {
      return
    }

    const selectedFiles = Array.from(event.target.files ?? [])
    if (selectedFiles.length === 0) {
      return
    }

    setUploading(true)
    setUploadProgressPercent(0)
    setUploadProgressLabel('')
    setError(null)

    try {
      let currentProject = project

      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index]
        setUploadProgressLabel(`Đang upload ảnh gốc ${index + 1}/${selectedFiles.length}: ${file.name}`)

        const presign = await createProjectPhotoUploadUrl(project.id, {
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
          fileSize: file.size,
        })

        await uploadFileToPresignedUrl(presign.uploadUrl, file, (progress) => {
          setUploadProgressPercent(progress)
        })

        const dimensions = await readImageDimensions(file)

        currentProject = await addProjectPhoto(project.id, {
          key: presign.key,
          filename: file.name,
          contentType: file.type || presign.contentType,
          fileSize: file.size,
          width: dimensions.width,
          height: dimensions.height,
        })

        setProject(currentProject)
      }

      setUploadProgressLabel(`Đã upload ${selectedFiles.length} ảnh`)
      setUploadProgressPercent(100)
      setTimeout(() => {
        setUploadProgressLabel('')
        setUploadProgressPercent(0)
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể upload ảnh')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function removePhoto(photoId: string) {
    if (!project) {
      return false
    }

    try {
      setRemovingPhotoId(photoId)
      const updatedProject = await deleteProjectPhoto(project.id, photoId)
      setProject(updatedProject)
      setError(null)
      // If lightbox is open and viewing the deleted photo, close or navigate
      if (lightboxIndex !== null) {
        const newLength = updatedProject.photos.length
        if (newLength === 0) {
          setLightboxIndex(null)
        } else if (lightboxIndex >= newLength) {
          setLightboxIndex(newLength - 1)
        }
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa ảnh')
      return false
    } finally {
      setRemovingPhotoId(null)
    }
  }

  function requestDeletePhoto(photoId: string) {
    if (!project) {
      return
    }

    const photo = project.photos.find((item) => item.id === photoId)
    if (!photo) {
      return
    }

    setDeletePhotoTarget({ id: photo.id, filename: photo.filename })
  }

  async function confirmDeletePhoto() {
    if (!deletePhotoTarget) {
      return
    }

    const deleted = await removePhoto(deletePhotoTarget.id)
    if (deleted) {
      setDeletePhotoTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="p-4 pt-4 md:p-6">
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Đang tải thông tin project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">{error ?? 'Project không tồn tại'}</p>
        <Link href={projectBasePath} className="mt-2 inline-block text-sm text-primary">
          ← Quay lại
        </Link>
      </div>
    )
  }

  const isPaid = project.status === 'paid'
  const paymentSuggestions = buildCurrencySuggestions(paymentInput)
  const visibleAccessLogs = project.accessLogs.slice(0, visibleAccessLogCount)
  const hasMoreAccessLogs = visibleAccessLogCount < project.accessLogs.length

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:space-y-6 md:p-6">
      <Link
        href={projectBasePath}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại Projects
      </Link>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {(uploading || uploadProgressLabel) && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-medium text-primary">{uploadProgressLabel || 'Đang upload ảnh...'}</p>
            <span className="text-xs text-muted-foreground">{uploadProgressPercent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${uploadProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div
          className="h-1 w-full"
          style={{
            background: isPaid
              ? 'linear-gradient(90deg, hsl(160,84%,39%), hsl(145,63%,49%))'
              : 'linear-gradient(90deg, hsl(38,92%,50%), hsl(43,96%,56%))',
          }}
        />

        <div className="px-4 py-3 md:px-5">
          {/* Row 1: Tên + badge trạng thái + nút edit icon */}
          <div className="flex items-center gap-2 mb-2">
            <h1 className="min-w-0 flex-1 truncate text-base font-bold leading-tight">
              {project.name}
            </h1>
            {isPaid ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                <CheckCircle2 className="h-3 w-3" /> Đã TT
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                <Clock className="h-3 w-3" /> Chờ TT
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              disabled={savingInfo}
              title="Chỉnh sửa thông tin"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-primary/40 hover:text-primary active:scale-95 disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Row 2: Info chips — scroll ngang trên mobile */}
          <div className="mb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
              <User className="h-3 w-3" /> {project.clientName}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
              <Phone className="h-3 w-3" />
              {maskPhone(project.clientPhone) || 'Không có SĐT'}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" /> {formatDate(project.createdAt)}
            </span>
            {project.paidAmount != null ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> {formatCurrency(project.paidAmount)}
              </span>
            ) : null}
          </div>

          {/* Row 3: Share image config — compact top control */}
          <div className="mb-3 flex flex-col gap-2 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Chất lượng ảnh share</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                Khách chưa thanh toán thấy preview: {formatResizeSetting(project.imageResizeWidth ?? globalResizeWidth)}
              </p>
            </div>
            <label className="relative shrink-0">
              <span className="sr-only">Cấu hình chất lượng ảnh share</span>
              <select
                value={(pendingResizeSetting?.value ?? project.imageResizeWidth) ?? 'inherit'}
                onChange={(event) => {
                  const value = event.target.value
                  const nextValue = value === 'inherit' ? null : Number(value) as ImageResizeSetting
                  if (nextValue === project.imageResizeWidth) {
                    return
                  }

                  setPendingResizeSetting({ value: nextValue })
                }}
                disabled={uploading || savingResizeSetting}
                className="w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-xs font-semibold text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 sm:w-56"
              >
                <option value="inherit">Theo cấu hình tổng ({formatResizeSetting(globalResizeWidth)})</option>
                {IMAGE_RESIZE_OPTIONS.filter((option) => option.value !== null).map((option) => (
                  <option key={option.label} value={option.value ?? ''}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Row 4: Action buttons — 1 hàng */}
          <div className="flex gap-2">
            <button
              id="btn-toggle-status"
              onClick={() => void toggleStatus()}
              disabled={updatingStatus}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                isPaid
                  ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {isPaid ? <Clock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {updatingStatus ? 'Đang cập nhật...' : isPaid ? 'Chờ TT' : 'Đã TT'}
            </button>

            <button
              onClick={copyLink}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs font-medium transition-all hover:border-primary/40 hover:bg-secondary active:scale-95"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? '✓ Copy!' : 'Copy link'}
            </button>

            <Link
              href={`/gallery/${project.shareToken}`}
              target="_blank"
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs font-medium transition-all hover:border-primary/40 hover:bg-secondary active:scale-95"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Gallery
            </Link>
          </div>
        </div>
      </div>

      {/* ── Số tiền thanh toán — ẩn mặc định, hiện khi bấm chỉnh sửa ── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Header row — luôn hiển thị */}
        <button
          type="button"
          onClick={() => setShowPaymentEdit(v => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5 md:px-5 transition-colors hover:bg-secondary/40"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Số tiền thanh toán</p>
              {project.paidAmount != null ? (
                <p className="text-xs text-emerald-600 font-medium">{formatCurrency(project.paidAmount)}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Chưa nhập</p>
              )}
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
            showPaymentEdit
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}>
            {showPaymentEdit ? 'Đóng' : 'Chỉnh sửa'}
          </span>
        </button>

        {/* Expandable form */}
        {showPaymentEdit && (
          <div className="border-t border-border px-4 py-4 md:px-5 space-y-3">
            <p className="text-xs text-muted-foreground">
              Nhập số tiền rồi lưu. Nếu project đang chờ thanh toán, hệ thống sẽ tự chuyển sang đã thanh toán.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                inputMode="numeric"
                value={paymentInput}
                onChange={(event) => setPaymentInput(event.target.value.replace(/[^\d]/g, ''))}
                placeholder="Ví dụ: 3500000"
                autoFocus
                className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => void savePaidAmount()}
                disabled={savingPayment}
                className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPayment ? 'Đang lưu...' : 'Lưu số tiền'}
              </button>
            </div>
            {paymentSuggestions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Gợi ý:</span>
                {paymentSuggestions.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setPaymentInput(String(amount))}
                    disabled={savingPayment}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:border-primary/40 hover:bg-primary/10 active:scale-95 disabled:opacity-50"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {project.notes ? (
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm md:p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <ScrollText className="h-4 w-4 text-muted-foreground" />
            </span>
            <p className="text-sm font-semibold text-foreground">Ghi chú project</p>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {project.notes}
          </p>
        </div>
      ) : null}

      {!isPaid && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Watermark bảo vệ đang BẬT</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
              Khách hàng chỉ thấy ảnh preview chất lượng thấp với watermark. Bật{' '}
              <span className="font-semibold">&quot;Đã thanh toán&quot;</span>{' '}
              để cho phép tải ảnh gốc.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5 md:px-6">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
              </span>
              Ảnh
              <span className="ml-0.5 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {project.photos.length}
              </span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Khách chưa thanh toán sẽ thấy ảnh preview: {formatResizeSetting(project.imageResizeWidth ?? globalResizeWidth)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <button
              id="btn-upload-photos"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" /> {uploading ? 'Đang upload...' : 'Upload ảnh'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handlePickPhotos}
          />
        </div>

        <div className="p-4 md:p-6">
          {project.photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-14 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <ImageIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Chưa có ảnh nào</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Upload ảnh để bắt đầu</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {project.photos.slice(0, visiblePhotoCount).map((photo, photoIdx) => (
                  <div
                    key={photo.id}
                    className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl bg-secondary shadow-sm"
                    onClick={() => setLightboxIndex(photoIdx)}
                  >
                    <Image
                      src={photo.previewUrl}
                      alt={photo.filename}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      unoptimized
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                      {/* Filename */}
                      <p className="mr-2 flex-1 truncate text-xs text-white/90">{photo.filename}</p>
                      {/* Actions */}
                      <div
                        className="flex flex-shrink-0 items-center gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* View full */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setLightboxIndex(photoIdx) }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
                          title="Xem ảnh to"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={(e) => { e.stopPropagation(); requestDeletePhoto(photo.id) }}
                          disabled={removingPhotoId === photo.id}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/80 text-white backdrop-blur-sm transition-all hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                          title="Ẩn ảnh"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {visiblePhotoCount < project.photos.length ? (
                <div ref={loadMorePhotosRef} className="flex justify-center py-5">
                  {loadingMorePhotos ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tải thêm ảnh...
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Cuộn xuống để tải thêm ảnh</span>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-4 py-3.5 md:px-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
              <ScrollText className="h-3.5 w-3.5 text-accent" />
            </span>
            Lịch sử truy cập
            <span className="ml-0.5 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {project.accessLogs.length}
            </span>
          </h2>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
          {project.accessLogs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có lượt truy cập nào
            </p>
          ) : (
            <>
            {visibleAccessLogs.map((log) => {
              const accessClient = parseAccessClient(log.userAgent)

              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3 md:px-6">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary text-base">
                    🌐
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">Người ẩn danh</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {accessClient.label} • IP: <span className="font-mono">{log.ip}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {log.viewCount} lượt
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(log.viewedAt)}</span>
                  </div>
                </div>
              )
            })}
            {hasMoreAccessLogs ? (
              <div ref={loadMoreAccessLogsRef} className="flex justify-center py-4">
                {loadingMoreAccessLogs ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tải thêm lượt truy cập...
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Cuộn để tải thêm lượt truy cập</span>
                )}
              </div>
            ) : null}
            </>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && project.photos.length > 0 && (
        <PhotoLightbox
          photos={project.photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={(photoId) => requestDeletePhoto(photoId)}
          deletingId={removingPhotoId}
        />
      )}

      {showEditModal ? (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateProject}
        />
      ) : null}

      {deletePhotoTarget ? (
        <DeletePhotoModal
          photoFilename={deletePhotoTarget.filename}
          onClose={() => setDeletePhotoTarget(null)}
          onConfirm={confirmDeletePhoto}
          submitting={removingPhotoId === deletePhotoTarget.id}
        />
      ) : null}

      {pendingResizeSetting ? (
        <ResizeSettingConfirmModal
          currentValue={project.imageResizeWidth ?? null}
          nextValue={pendingResizeSetting.value}
          globalValue={globalResizeWidth}
          onClose={() => setPendingResizeSetting(null)}
          onConfirm={confirmResizeSetting}
          submitting={savingResizeSetting}
        />
      ) : null}
    </div>
  )
}

async function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new window.Image()

    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth || 0,
        height: image.naturalHeight || 0,
      }
      URL.revokeObjectURL(objectUrl)
      resolve(dimensions)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: 0, height: 0 })
    }

    image.src = objectUrl
  })
}
