import { MOCK_PROJECTS } from '@/lib/mock-data'
import Link from 'next/link'
import { FolderOpen, ImageIcon, Clock, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react'
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

  const stats = [
    { label: 'Tổng Projects', value: total, icon: FolderOpen, color: 'text-primary', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Đã thanh toán', value: paid, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Chờ thanh toán', value: unpaid, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Tổng ảnh', value: totalPhotos, icon: ImageIcon, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
  ]

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto md:max-w-4xl md:px-6 md:py-7">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground md:text-2xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Tổng quan hệ thống quản lý ảnh</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`stat-card p-4 border ${border}`}>
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-muted-foreground text-xs mt-0.5 leading-snug">{label}</p>
          </div>
        ))}
      </div>

      {/* Payment progress */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Tỉ lệ thanh toán</p>
          <span className="text-sm font-bold text-primary">{Math.round((paid / total) * 100)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2.5">
          <div
            className="hero-gradient h-2.5 rounded-full transition-all duration-700"
            style={{ width: `${(paid / total) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span className="text-emerald-600 font-medium">{paid} đã thanh toán</span>
          <span className="text-amber-600 font-medium">{unpaid} chờ thanh toán</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{totalLogs}</p>
            <p className="text-xs text-muted-foreground">Lượt xem</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{(totalPhotos / total).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Ảnh / project</p>
          </div>
        </div>
      </div>

      {/* Recent projects */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">Projects gần đây</h2>
          <Link href="/admin/projects" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
            Xem tất cả <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recent.map((p) => (
            <Link
              key={p.id}
              href={`/admin/projects/${p.id}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors active:bg-secondary"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.clientName} • {p.photos.length} ảnh</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                p.status === 'paid'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {p.status === 'paid' ? 'Đã TT' : 'Chờ TT'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
