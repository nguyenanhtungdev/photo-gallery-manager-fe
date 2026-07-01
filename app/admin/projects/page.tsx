'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FormEvent, MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ActionConfirmModal } from '@/components/ui/action-confirm-modal'
import type { Project, ProjectStatus } from '@/lib/mock-data'
import { ProjectStatusIcon } from '@/lib/project-status-icons'
import { getProjectStatusMeta, isProjectCancelled, isProjectPaid } from '@/lib/project-status'
import { buildCurrencySuggestions, formatCurrency, formatDate, maskPhone } from '@/lib/utils'
import {
  FolderOpen, Plus, Search, ImageIcon,
  CheckCircle2, Copy, ExternalLink, MoreHorizontal,
  X, Check, Trash2, ChevronRight, ChevronLeft, CalendarRange,
  LayoutGrid, Columns2, Square,
  Ban, Hash,
} from 'lucide-react'
import {
  createProject,
  deleteProject,
  listProjects,
  type ProjectApiScope,
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
  cancelled: 0,
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCurrentWeekRange(today = new Date()) {
  const currentDate = new Date(today)
  const dayOfWeek = currentDate.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() + diffToMonday)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(0, 0, 0, 0)

  return {
    from: formatDateInputValue(startOfWeek),
    to: formatDateInputValue(endOfWeek),
  }
}

function getTodayRange(today = new Date()) {
  const value = formatDateInputValue(today)

  return {
    from: value,
    to: value,
  }
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

/* ─── StatusSelect ────────────────────────────────────── */
function StatusSelect({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: { key: string; label: string; count: number }[]
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  function openMenu() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e: globalThis.MouseEvent) {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const selected = options.find(o => o.key === value)
  const label = selected ? `${selected.label} (${selected.count})` : 'Tất cả'

  const popup = open ? (
    <div
      ref={popRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="overflow-hidden rounded-xl border border-border bg-white shadow-xl"
    >
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          onClick={() => { onChange(opt.key); setOpen(false) }}
          className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold transition-colors hover:bg-secondary ${opt.key === value ? 'text-primary bg-primary/5' : 'text-foreground'
            }`}
        >
          <span>{opt.label}</span>
          <span className="text-muted-foreground">({opt.count})</span>
        </button>
      ))}
    </div>
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openMenu}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all ${value !== 'all'
            ? 'border-primary/30 bg-primary/5 text-primary'
            : 'border-border text-foreground hover:border-primary/40'
          }`}
      >
        <span className="truncate">{label}</span>
        <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${open ? '-rotate-90' : 'rotate-90'
          }`} />
      </button>
      {typeof document !== 'undefined' && createPortal(popup, document.body)}
    </>
  )
}

/* ─── DateRangePicker ────────────────────────────────────── */
const VI_MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
const VI_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function fmtDisplay(ymd: string) {
  if (!ymd) return ''
  const [, m, d] = ymd.split('-')
  return `${d}/${m}`
}

function DateRangePicker({
  from, to, onChange,
}: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState<'start' | 'end'>('start')
  const [hovered, setHovered] = useState<string | null>(null)
  const [view, setView] = useState(() => {
    const d = from ? new Date(from + 'T00:00:00') : new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  // Position of the popup
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

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
    const arr: (string | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(`${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
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

  function getDayState(day: string) {
    const effectiveTo = picking === 'end' && hovered ? hovered : to
    const [lo, hi] = from && effectiveTo && effectiveTo < from ? [effectiveTo, from] : [from, effectiveTo]
    const isStart = day === from
    const isEnd = day === effectiveTo
    const inRange = lo && hi && day > lo && day < hi
    const isHovEnd = picking === 'end' && day === hovered

    return {
      isStart,
      isEnd,
      inRange,
      isHovEnd,
    }
  }

  const label = from && to && from !== to
    ? `${fmtDisplay(from)} \u2013 ${fmtDisplay(to)}`
    : from ? fmtDisplay(from) : 'Lọc ngày'
  const quickRanges = [
    { label: 'Hôm nay', ...getTodayRange() },
    { label: 'Tuần này', ...getCurrentWeekRange() },
  ]

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

      <div className="flex flex-wrap gap-2 px-4 pb-2 pt-3">
        {quickRanges.map((range) => {
          const active = from === range.from && to === range.to

          return (
            <button
              key={range.label}
              type="button"
              onClick={() => {
                onChange(range.from, range.to)
                setPicking('start')
                setHovered(null)
                setOpen(false)
              }}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${active
                  ? 'border-primary/25 bg-primary text-white'
                  : 'border-border bg-secondary/40 text-foreground hover:border-primary/30 hover:text-primary'
                }`}
            >
              {range.label}
              {range.label === 'Tuần này' ? (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                  Mặc định
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

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
            (() => {
              const { isStart, isEnd, inRange, isHovEnd } = getDayState(day)
              const isEdge = isStart || isEnd || isHovEnd
              const rangeClass = [
                inRange || isEdge ? 'bg-primary/12' : '',
                isStart && !isEnd ? 'rounded-l-xl' : '',
                isEnd && !isStart ? 'rounded-r-xl' : '',
                inRange && !isStart && !isEnd ? '' : '',
              ].filter(Boolean).join(' ')
              const buttonClass = isEdge
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : inRange
                  ? 'text-primary'
                  : 'text-foreground hover:bg-secondary'

              return (
                <div
                  key={day}
                  onMouseEnter={() => picking === 'end' && setHovered(day)}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex h-9 items-center justify-center ${rangeClass}`}
                >
                  <button
                    onClick={() => handleDayClick(day)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all ${buttonClass}`}
                  >
                    {Number(day.split('-')[2])}
                  </button>
                </div>
              )
            })()
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
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-all ${from || to
            ? 'bg-accent/15 border-accent/30 text-accent'
            : 'border-border text-muted-foreground hover:border-accent/40 hover:text-accent'
          }`}
      >
        <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <CalendarRange className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate whitespace-nowrap text-xs">{label}</span>
        </span>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 rotate-90" />
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
  onCancelProject,
  onDelete,
}: {
  shareToken: string
  status: ProjectStatus
  disabled: boolean
  onToggleStatus: () => Promise<void>
  onCancelProject: () => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => setOpen(false), [])

  const getPopupPosition = useCallback((popupWidth = 176, popupHeight = 0) => {
    if (!buttonRef.current) return null
    const triggerRect = buttonRef.current.getBoundingClientRect()
    const viewportPadding = 12
    const offset = 8

    const left = Math.min(
      Math.max(viewportPadding, triggerRect.right - popupWidth),
      window.innerWidth - popupWidth - viewportPadding,
    )

    const preferredTop = triggerRect.bottom + offset
    const top = preferredTop + popupHeight <= window.innerHeight - viewportPadding
      ? preferredTop
      : Math.max(viewportPadding, triggerRect.top - popupHeight - offset)

    return { top, left }
  }, [])

  const updatePosition = useCallback(() => {
    const popupRect = popupRef.current?.getBoundingClientRect()
    const nextPosition = getPopupPosition(
      popupRect?.width ?? 176,
      popupRect?.height ?? 0,
    )
    if (nextPosition) {
      setPosition(nextPosition)
    }
  }, [getPopupPosition])

  useEffect(() => {
    if (!open) return

    function handle(event: globalThis.MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || popupRef.current?.contains(target)) return
      closeMenu()
    }

    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [closeMenu, open])

  useLayoutEffect(() => {
    if (!open) return

    updatePosition()

    function handleViewportChange() {
      updatePosition()
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [open, updatePosition])

  function handleToggleMenu() {
    if (open) {
      closeMenu()
      return
    }

    const nextPosition = getPopupPosition()
    if (nextPosition) {
      setPosition(nextPosition)
    }
    setOpen(true)
  }

  function handleCopy() {
    const url = `${window.location.origin}/gallery/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      closeMenu()
    }, 1500)
  }

  function handleOpenGallery() {
    window.open(`/gallery/${shareToken}`, '_blank', 'noopener,noreferrer')
    closeMenu()
  }

  const popup = open ? (
    <div
      ref={popupRef}
      style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 9999 }}
      className="w-44 rounded-xl border border-border bg-white py-1.5 shadow-lg shadow-black/10 animate-in fade-in duration-100"
    >
      {!isProjectPaid(status) ? (
        <button
          onClick={() => {
            void onToggleStatus()
            closeMenu()
          }}
          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Đã thanh toán
        </button>
      ) : null}

      {status === 'waiting_payment' ? (
        <button
          onClick={() => {
            void onCancelProject()
            closeMenu()
          }}
          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          <Ban className="h-3.5 w-3.5 text-rose-500" /> Hủy project
        </button>
      ) : null}

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
          closeMenu()
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
      >
        <Trash2 className="h-3.5 w-3.5" /> Xóa thư mục
      </button>
    </div>
  ) : null

  return (
    <>
      <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggleMenu}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Thêm hành động"
        disabled={disabled}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      </div>
      {typeof document !== 'undefined' && createPortal(popup, document.body)}
    </>
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
  const meta = getProjectStatusMeta(status)
  const interactive = status === 'waiting_payment' && !disabled
  const base = `inline-flex shrink-0 select-none items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-all ${interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'
    } ${disabled ? 'opacity-50' : ''} ${meta.badgeClassName}`

  return (
    <span
      onClick={interactive ? onClick : undefined}
      title={
        status === 'waiting_payment'
          ? 'Nhấn để thanh toán'
          : status === 'cancelled'
            ? 'Project đã được hủy'
            : 'Project đã thanh toán'
      }
      className={`${base} ${interactive ? 'hover:bg-amber-100' : ''}`}
    >
      <ProjectStatusIcon status={status} className="h-2.5 w-2.5" /> {meta.label}
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
      const trimmedName = form.name.trim()
      if (!trimmedName) {
        throw new Error('Tên project là bắt buộc')
      }

      await onCreate({
        ...form,
        name: trimmedName,
        clientName: trimmedName,
      })
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
              { id: 'name', label: 'Tên project', placeholder: 'Ví dụ: Album cưới Minh Anh', required: true },
              { id: 'clientPhone', label: 'Số điện thoại', placeholder: 'Không bắt buộc', required: false },
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
                {id === 'clientPhone' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Có thể để trống nếu chưa cần lưu số điện thoại.
                  </p>
                )}
                {id === 'name' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tên này sẽ được dùng làm tên hiển thị của project.
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
  const amountSuggestions = buildCurrencySuggestions(value)

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
            <h2 className="text-base font-bold">Thanh toán</h2>
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

          {amountSuggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Gợi ý số tiền</p>
              <div className="flex flex-wrap gap-2">
                {amountSuggestions.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setValue(String(amount))}
                    disabled={submitting}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:border-primary/40 hover:bg-primary/10 active:scale-95 disabled:opacity-50"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
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
  const pathname = usePathname()
  const projectBasePath = pathname.startsWith('/admin') ? '/admin/projects' : '/projects'
  const apiScope: ProjectApiScope = pathname.startsWith('/admin') ? 'admin' : 'user'
  const defaultWeekRange = getCurrentWeekRange()
  const [projects, setProjects] = useState<Project[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all')
  const [dateFromInput, setDateFromInput] = useState(defaultWeekRange.from)
  const [dateToInput, setDateToInput] = useState(defaultWeekRange.to)
  const [showCreate, setShowCreate] = useState(false)
  const [paymentDialogProject, setPaymentDialogProject] = useState<Project | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    mode: 'cancel' | 'delete'
    project: Project
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null)
  const [pagination, setPagination] = useState(INITIAL_PAGINATION)
  const [stats, setStats] = useState(INITIAL_STATS)
  const [cols, setCols] = useState<1 | 2 | 3>(1)
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
      }, apiScope)

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
  }, [apiScope, dateFromInput, dateToInput, searchQuery, statusFilter])

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

    if (current.status !== 'waiting_payment') {
      return
    }

    setPaymentDialogProject(current)
  }

  async function handleConfirmPaidStatus(paidAmount: number | null) {
    if (!paymentDialogProject) {
      return
    }

    try {
      setBusyProjectId(paymentDialogProject.id)
      await updateProjectStatus(paymentDialogProject.id, 'paid', paidAmount, apiScope)
      await loadProjects({ reset: true })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái project')
      throw err
    } finally {
      setBusyProjectId(null)
    }
  }

  async function handleCancelStatus(projectId: string) {
    const current = projects.find((project) => project.id === projectId)
    if (!current || current.status !== 'waiting_payment') {
      return
    }

    setConfirmDialog({ mode: 'cancel', project: current })
  }

  async function handleConfirmDialogAction() {
    if (!confirmDialog) {
      return
    }

    const { mode, project: current } = confirmDialog

    try {
      setBusyProjectId(current.id)

      if (mode === 'cancel') {
        await updateProjectStatus(current.id, 'cancelled', null, apiScope)
      } else {
        await deleteProject(current.id, apiScope)
      }

      setConfirmDialog(null)
      await loadProjects({ reset: true })
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === 'cancel'
            ? 'Không thể hủy project'
            : 'Không thể xóa project',
      )
    } finally {
      setBusyProjectId(null)
    }
  }

  async function handleDelete(projectId: string) {
    const current = projects.find((project) => project.id === projectId)
    if (!current) {
      return
    }

    setConfirmDialog({ mode: 'delete', project: current })
  }

  const statusOptions: Array<{ key: 'all' | ProjectStatus; label: string; count: number }> = [
    { key: 'all', label: 'Tất cả', count: stats.all },
    { key: 'waiting_payment', label: 'Chưa thanh toán', count: stats.waiting_payment },
    { key: 'paid', label: 'Đã thanh toán', count: stats.paid },
    { key: 'cancelled', label: 'Đã hủy', count: stats.cancelled },
  ]

  return (
    <div className="mx-auto flex h-full max-w-5xl min-h-0 flex-col gap-4 p-4 md:p-6">
      <div className="hidden flex-shrink-0 items-center justify-between gap-3 md:flex">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold">
            <span className="hero-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm shadow-primary/30">
              <FolderOpen className="h-4 w-4 text-white" />
            </span>
            Projects
          </h1>
          <p className="ml-11.5 mt-1 text-sm text-muted-foreground">
            {stats.all} projects • {stats.paid} đã thanh toán • {stats.cancelled} đã hủy
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

      {error && (
        <div className="flex-shrink-0 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Compact filter bar ── */}
      <div className="flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {/* Search */}
        <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5 md:block md:p-0">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm mã project, tên, khách hàng, số điện thoại..."
              className="h-10 w-full rounded-xl bg-transparent pl-11 pr-4 text-[15px] outline-none placeholder:text-muted-foreground/60 md:h-auto md:rounded-none md:py-3 md:pl-10 md:text-sm"
            />
          </div>

          <button
            id="btn-create-project-mobile"
            onClick={() => setShowCreate(true)}
            className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95 md:hidden"
          >
            <Plus className="h-4 w-4" /> Tạo mới
          </button>
        </div>

        {/* Status + date + toggle — 3-col grid, no overflow */}
        <div className="grid items-center gap-2 px-3 py-3" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
          {/* Status */}
          <StatusSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as 'all' | ProjectStatus)}
            options={statusOptions}
          />

          {/* Date range picker */}
          <div className="min-w-0">
            <DateRangePicker
              from={dateFromInput}
              to={dateToInput}
              onChange={(f, t) => { setDateFromInput(f); setDateToInput(t) }}
            />
          </div>

          {/* Column toggle */}
          <div className="gallery-cols-toggle flex-shrink-0">
            {([1, 2, 3] as const).map((n) => {
              const icons = {
                1: <Square className="h-4 w-4" />,
                2: <Columns2 className="h-4 w-4" />,
                3: <LayoutGrid className="h-4 w-4" />,
              }
              return (
                <button
                  key={n}
                  type="button"
                  title={`${n} cột`}
                  onClick={() => setCols(n)}
                  className={`gallery-cols-btn ${cols === n ? 'gallery-cols-btn-active' : 'gallery-cols-btn-idle'
                    }`}
                >
                  {icons[n]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0">

        <div className={cols === 1 ? 'space-y-2.5' : `grid gap-3 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
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

          {!loading && projects.map((project, idx) => {
            const isBusy = busyProjectId === project.id
            const statusMeta = getProjectStatusMeta(project.status)
            const isCancelled = isProjectCancelled(project.status)

            if (cols === 1) {
              // ── List layout ──
              return (
                <Link
                  key={project.id}
                  href={`${projectBasePath}/${project.id}`}
                  className="group animate-fade-in-up flex min-h-[92px] cursor-pointer items-stretch overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Left accent bar */}
                  <div
                    className="w-1 flex-shrink-0"
                    style={{
                      background: statusMeta.accentGradient,
                    }}
                  />

                  {/* Icon */}
                  <div className="flex flex-shrink-0 items-center px-3.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${statusMeta.iconWrapClassName}`}>
                      <FolderOpen className={`h-4.5 w-4.5 transition-colors ${statusMeta.iconClassName}`} />
                    </div>
                  </div>

                  {/* Content — 2 rows */}
                  <div className="min-w-0 flex-1 py-3.5 pr-2.5">
                    {/* Row 1: name + status + menu */}
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight transition-colors group-hover:text-primary">
                        {project.name}
                      </p>
                      <div
                        className="flex flex-shrink-0 items-center gap-1"
                        onClick={(e) => e.preventDefault()}
                      >
                        <StatusBadge
                          status={project.status}
                          disabled={isBusy}
                          onClick={(e) => { e.preventDefault(); void handleToggleStatus(project.id) }}
                        />
                        <ActionMenu
                          shareToken={project.shareToken}
                          status={project.status}
                          disabled={isBusy}
                          onToggleStatus={() => handleToggleStatus(project.id)}
                          onCancelProject={() => handleCancelStatus(project.id)}
                          onDelete={() => handleDelete(project.id)}
                        />
                      </div>
                    </div>

                    {/* Row 2: metadata */}
                    <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        {project.projectCode && (
                          <>
                            <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                              <Hash className="h-3 w-3" />
                              {project.projectCode}
                            </span>
                            <span className="text-slate-300">•</span>
                          </>
                        )}
                        {project.clientName && (
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{project.clientName}</span>
                        )}
                        {project.clientName && <span className="text-slate-300">•</span>}
                        {project.clientPhone && (
                          <span className="flex-shrink-0">{maskPhone(project.clientPhone)}</span>
                        )}
                        {project.clientPhone && <span className="text-slate-300">•</span>}
                        <span className="flex flex-shrink-0 items-center gap-0.5">
                          <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                          {project.photos.length} ảnh
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="truncate">{formatDate(project.createdAt)}</span>
                        {project.paidAmount != null && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex-shrink-0 font-semibold text-emerald-600">
                              {formatCurrency(project.paidAmount)}
                            </span>
                          </>
                        )}
                        {project.paidAmount == null && isCancelled ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex-shrink-0 font-semibold text-rose-600">
                              Đã hủy
                            </span>
                          </>
                        ) : null}
                    </div>
                  </div>

                  <ChevronRight className="mr-3 h-4 w-4 flex-shrink-0 self-center text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )
            }

            // ── Grid layout ──
            return (
              <Link
                key={project.id}
                href={`${projectBasePath}/${project.id}`}
                className="group animate-fade-in-up flex flex-col justify-between cursor-pointer rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg overflow-hidden"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Top area with gradient bg */}
                <div>
                  <div
                    className="flex items-center justify-between px-3.5 pt-3.5 pb-2.5 border-b border-slate-100/50"
                    style={{
                      background: statusMeta.surfaceGradient,
                    }}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${statusMeta.iconWrapClassName}`}>
                      <FolderOpen className={`h-4.5 w-4.5 ${statusMeta.iconClassName}`} />
                    </div>
                    <div onClick={(e) => e.preventDefault()}>
                      <ActionMenu
                        shareToken={project.shareToken}
                        status={project.status}
                        disabled={isBusy}
                        onToggleStatus={() => handleToggleStatus(project.id)}
                        onCancelProject={() => handleCancelStatus(project.id)}
                        onDelete={() => handleDelete(project.id)}
                      />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-3.5 pt-3 pb-2">
                    <p className="truncate text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
                      {project.name}
                    </p>
                    {project.projectCode && (
                      <p className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                        <Hash className="h-3 w-3 shrink-0" />
                        <span className="truncate">{project.projectCode}</span>
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground min-w-0 gap-1.5">
                      <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                        {project.clientName || 'Khách vãng lai'}
                      </span>
                      {project.clientPhone && (
                        <span className="flex-shrink-0 text-[11px] opacity-85">
                          {maskPhone(project.clientPhone)}
                        </span>
                      )}
                    </div>

                    {/* Sub-meta: Date & Price */}
                    <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-slate-50 pt-2 text-[10px] text-muted-foreground">
                      <span>{formatDate(project.createdAt)}</span>
                      {project.paidAmount != null ? (
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(project.paidAmount)}
                        </span>
                      ) : (
                        <span className={`font-semibold ${isCancelled ? 'text-rose-600' : 'text-amber-600'}`}>
                          {statusMeta.amountFallbackLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100/60 flex items-center justify-between gap-2 mt-auto">
                  <StatusBadge
                    status={project.status}
                    disabled={isBusy}
                    onClick={(e) => { e.preventDefault(); void handleToggleStatus(project.id) }}
                  />

                  <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground font-medium bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                    <ImageIcon className="h-3 w-3 text-slate-400" />
                    {project.photos.length}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {!loading && projects.length > 0 && (
          <div className="mt-3 space-y-3">
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
      </div>

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

      {confirmDialog ? (
        <ActionConfirmModal
          title={confirmDialog.mode === 'cancel' ? 'Hủy project' : 'Xóa thư mục'}
          description={
            confirmDialog.mode === 'cancel'
              ? `Project "${confirmDialog.project.name}" sẽ được đánh dấu là khách không tiếp tục thanh toán.`
              : `Bạn có chắc muốn xóa thư mục "${confirmDialog.project.name}" không?`
          }
          confirmLabel={confirmDialog.mode === 'cancel' ? 'Xác nhận hủy' : 'Xóa thư mục'}
          tone={confirmDialog.mode === 'cancel' ? 'warning' : 'danger'}
          confirming={busyProjectId === confirmDialog.project.id}
          onClose={() => setConfirmDialog(null)}
          onConfirm={handleConfirmDialogAction}
        />
      ) : null}
    </div>
  )
}
