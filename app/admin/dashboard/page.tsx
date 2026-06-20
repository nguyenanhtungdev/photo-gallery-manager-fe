import { MOCK_PROJECTS } from '@/lib/mock-data'
import Link from 'next/link'
import { FolderOpen, ImageIcon, Clock, CheckCircle2, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const total = MOCK_PROJECTS.length
  const paid = MOCK_PROJECTS.filter((p) => p.status === 'paid').length
  const unpaid = total - paid
  const totalPhotos = MOCK_PROJECTS.reduce((acc, p) => acc + p.photos.length, 0)
  const totalLogs = MOCK_PROJECTS.reduce((acc, p) => acc + p.accessLogs.length, 0)
  const recent = [...MOCK_PROJECTS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0

  const stats = [
    {
      label: 'Tổng Projects',
      value: total,
      icon: FolderOpen,
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-200',
    },
    {
      label: 'Đã thanh toán',
      value: paid,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-green-500',
      shadow: 'shadow-emerald-200',
    },
    {
      label: 'Chờ thanh toán',
      value: unpaid,
      icon: Clock,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-200',
    },
    {
      label: 'Tổng ảnh',
      value: totalPhotos,
      icon: ImageIcon,
      gradient: 'from-sky-400 to-cyan-500',
      shadow: 'shadow-sky-200',
    },
  ]

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto md:max-w-4xl md:px-6 md:py-7">

      {/* ── Desktop-only header (mobile uses layout header) ── */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Tổng quan hệ thống quản lý ảnh</p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, gradient, shadow }) => (
          <div
            key={label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-md ${shadow}`}
          >
            {/* Decorative circle */}
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative">
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-3xl font-bold leading-none">{value}</p>
              <p className="mt-1 text-[11px] font-medium text-white/75 leading-snug">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Payment progress ── */}
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Tỉ lệ thanh toán</p>
          <span className="text-sm font-bold text-primary">{paidPct}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
          <div
            className="hero-gradient h-2.5 rounded-full transition-all duration-700"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> {paid} đã thanh toán
          </span>
          <span className="text-amber-600 font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" /> {unpaid} chờ thanh toán
          </span>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-white p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalLogs}</p>
            <p className="text-xs text-muted-foreground">Lượt xem</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {total > 0 ? (totalPhotos / total).toFixed(1) : '0'}
            </p>
            <p className="text-xs text-muted-foreground">Ảnh / project</p>
          </div>
        </div>
      </div>

      {/* ── Recent projects ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">Projects gần đây</h2>
          <Link
            href="/admin/projects"
            className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
          >
            Xem tất cả <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-border/60">
          {recent.map((p) => (
            <Link
              key={p.id}
              href={`/admin/projects/${p.id}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors active:bg-secondary group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                p.status === 'paid' ? 'bg-green-50 group-hover:bg-green-100' : 'bg-amber-50 group-hover:bg-amber-100'
              }`}>
                <FolderOpen className={`w-4 h-4 ${p.status === 'paid' ? 'text-green-600' : 'text-amber-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {p.clientName} • {p.photos.length} ảnh • {formatDate(p.createdAt)}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                p.status === 'paid'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {p.status === 'paid' ? 'Đã TT' : 'Chờ TT'}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
