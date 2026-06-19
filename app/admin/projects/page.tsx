'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MOCK_PROJECTS, Project, ProjectStatus } from '@/lib/mock-data'
import { formatDate, maskPhone } from '@/lib/utils'
import {
  FolderOpen, Plus, Search, ImageIcon, Clock,
  CheckCircle2, Copy, ExternalLink,
  MoreHorizontal, X, Check,
} from 'lucide-react'

/* ─── Dropdown menu ──────────────────────────────────────── */
function ActionMenu({
  projectId,
  shareToken,
  status,
  onToggleStatus,
}: {
  projectId: string
  shareToken: string
  status: ProjectStatus
  onToggleStatus: () => void
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
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
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        aria-label="Thêm hành động"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 bg-white border border-border rounded-xl shadow-lg shadow-black/10 py-1.5 w-44 animate-in fade-in zoom-in-95 duration-100">
          {/* Toggle status */}
          <button
            onClick={() => { onToggleStatus(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium hover:bg-secondary transition-colors text-left"
          >
            {status === 'paid' ? (
              <><Clock className="w-3.5 h-3.5 text-amber-500" /> Hoàn tác thanh toán</>
            ) : (
              <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Đánh dấu đã TT</>
            )}
          </button>

          <div className="border-t border-border my-1" />

          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium hover:bg-secondary transition-colors text-left"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5 text-green-500" /> <span className="text-green-600">Đã copy!</span></>
            ) : (
              <><Copy className="w-3.5 h-3.5 text-muted-foreground" /> Copy link chia sẻ</>
            )}
          </button>

          {/* View gallery */}
          <Link
            href={`/gallery/${shareToken}`}
            target="_blank"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium hover:bg-secondary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" /> Xem gallery
          </Link>
        </div>
      )}
    </div>
  )
}

/* ─── Status badge (clickable) ───────────────────────────── */
function StatusBadge({ status, onClick }: { status: ProjectStatus; onClick?: (e: React.MouseEvent) => void }) {
  const base = 'shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer select-none transition-all active:scale-95'
  return status === 'paid' ? (
    <span onClick={onClick} title="Nhấn để hoàn tác" className={`${base} bg-green-50 text-green-600 border-green-200 hover:bg-green-100`}>
      <CheckCircle2 className="w-2.5 h-2.5" /> Đã TT
    </span>
  ) : (
    <span onClick={onClick} title="Nhấn để đánh dấu đã TT" className={`${base} bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100`}>
      <Clock className="w-2.5 h-2.5" /> Chờ TT
    </span>
  )
}

/* ─── Create modal ───────────────────────────────────────── */
function CreateProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Partial<Project>) => void }) {
  const [form, setForm] = useState({ name: '', clientName: '', clientPhone: '', notes: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onCreate(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl">
        <div className="sm:hidden w-10 h-1 bg-border rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold">Tạo Project mới</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {[
            { id: 'name',        label: 'Tên project',    placeholder: 'Wedding - Anh & Linh', required: true },
            { id: 'clientName',  label: 'Tên khách hàng', placeholder: 'Nguyễn Văn A',         required: true },
            { id: 'clientPhone', label: 'Số điện thoại',  placeholder: '0912345678',           required: true },
          ].map(({ id, label, placeholder, required }) => (
            <div key={id}>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wide">{label}</label>
              <input
                id={id}
                value={form[id as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                placeholder={placeholder}
                required={required}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wide">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ghi chú thêm..."
              rows={3}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-secondary/50 transition-colors">
              Huỷ
            </button>
            <button type="submit" className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
              Tạo project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────── */
export default function ProjectsPage() {
  const [projects, setProjects]         = useState<Project[]>(MOCK_PROJECTS)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all')
  const [showCreate, setShowCreate]     = useState(false)

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  function handleCreate(data: Partial<Project>) {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name!,
      clientName: data.clientName!,
      clientPhone: data.clientPhone!,
      shareToken: `share-${Math.random().toString(36).slice(2)}`,
      status: 'waiting_payment',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      photos: [],
      accessLogs: [],
    }
    setProjects([newProject, ...projects])
  }

  function toggleStatus(id: string) {
    setProjects(projects.map((p) =>
      p.id === id ? { ...p, status: p.status === 'paid' ? 'waiting_payment' : 'paid' } : p
    ))
  }

  const paidCount = projects.filter((p) => p.status === 'paid').length

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

      {/* ── Header — desktop only (mobile uses layout gradient header) ── */}
      <div className="hidden md:flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl hero-gradient flex items-center justify-center shadow-sm shrink-0">
              <FolderOpen className="w-4 h-4 text-white" />
            </span>
            Projects
          </h1>
          <p className="text-muted-foreground text-sm mt-1 ml-11.5">
            {projects.length} projects • {paidCount} đã thanh toán
          </p>
        </div>
        <button
          id="btn-create-project"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30 shrink-0"
        >
          <Plus className="w-4 h-4" /> Tạo project
        </button>
      </div>

      {/* ── Mobile: only the create button (title is in layout header) ── */}
      <div className="md:hidden flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{projects.length} projects • {paidCount} đã thanh toán</p>
        <button
          id="btn-create-project-mobile"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30 shrink-0"
        >
          <Plus className="w-4 h-4" /> Tạo
        </button>
      </div>

      {/* ── Search + Filter ── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm project, khách hàng..."
            className="w-full bg-white border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          {([
            { key: 'all',             label: 'Tất cả', count: projects.length },
            { key: 'waiting_payment', label: 'Chờ TT', count: projects.length - paidCount },
            { key: 'paid',            label: 'Đã TT',  count: paidCount },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === key
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-white border border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
              }`}
            >
              {label}
              <span className="opacity-70">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <div className="bg-white border border-border rounded-2xl p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Không tìm thấy project nào</p>
            <p className="text-muted-foreground text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khoá</p>
          </div>
        )}

        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/admin/projects/${p.id}`}
            className="block bg-white border border-border rounded-2xl shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 p-4">
              {/* Folder icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                p.status === 'paid' ? 'bg-green-50' : 'bg-amber-50'
              }`}>
                <FolderOpen className={`w-4.5 h-4.5 ${p.status === 'paid' ? 'text-green-500' : 'text-amber-500'}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate mb-0.5">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {p.clientName} • {maskPhone(p.clientPhone)}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{p.photos.length} ảnh</span>
                  <span>{formatDate(p.createdAt)}</span>
                </div>
              </div>

              {/* Right: ⋯ menu + status badge */}
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.preventDefault()}>
                <ActionMenu
                  projectId={p.id}
                  shareToken={p.shareToken}
                  status={p.status}
                  onToggleStatus={() => toggleStatus(p.id)}
                />
                <StatusBadge status={p.status} onClick={(e) => { e.preventDefault(); toggleStatus(p.id) }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}
