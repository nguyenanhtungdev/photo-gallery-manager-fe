'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Project, ProjectStatus } from '@/lib/mock-data'
import { formatDate, maskPhone } from '@/lib/utils'
import {
  FolderOpen, Plus, Search, ImageIcon, Clock,
  CheckCircle2, Copy, ExternalLink, MoreHorizontal,
  X, Check, Trash2, ChevronRight,
} from 'lucide-react'
import {
  createProject,
  deleteProject,
  listProjects,
  type CreateProjectInput,
  updateProjectStatus,
} from '@/lib/projects-api'

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
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleCopy() {
    const url = `${window.location.origin}/gallery/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => { setCopied(false); setOpen(false) }, 1500)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Thêm hành động"
        disabled={disabled}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-border bg-white py-1.5 shadow-lg shadow-black/10 animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => { void onToggleStatus(); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
          >
            {status === 'paid' ? (
              <><Clock className="h-3.5 w-3.5 text-amber-500" /> Hoàn tác thanh toán</>
            ) : (
              <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Đánh dấu đã TT</>
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

          <Link
            href={`/gallery/${shareToken}`}
            target="_blank"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> Xem gallery
          </Link>

          <div className="my-1 border-t border-border" />

          <button
            onClick={() => { void onDelete(); setOpen(false) }}
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
  onClick: (e: React.MouseEvent) => void
}) {
  const base = 'inline-flex shrink-0 cursor-pointer select-none items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
  return status === 'paid' ? (
    <span
      onClick={disabled ? undefined : onClick}
      title="Nhấn để hoàn tác"
      className={`${base} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
    >
      <CheckCircle2 className="h-2.5 w-2.5" /> Đã TT
    </span>
  ) : (
    <span
      onClick={disabled ? undefined : onClick}
      title="Nhấn để đánh dấu đã TT"
      className={`${base} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}
    >
      <Clock className="h-2.5 w-2.5" /> Chờ TT
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={submitting ? undefined : onClose} />
      <div className="relative w-full rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl">
        {/* Handle bar */}
        <div className="mx-auto mb-1 mt-3 h-1 w-10 rounded-full bg-border sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold">Tạo Project mới</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-secondary/80"
            disabled={submitting}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {[
            { id: 'name', label: 'Tên project', placeholder: 'Wedding - Anh & Linh', required: true },
            { id: 'clientName', label: 'Tên khách hàng', placeholder: 'Nguyễn Văn A', required: true },
            { id: 'clientPhone', label: 'Số điện thoại', placeholder: '0912345678', required: true },
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
                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
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
              className="w-full resize-none rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary/50"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm shadow-primary/30"
              disabled={submitting}
            >
              {submitting ? 'Đang tạo...' : 'Tạo project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProjects() {
      try {
        const data = await listProjects()
        if (!active) return
        setProjects(data)
        setError(null)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách project')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadProjects()
    return () => { active = false }
  }, [])

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleCreate(payload: CreateProjectInput) {
    const newProject = await createProject(payload)
    setProjects((curr) => [newProject, ...curr])
    setError(null)
  }

  async function handleToggleStatus(projectId: string) {
    const current = projects.find((p) => p.id === projectId)
    if (!current) return
    try {
      setBusyProjectId(projectId)
      const nextStatus = current.status === 'paid' ? 'waiting_payment' : 'paid'
      const updated = await updateProjectStatus(projectId, nextStatus)
      setProjects((curr) => curr.map((p) => (p.id === projectId ? updated : p)))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái project')
    } finally {
      setBusyProjectId(null)
    }
  }

  async function handleDelete(projectId: string) {
    const current = projects.find((p) => p.id === projectId)
    if (!current) return
    const confirmed = window.confirm(`Xóa thư mục "${current.name}"?`)
    if (!confirmed) return
    try {
      setBusyProjectId(projectId)
      await deleteProject(projectId)
      setProjects((curr) => curr.filter((p) => p.id !== projectId))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa project')
    } finally {
      setBusyProjectId(null)
    }
  }

  const paidCount = projects.filter((p) => p.status === 'paid').length

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">

      {/* ── Desktop header ── */}
      <div className="hidden items-center justify-between gap-3 md:flex">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold">
            <span className="hero-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm shadow-primary/30">
              <FolderOpen className="h-4 w-4 text-white" />
            </span>
            Projects
          </h1>
          <p className="ml-11.5 mt-1 text-sm text-muted-foreground">
            {projects.length} projects • {paidCount} đã thanh toán
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

      {/* ── Mobile summary bar ── */}
      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-white border border-border px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
            {projects.length} <span className="text-muted-foreground font-normal">projects</span>
          </span>
          <span className="rounded-xl bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700">
            {paidCount} <span className="font-normal">đã TT</span>
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

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Search + filter ── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm project, khách hàng..."
            className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {([
            { key: 'all', label: 'Tất cả', count: projects.length },
            { key: 'waiting_payment', label: 'Chờ TT', count: projects.length - paidCount },
            { key: 'paid', label: 'Đã TT', count: paidCount },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === key
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'border border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary'
              }`}
            >
              {label}
              <span className={statusFilter === key ? 'opacity-75' : 'opacity-60'}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Project cards ── */}
      <div className="space-y-2.5">
        {loading && (
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-sm text-muted-foreground">Đang tải danh sách project...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <FolderOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Không tìm thấy project nào</p>
            <p className="mt-1 text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khoá</p>
          </div>
        )}

        {!loading && filtered.map((project) => {
          const isBusy = busyProjectId === project.id
          const isPaid = project.status === 'paid'

          return (
            <Link
              key={project.id}
              href={`/admin/projects/${project.id}`}
              className="group block cursor-pointer rounded-2xl border border-border bg-white shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              {/* status bar */}
              <div
                className="h-0.5 w-full rounded-t-2xl transition-all"
                style={{
                  background: isPaid
                    ? 'linear-gradient(90deg, hsl(160,84%,39%), hsl(145,63%,49%))'
                    : 'linear-gradient(90deg, hsl(38,92%,50%), hsl(43,96%,56%))',
                }}
              />
              <div className="flex items-center gap-3 p-4">
                {/* icon */}
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isPaid ? 'bg-green-50' : 'bg-amber-50'
                }`}>
                  <FolderOpen className={`h-5 w-5 ${isPaid ? 'text-green-600' : 'text-amber-500'}`} />
                </div>

                {/* content */}
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 truncate text-sm font-semibold group-hover:text-primary transition-colors">
                    {project.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {project.clientName} • {maskPhone(project.clientPhone)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {project.photos.length} ảnh
                    </span>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </div>

                {/* actions */}
                <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.preventDefault()}>
                  <ActionMenu
                    shareToken={project.shareToken}
                    status={project.status}
                    disabled={isBusy}
                    onToggleStatus={() => handleToggleStatus(project.id)}
                    onDelete={() => handleDelete(project.id)}
                  />
                  <StatusBadge
                    status={project.status}
                    disabled={isBusy}
                    onClick={(e) => {
                      e.preventDefault()
                      void handleToggleStatus(project.id)
                    }}
                  />
                </div>

                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          )
        })}
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
