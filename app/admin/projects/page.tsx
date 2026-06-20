'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FormEvent, MouseEvent } from 'react'
import Link from 'next/link'
import type { Project, ProjectStatus } from '@/lib/mock-data'
import { formatCurrency, formatDate, maskPhone } from '@/lib/utils'
import {
  FolderOpen, Plus, Search, ImageIcon, Clock,
  CheckCircle2, Copy, ExternalLink, MoreHorizontal,
  X, Check, Trash2, ChevronRight, ChevronLeft, CalendarRange,
} from 'lucide-react'
import {
  createProject,
  deleteProject,
  listProjects,
  type CreateProjectInput,
  updateProjectStatus,
} from '@/lib/projects-api'

const PAGE_SIZE = 12

const INITIAL_PAGINATION = {
  offset: 0,
  limit: PAGE_SIZE,
  total: 0,
  hasMore: false,
  nextOffset: 0,
}

const INITIAL_STATS = {
  all: 0,
  paid: 0,
  waiting_payment: 0,
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDateRange(dateFromInput: string, dateToInput: string) {
  if (!dateFromInput && !dateToInput) {
    return null
  }

  const dateFrom = dateFromInput ? new Date(`${dateFromInput}T00:00:00`) : null
  const dateTo = dateToInput ? new Date(`${dateToInput}T23:59:59.999`) : null

  return {
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString(),
  }
}

function parsePaidAmountInput(value: string) {
  const normalized = value.replace(/[^\d]/g, '')
  if (!normalized) {
    return null
  }

  const paidAmount = Number(normalized)
  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    throw new Error('Số tiền thanh toán không hợp lệ')
  }

  return paidAmount
}

/* ─── DateRangePicker ──────────────────────────────────────── */
const VI_MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                   'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
const VI_DAYS   = ['CN','T2','T3','T4','T5','T6','T7']

function fmtDisplay(ymd: string) {
  if (!ymd) return ''
  const [,m,d] = ymd.split('-')
  return `${d}/${m}`
}

function DateRangePicker({
  from, to, onChange,
}: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  const [open, setOpen]       = useState(false)
  const [picking, setPicking] = useState<'start'|'end'>('start')
  const [hovered, setHovered] = useState<string|null>(null)
  const [view, setView]       = useState(() => {
    const d = from ? new Date(from + 'T00:00:00') : new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  // Position of the popup
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef  = useRef<HTMLButtonElement>(null)
  const popRef  = useRef<HTMLDivElement>(null)

  // Calculate position when opening
  function openPicker() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const popW = 288 // w-72
      // flip left if would go off-screen
      const left = r.left + popW > window.innerWidth - 8
        ? Math.max(8, r.right - popW)
        : r.left
      setPos({ top: r.bottom + 8, left })
    }
    setOpen(v => !v)
    setPicking('start')
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: globalThis.MouseEvent) {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  function prevMonth() {
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  }
  function nextMonth() {
    setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })
  }

  const cells = (() => {
    const firstDay = new Date(view.year, view.month, 1).getDay()
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
    const arr: (string|null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(`${view.year}-${String(view.month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
    }
    return arr
  })()

  function handleDayClick(day: string) {
    if (picking === 'start') {
      onChange(day, day)
      setPicking('end')
    } else {
      const [f, t] = day < from ? [day, from] : [from, day]
      onChange(f, t)
      setPicking('start')
      setHovered(null)
      setOpen(false)
    }
  }

  function dayClass(day: string) {
    const effectiveTo = picking === 'end' && hovered ? hovered : to
    const [lo, hi]   = from && effectiveTo && effectiveTo < from ? [effectiveTo, from] : [from, effectiveTo]
    const isStart    = day === from
    const isEnd      = day === to
    const inRange    = lo && hi && day > lo && day < hi
    const isHovEnd   = picking === 'end' && day === hovered
    if (isStart || isEnd || isHovEnd) return 'bg-primary text-white rounded-full font-semibold'
    if (inRange)                      return 'bg-primary/15 text-primary'
    return 'hover:bg-secondary rounded-full text-foreground'
  }

  const label = from && to && from !== to
    ? `${fmtDisplay(from)} \u2013 ${fmtDisplay(to)}`
    : from ? fmtDisplay(from) : 'Lọc ngày'

  const popup = open ? (
    <div
      ref={popRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="w-72 rounded-2xl border border-border bg-white shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <button onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{VI_MONTHS[view.month]} {view.year}</span>
        <button onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-secondary transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Hint */}
      <p className="px-4 py-1.5 text-[11px] text-muted-foreground">
        {picking === 'start' ? '① Chọn ngày bắt đầu' : '② Chọn ngày kết thúc'}
      </p>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 text-center">
        {VI_DAYS.map(d => (
          <div key={d} className="py-1 text-[11px] font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 px-3 pb-3">
        {cells.map((day, i) =>
          day ? (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => picking === 'end' && setHovered(day)}
              onMouseLeave={() => setHovered(null)}
              className={`py-1.5 text-xs transition-all text-center ${dayClass(day)}`}
            >
              {Number(day.split('-')[2])}
            </button>
          ) : <div key={`pad-${i}`} />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-3">
        <button
          onClick={() => { onChange('', ''); setPicking('start'); setOpen(false) }}
          className="text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors"
        >
          Xoá lọc
        </button>
        {from && to && (
          <span className="text-xs text-primary font-medium">
            {fmtDisplay(from)}{from !== to ? ` – ${fmtDisplay(to)}` : ''}
          </span>
        )}
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Xong
        </button>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={openPicker}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
          from || to
            ? 'bg-accent/15 border-accent/30 text-accent'
            : 'border-border text-muted-foreground hover:border-accent/40 hover:text-accent'
        }`}
      >
        <CalendarRange className="h-3 w-3" />
        {label}
      </button>
      {typeof document !== 'undefined' && createPortal(popup, document.body)}
    </>
  )
}

function ActionMenu({
  shareToken,
  status,
  disabled,
  onToggleStatus,
  onDelete,
}: {
  shareToken: string
  status: ProjectStatus
  disabled: boolean
  onToggleStatus: () => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(event: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleCopy() {
    const url = `${window.location.origin}/gallery/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setOpen(false)
    }, 1500)
  }

  function handleOpenGallery() {
    window.open(`/gallery/${shareToken}`, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Thêm hành động"
        disabled={disabled}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-border bg-white py-1.5 shadow-lg shadow-black/10 animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => {
              void onToggleStatus()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
          >
            {status === 'paid' ? (
              <><Clock className="h-3.5 w-3.5 text-amber-500" /> Chưa thanh toán</>
            ) : (
              <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Đã thanh toán</>
            )}
          </button>

          <div className="my-1 border-t border-border" />

          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium transition-colors hover:bg-secondary"
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5 text-green-500" /> <span className="text-green-600">Đã copy!</span></>
            ) : (
              <><Copy className="h-3.5 w-3.5 text-muted-foreground" /> Copy link chia sẻ</>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenGallery}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> Xem gallery
          </button>

          <div className="my-1 border-t border-border" />

          <button
            onClick={() => {
              void onDelete()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
          >
            <Trash2 className="h-3.5 w-3.5" /> Xóa thư mục
          </button>
        </div>
      )}
    </div>
  )
}

function StatusBadge({
  status,
  disabled,
  onClick,
}: {
  status: ProjectStatus
  disabled: boolean
  onClick: (event: MouseEvent) => void
}) {
  const base = 'inline-flex shrink-0 cursor-pointer select-none items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'

  if (status === 'paid') {
    return (
      <span
        onClick={disabled ? undefined : onClick}
        title="Nhấn để chuyển về chưa thanh toán"
        className={`${base} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
      >
        <CheckCircle2 className="h-2.5 w-2.5" /> Đã thanh toán
      </span>
    )
  }

  return (
      <span
        onClick={disabled ? undefined : onClick}
        title="Nhấn để đánh dấu đã thanh toán"
        className={`${base} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}
      >
      <Clock className="h-2.5 w-2.5" /> Chưa thanh toán
    </span>
  )
}

function CreateProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (project: CreateProjectInput) => Promise<void>
}) {
  const [form, setForm] = useState<CreateProjectInput>({
    name: '',
    clientName: '',
    clientPhone: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await onCreate(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    /* Overlay — căng giữa màn hình */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />

      {/* Dialog card */}
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: 'min(90svh, 600px)' }}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-bold">Tạo Project mới</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {[
              { id: 'name',        label: 'Tên project',    placeholder: 'Để trống sẽ lấy tên khách hàng', required: false },
              { id: 'clientName',  label: 'Tên khách hàng', placeholder: 'Nguyễn Văn A',                   required: true  },
              { id: 'clientPhone', label: 'Số điện thoại',  placeholder: '0912345678',                     required: true  },
            ].map(({ id, label, placeholder, required }) => (
              <div key={id}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </label>
                <input
                  id={id}
                  value={form[id as keyof CreateProjectInput] ?? ''}
                  onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                  placeholder={placeholder}
                  required={required}
                  disabled={submitting}
                  className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
                {id === 'name' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nếu bỏ trống, hệ thống dùng tên khách hàng làm tên thư mục.
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
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ghi chú thêm..."
                rows={3}
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

          {/* Footer — luôn hiển thị */}
          <div className="flex flex-shrink-0 gap-3 border-t border-border px-5 py-4">
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
              {submitting
                ? <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang tạo...
                  </span>
                : 'Tạo project'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PaidAmountModal({
  project,
  onClose,
  onSubmit,
}: {
  project: Project
  onClose: () => void
  onSubmit: (paidAmount: number | null) => Promise<void>
}) {
  const [value, setValue] = useState(project.paidAmount != null ? String(project.paidAmount) : '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const paidAmount = parsePaidAmountInput(value)
      await onSubmit(paidAmount)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật thanh toán')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold">Đánh dấu đã thanh toán</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{project.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Số tiền đã thanh toán
            </label>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="Để trống nếu chưa muốn nhập"
              disabled={submitting}
              className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Không bắt buộc. Bạn vẫn có thể lưu trạng thái thanh toán mà không nhập số tiền.
            </p>
          </div>

          {value ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {formatCurrency(Number(value))}
            </div>
          ) : null}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

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
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const defaultToday = formatDateInputValue(new Date())
  const [projects, setProjects] = useState<Project[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all')
  const [dateFromInput, setDateFromInput] = useState(defaultToday)
  const [dateToInput, setDateToInput] = useState(defaultToday)
  const [showCreate, setShowCreate] = useState(false)
  const [paymentDialogProject, setPaymentDialogProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null)
  const [copiedProjectId, setCopiedProjectId] = useState<string | null>(null)
  const [pagination, setPagination] = useState(INITIAL_PAGINATION)
  const [stats, setStats] = useState(INITIAL_STATS)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const requestIdRef = useRef(0)
  const paginationRef = useRef(INITIAL_PAGINATION)
  const loadingRef = useRef(true)
  const loadingMoreRef = useRef(false)

  const loadProjects = useCallback(async (options: { reset: boolean }) => {
    if (!options.reset && (loadingRef.current || loadingMoreRef.current || !paginationRef.current.hasMore)) {
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    if (options.reset) {
      loadingMoreRef.current = false
      setLoadingMore(false)
      setLoading(true)
      loadingRef.current = true
    } else {
      setLoadingMore(true)
      loadingMoreRef.current = true
    }

    try {
      const dateRange = buildDateRange(dateFromInput, dateToInput)
      const data = await listProjects({
        q: searchQuery,
        status: statusFilter,
        offset: options.reset ? 0 : paginationRef.current.nextOffset,
        limit: PAGE_SIZE,
        dateFrom: dateRange?.dateFrom,
        dateTo: dateRange?.dateTo,
      })

      if (requestId !== requestIdRef.current) {
        return
      }

      setProjects((current) => (options.reset ? data.projects : [...current, ...data.projects]))
      paginationRef.current = data.pagination
      setPagination(data.pagination)
      setStats(data.stats)
      setError(null)
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return
      }

      setError(err instanceof Error ? err.message : 'Không thể tải danh sách project')
      if (options.reset) {
        setProjects([])
        paginationRef.current = INITIAL_PAGINATION
        setPagination(INITIAL_PAGINATION)
        setStats(INITIAL_STATS)
      }
    } finally {
      if (requestId === requestIdRef.current) {
        if (options.reset) {
          loadingRef.current = false
          setLoading(false)
        } else {
          loadingMoreRef.current = false
          setLoadingMore(false)
        }
      }
    }
  }, [dateFromInput, dateToInput, searchQuery, statusFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProjects({ reset: true })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadProjects])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadProjects({ reset: false })
        }
      },
      {
        rootMargin: '240px 0px',
      },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [loadProjects, loading, loadingMore, pagination.hasMore, pagination.nextOffset])

  async function handleCreate(payload: CreateProjectInput) {
    await createProject(payload)
    await loadProjects({ reset: true })
    setError(null)
  }

  async function handleToggleStatus(projectId: string) {
    const current = projects.find((project) => project.id === projectId)
    if (!current) {
      return
    }

    if (current.status !== 'paid') {
      setPaymentDialogProject(current)
      return
    }

    try {
      setBusyProjectId(projectId)
      await updateProjectStatus(projectId, 'waiting_payment', null)
      await loadProjects({ reset: true })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái project')
    } finally {
      setBusyProjectId(null)
    }
  }

  async function handleConfirmPaidStatus(paidAmount: number | null) {
    if (!paymentDialogProject) {
      return
    }

    try {
      setBusyProjectId(paymentDialogProject.id)
      await updateProjectStatus(paymentDialogProject.id, 'paid', paidAmount)
      await loadProjects({ reset: true })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái project')
      throw err
    } finally {
      setBusyProjectId(null)
    }
  }

  async function handleDelete(projectId: string) {
    const current = projects.find((project) => project.id === projectId)
    if (!current) {
      return
    }

    const confirmed = window.confirm(`Xóa thư mục "${current.name}"?`)
    if (!confirmed) {
      return
    }

    try {
      setBusyProjectId(projectId)
      await deleteProject(projectId)
      await loadProjects({ reset: true })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa project')
    } finally {
      setBusyProjectId(null)
    }
  }

  function handleCopyShareLink(project: Project) {
    const url = `${window.location.origin}/gallery/${project.shareToken}`
    navigator.clipboard.writeText(url)
    setCopiedProjectId(project.id)
    window.setTimeout(() => {
      setCopiedProjectId((current) => (current === project.id ? null : current))
    }, 1600)
  }

  const statusOptions: Array<{ key: 'all' | ProjectStatus; label: string; count: number }> = [
    { key: 'all', label: 'Tất cả', count: stats.all },
    { key: 'waiting_payment', label: 'Chưa thanh toán', count: stats.waiting_payment },
    { key: 'paid', label: 'Đã thanh toán', count: stats.paid },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <div className="hidden items-center justify-between gap-3 md:flex">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold">
            <span className="hero-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm shadow-primary/30">
              <FolderOpen className="h-4 w-4 text-white" />
            </span>
            Projects
          </h1>
          <p className="ml-11.5 mt-1 text-sm text-muted-foreground">
            {stats.all} projects • {stats.paid} đã thanh toán
          </p>
        </div>
        <button
          id="btn-create-project"
          onClick={() => setShowCreate(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Tạo project
        </button>
      </div>

      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
            {stats.all} <span className="font-normal text-muted-foreground">projects</span>
          </span>
          <span className="rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            {stats.paid} <span className="font-normal">đã thanh toán</span>
          </span>
        </div>
        <button
          id="btn-create-project-mobile"
          onClick={() => setShowCreate(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Tạo mới
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Compact filter bar ── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Search */}
        <div className="relative border-b border-border/60">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm project, khách hàng, số điện thoại..."
            className="w-full bg-transparent py-3 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Status + picker — single scrollable row */}
        <div className="flex items-center gap-2 overflow-x-auto px-3 py-2.5 scrollbar-hide">
          {/* Status chips */}
          {statusOptions.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === key
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
              }`}
            >
              {label} <span className={statusFilter === key ? 'opacity-75' : 'opacity-50'}>{count}</span>
            </button>
          ))}

          {/* Divider */}
          <div className="h-5 w-px flex-shrink-0 bg-border/60" />

          {/* Date range picker */}
          <DateRangePicker
            from={dateFromInput}
            to={dateToInput}
            onChange={(f, t) => { setDateFromInput(f); setDateToInput(t) }}
          />
        </div>
      </div>


      <div className="space-y-2.5">
        {loading && (
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-sm text-muted-foreground">Đang tải danh sách project...</p>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <FolderOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Không tìm thấy project nào</p>
            <p className="mt-1 text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa</p>
          </div>
        )}

        {!loading && projects.map((project) => {
          const isBusy = busyProjectId === project.id
          const isPaid = project.status === 'paid'

          return (
            <Link
              key={project.id}
              href={`/admin/projects/${project.id}`}
              className="group block cursor-pointer rounded-2xl border border-border bg-white shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div
                className="h-0.5 w-full rounded-t-2xl transition-all"
                style={{
                  background: isPaid
                    ? 'linear-gradient(90deg, hsl(160,84%,39%), hsl(145,63%,49%))'
                    : 'linear-gradient(90deg, hsl(38,92%,50%), hsl(43,96%,56%))',
                }}
              />
              <div className="flex items-center gap-3 p-4">
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isPaid ? 'bg-green-50' : 'bg-amber-50'
                }`}>
                  <FolderOpen className={`h-5 w-5 ${isPaid ? 'text-green-600' : 'text-amber-500'}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 truncate text-sm font-semibold transition-colors group-hover:text-primary">
                    {project.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {project.clientName} • {maskPhone(project.clientPhone)}
                  </p>
                  {project.paidAmount != null ? (
                    <p className="mt-1 truncate text-xs font-medium text-emerald-700">
                      Đã thu {formatCurrency(project.paidAmount)}
                    </p>
                  ) : null}
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {project.photos.length} ảnh
                    </span>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </div>

                <div
                  className="flex shrink-0 items-start gap-2"
                  onClick={(event) => event.preventDefault()}
                >
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge
                      status={project.status}
                      disabled={isBusy}
                      onClick={(event) => {
                        event.preventDefault()
                        void handleToggleStatus(project.id)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyShareLink(project)}
                      disabled={isBusy}
                      className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {copiedProjectId === project.id ? 'Da copy' : 'Copy link'}
                    </button>
                  </div>

                  <ActionMenu
                    shareToken={project.shareToken}
                    status={project.status}
                    disabled={isBusy}
                    onToggleStatus={() => handleToggleStatus(project.id)}
                    onDelete={() => handleDelete(project.id)}
                  />
                </div>

                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          )
        })}
      </div>

      {!loading && projects.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-white px-4 py-3 text-center text-sm text-muted-foreground shadow-sm">
            Đang hiển thị {projects.length}/{pagination.total} project
          </div>

          {loadingMore && (
            <div className="rounded-2xl border border-border bg-white p-4 text-center shadow-sm">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-sm text-muted-foreground">Đang tải thêm project...</p>
            </div>
          )}

          {!loadingMore && pagination.hasMore && (
            <div ref={loadMoreRef} className="h-12" />
          )}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {paymentDialogProject && (
        <PaidAmountModal
          project={paymentDialogProject}
          onClose={() => setPaymentDialogProject(null)}
          onSubmit={handleConfirmPaidStatus}
        />
      )}
    </div>
  )
}
