'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Camera, CheckCircle2, ChevronRight, Clock, FolderOpen,
  ImageIcon, ReceiptText, Shield, UserCheck, Users, Plus,
  TrendingUp, Activity, ScrollText, Sparkles, Sun, Sunset, Moon,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  getAdminDashboardOverview,
  type AdminDashboardOverview,
} from '@/lib/dashboard-api'

const EMPTY_SUMMARY = {
  totalUsers: 0,
  totalAdmins: 0,
  activeSessions: 0,
  totalProjects: 0,
  paidProjects: 0,
  waitingProjects: 0,
  totalPhotos: 0,
  totalViewSessions: 0,
  totalPaidAmount: 0,
  paidPercentage: 0,
  averagePhotosPerProject: 0,
}

function formatRole(role: 'admin' | 'user') {
  return role === 'admin' ? 'Admin' : 'User'
}

/** Animated count-up number */
function AnimatedNumber({ target, duration = 800 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return <>{display.toLocaleString('vi-VN')}</>
}

/** Skeleton pulse block */
function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded-xl bg-white/20 ${className}`} />
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    let active = true

    async function loadDashboard() {
      try {
        const data = await getAdminDashboardOverview()
        if (!active) return
        setDashboard(data)
        setError(null)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Không thể tải dashboard admin')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadDashboard()
    return () => { active = false }
  }, [])

  const summary = dashboard?.summary ?? EMPTY_SUMMARY

  const primaryStats = [
    {
      label: 'Người dùng',
      value: summary.totalUsers,
      icon: Users,
      gradient: 'from-blue-500 via-blue-600 to-cyan-500',
      shadow: 'shadow-blue-200',
    },
    {
      label: 'Quản trị viên',
      value: summary.totalAdmins,
      icon: Shield,
      gradient: 'from-slate-600 via-slate-700 to-slate-900',
      shadow: 'shadow-slate-200',
    },
    {
      label: 'Phiên hoạt động',
      value: summary.activeSessions,
      icon: Activity,
      gradient: 'from-emerald-500 via-emerald-600 to-green-500',
      shadow: 'shadow-emerald-200',
    },
    {
      label: 'Tổng project',
      value: summary.totalProjects,
      icon: FolderOpen,
      gradient: 'from-violet-500 via-purple-600 to-fuchsia-500',
      shadow: 'shadow-violet-200',
    },
  ]

  const quickActions = [
    { label: 'Tạo project', href: '/admin/projects', icon: Plus, color: 'bg-primary text-white hover:bg-primary/90' },
    { label: 'Người dùng', href: '/admin/users', icon: Users, color: 'bg-white border border-border text-foreground hover:border-primary/40 hover:text-primary' },
    { label: 'Logs', href: '/admin/logs', icon: ScrollText, color: 'bg-white border border-border text-foreground hover:border-primary/40 hover:text-primary' },
  ]

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const GreetIcon = hour < 12 ? Sun : hour < 18 ? Sunset : Moon
  const greetColor = hour < 12 ? 'text-amber-500' : hour < 18 ? 'text-orange-500' : 'text-indigo-400'

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-6 md:py-7">


      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* ── Primary stat cards ─────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {primaryStats.map(({ label, value, icon: Icon, gradient, shadow }) => (
          <div
            key={label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg ${shadow} transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
          >
            {/* Decorative circles */}
            <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/5" />

            <div className="relative">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-3xl font-bold leading-none tabular-nums">
                {loading ? <Skeleton className="h-8 w-12 bg-white/20" /> : <AnimatedNumber target={value} />}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-white/75">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Middle row ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">

        {/* Progress + mini stats */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Tỉ lệ đã thanh toán</p>
            </div>
            <span className="text-lg font-bold text-primary">{summary.paidPercentage}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="hero-gradient h-2.5 rounded-full transition-all duration-1000 ease-out"
              style={{ width: mounted && !loading ? `${summary.paidPercentage}%` : '0%' }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> {summary.paidProjects} đã thanh toán
            </span>
            <span className="flex items-center gap-1 font-medium text-amber-600">
              <Clock className="h-3 w-3" /> {summary.waitingProjects} chờ thanh toán
            </span>
          </div>

          {/* Mini sub-stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="group rounded-xl border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/60">
              <p className="text-xs text-muted-foreground">Lượt xem gallery</p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {loading ? '–' : <AnimatedNumber target={summary.totalViewSessions} />}
              </p>
            </div>
            <div className="group rounded-xl border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/60">
              <p className="text-xs text-muted-foreground">Ảnh / project (TB)</p>
              <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                {loading ? '–' : <AnimatedNumber target={summary.averagePhotosPerProject} />}
              </p>
            </div>
          </div>
        </div>

        {/* Secondary stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {[
            { label: 'Đã thanh toán', value: summary.paidProjects, icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
            { label: 'Chờ thanh toán', value: summary.waitingProjects, icon: Clock, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
            { label: 'Tổng ảnh', value: summary.totalPhotos, icon: ImageIcon, bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
            { label: 'Doanh thu', value: null, displayValue: formatCurrency(summary.totalPaidAmount), icon: ReceiptText, bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
          ].map(({ label, value, displayValue, icon: Icon, bg, border, text, dot }) => (
            <div key={label} className={`flex items-center gap-3 rounded-xl border ${border} ${bg} px-4 py-3 transition-all hover:shadow-sm`}>
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${text}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-lg font-bold ${text} tabular-nums`}>
                  {loading ? '–' : displayValue ?? <AnimatedNumber target={value ?? 0} />}
                </p>
                <p className={`text-xs ${text} opacity-70`}>{label}</p>
              </div>
              <div className={`h-2 w-2 flex-shrink-0 rounded-full ${dot} opacity-60`} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent lists ───────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        {/* Recent users */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Người dùng mới nhất</h2>
            </div>
            <Link
              href="/admin/users"
              className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/70"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border/60">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboard?.recentUsers.length ? (
            <div className="divide-y divide-border/60">
              {dashboard.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
                    user.role === 'admin' ? 'bg-slate-800' : 'hero-gradient'
                  }`}>
                    {(user.name || user.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user.name || user.username}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      @{user.username} · {user.email}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      user.role === 'admin'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {formatRole(user.role)}
                    </span>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Chưa đăng nhập'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Chưa có người dùng</p>
              <p className="mt-1 text-sm text-muted-foreground">Dữ liệu user mới sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </div>

        {/* Recent projects */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Projects gần đây</h2>
            </div>
            <Link
              href="/admin/projects"
              className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/70"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border/60">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboard?.recentProjects.length ? (
            <div className="divide-y divide-border/60">
              {dashboard.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
                >
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                    project.status === 'paid'
                      ? 'bg-emerald-50 group-hover:bg-emerald-100'
                      : 'bg-amber-50 group-hover:bg-amber-100'
                  }`}>
                    <FolderOpen className={`h-4 w-4 ${project.status === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {project.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {project.clientName} · {project.photoCount} ảnh
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      project.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {project.status === 'paid'
                        ? <><CheckCircle2 className="h-3 w-3" /> Đã TT</>
                        : <><Clock className="h-3 w-3" /> Chờ TT</>}
                    </span>
                    {project.paidAmount != null && (
                      <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                        {formatCurrency(project.paidAmount)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Camera className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Chưa có project nào</p>
              <p className="mt-1 text-sm text-muted-foreground">Dữ liệu project mới sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
