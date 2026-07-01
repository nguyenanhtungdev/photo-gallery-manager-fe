'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Ban, Camera, CheckCircle2, ChevronRight, Clock, FolderOpen,
  ImageIcon, ReceiptText, Shield, UserCheck, Users,
  TrendingUp, Activity, Eye, BarChart3, PieChart as PieChartIcon,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { getProjectStatusMeta } from '@/lib/project-status'
import { ProjectStatusIcon } from '@/lib/project-status-icons'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import {
  getAdminDashboardOverview,
  type AdminDashboardOverview,
} from '@/lib/dashboard-api'

/* ── Constants ─────────────────────────────────────────────────── */

const EMPTY_SUMMARY = {
  totalUsers: 0,
  totalAdmins: 0,
  activeSessions: 0,
  totalProjects: 0,
  paidProjects: 0,
  waitingProjects: 0,
  cancelledProjects: 0,
  totalPhotos: 0,
  totalViewSessions: 0,
  totalPaidAmount: 0,
  paidPercentage: 0,
  cancellationRate: 0,
  averagePhotosPerProject: 0,
}

const DONUT_COLORS = ['#10b981', '#f59e0b', '#f43f5e']

function formatRole(role: 'admin' | 'user') {
  return role === 'admin' ? 'Admin' : 'User'
}

/* ── Animated Number ───────────────────────────────────────────── */

function AnimatedNumber({ target, duration = 800 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let raf = 0

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return <>{display.toLocaleString('vi-VN')}</>
}

/* ── Staggered Entrance ────────────────────────────────────────── */

function useStaggeredEntrance(count: number, delay = 70) {
  const [visible, setVisible] = useState<boolean[]>(Array(count).fill(false))

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < count; i++) {
      timers.push(
        setTimeout(() => {
          setVisible(prev => {
            const next = [...prev]
            next[i] = true
            return next
          })
        }, i * delay),
      )
    }
    return () => timers.forEach(clearTimeout)
  }, [count, delay])

  return visible
}

/* ── Skeleton ──────────────────────────────────────────────────── */

function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded-xl bg-white/20 ${className}`} />
}

/* ── Custom Tooltip for Charts ─────────────────────────────────── */

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/60 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="font-medium text-muted-foreground">{entry.name}:</span>
          <span className="font-bold text-foreground">{entry.value.toLocaleString('vi-VN')}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Donut Center Label ────────────────────────────────────────── */

function DonutCenterLabel({ total }: { total: number }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
      <tspan x="50%" dy="-6" className="fill-foreground text-2xl font-extrabold">
        {total}
      </tspan>
      <tspan x="50%" dy="20" className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-widest">
        project
      </tspan>
    </text>
  )
}

/* ── Main Page ─────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const vis = useStaggeredEntrance(10, 60)

  useEffect(() => {
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

  /* ── Derived chart data ── */

  const donutData = [
    { name: 'Đã thanh toán', value: summary.paidProjects },
    { name: 'Chờ thanh toán', value: summary.waitingProjects },
    { name: 'Đã hủy', value: summary.cancelledProjects },
  ]

  const barData = [
    { name: 'Tổng', value: summary.totalProjects, fill: '#6366f1' },
    { name: 'Đã TT', value: summary.paidProjects, fill: '#10b981' },
    { name: 'Chờ TT', value: summary.waitingProjects, fill: '#f59e0b' },
    { name: 'Đã hủy', value: summary.cancelledProjects, fill: '#f43f5e' },
  ]

  const primaryStats = [
    {
      label: 'Người dùng',
      value: summary.totalUsers,
      icon: Users,
      gradient: 'from-blue-500 via-blue-600 to-cyan-500',
      shadow: 'shadow-blue-200/50',
    },
    {
      label: 'Quản trị viên',
      value: summary.totalAdmins,
      icon: Shield,
      gradient: 'from-slate-600 via-slate-700 to-slate-900',
      shadow: 'shadow-slate-200/50',
    },
    {
      label: 'Phiên hoạt động',
      value: summary.activeSessions,
      icon: Activity,
      gradient: 'from-emerald-500 via-emerald-600 to-green-500',
      shadow: 'shadow-emerald-200/50',
    },
    {
      label: 'Tổng project',
      value: summary.totalProjects,
      icon: FolderOpen,
      gradient: 'from-violet-500 via-purple-600 to-fuchsia-500',
      shadow: 'shadow-violet-200/50',
    },
  ]

  const secondaryStats = [
    { label: 'Đã thanh toán', value: summary.paidProjects, icon: CheckCircle2, bg: 'from-emerald-50 to-green-50', ring: 'ring-emerald-100/60', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    { label: 'Chờ thanh toán', value: summary.waitingProjects, icon: Clock, bg: 'from-amber-50 to-yellow-50', ring: 'ring-amber-100/60', text: 'text-amber-700', iconBg: 'bg-amber-100' },
    { label: 'Đã hủy', value: summary.cancelledProjects, icon: Ban, bg: 'from-rose-50 to-pink-50', ring: 'ring-rose-100/60', text: 'text-rose-700', iconBg: 'bg-rose-100' },
    { label: 'Tỉ lệ hủy', displayValue: `${summary.cancellationRate}%`, icon: TrendingUp, bg: 'from-pink-50 to-fuchsia-50', ring: 'ring-pink-100/60', text: 'text-pink-700', iconBg: 'bg-pink-100' },
    { label: 'Tổng ảnh', value: summary.totalPhotos, icon: ImageIcon, bg: 'from-sky-50 to-blue-50', ring: 'ring-sky-100/60', text: 'text-sky-700', iconBg: 'bg-sky-100' },
    { label: 'Lượt xem', value: summary.totalViewSessions, icon: Eye, bg: 'from-indigo-50 to-violet-50', ring: 'ring-indigo-100/60', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
    { label: 'Ảnh/project (TB)', value: summary.averagePhotosPerProject, icon: Camera, bg: 'from-teal-50 to-cyan-50', ring: 'ring-teal-100/60', text: 'text-teal-700', iconBg: 'bg-teal-100' },
    { label: 'Doanh thu', displayValue: formatCurrency(summary.totalPaidAmount), icon: ReceiptText, bg: 'from-orange-50 to-red-50', ring: 'ring-orange-100/60', text: 'text-orange-700', iconBg: 'bg-orange-100' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">

      {error && (
        <div className="flex animate-[slideDown_0.4s_ease-out] items-start gap-3 rounded-2xl border border-red-200/60 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3.5 text-sm text-red-700 shadow-sm">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Ban className="h-3 w-3" />
          </div>
          {error}
        </div>
      )}

      {/* ── Primary Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {primaryStats.map(({ label, value, icon: Icon, gradient, shadow }, index) => (
          <div
            key={label}
            className={cn(
              `group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg ${shadow} transition-all duration-500 hover:-translate-y-1 hover:shadow-xl`,
              vis[index] ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
            )}
          >
            {/* Decorative circles */}
            <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/5" />

            <div className="relative">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-3xl font-extrabold leading-none tabular-nums tracking-tight">
                {loading ? <Skeleton className="h-8 w-12 bg-white/20" /> : <AnimatedNumber target={value} />}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Donut Chart — Project Status Distribution */}
        <div
          className={cn(
            "group/panel relative overflow-hidden rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-700 hover:shadow-md hover:border-primary/15",
            vis[4] ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
          )}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100" />

          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-purple-100/80 shadow-sm">
              <PieChartIcon className="h-4.5 w-4.5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Phân bổ trạng thái project</h2>
              <p className="text-[11px] text-muted-foreground">Tỉ lệ theo trạng thái thanh toán</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-[180px] w-[180px] flex-shrink-0">
              {!loading && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      animationBegin={200}
                      animationDuration={1000}
                    >
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i]} className="transition-opacity duration-300 hover:opacity-80" />
                      ))}
                    </Pie>
                    <DonutCenterLabel total={summary.totalProjects} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {loading && (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-[160px] w-[160px] animate-pulse rounded-full bg-secondary" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              {donutData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full shadow-sm" style={{ background: DONUT_COLORS[i] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{entry.name}</p>
                    <p className="text-lg font-extrabold tabular-nums tracking-tight text-foreground">
                      {loading ? '–' : <AnimatedNumber target={entry.value} />}
                    </p>
                  </div>
                  {!loading && summary.totalProjects > 0 && (
                    <span className="text-xs font-bold text-muted-foreground/60 tabular-nums">
                      {Math.round((entry.value / summary.totalProjects) * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart — Project Comparison */}
        <div
          className={cn(
            "group/panel relative overflow-hidden rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-700 hover:shadow-md hover:border-primary/15",
            vis[5] ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
          )}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100" />

          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-sky-100/80 shadow-sm">
              <BarChart3 className="h-4.5 w-4.5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Tổng quan project</h2>
              <p className="text-[11px] text-muted-foreground">So sánh số lượng theo trạng thái</p>
            </div>
          </div>

          <div className="h-[200px]">
            {!loading ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91% / 0.6)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(215 16% 47%)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(210 40% 96% / 0.5)', radius: 8 }} />
                  <Bar
                    dataKey="value"
                    radius={[8, 8, 0, 0]}
                    animationBegin={300}
                    animationDuration={1000}
                  >
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-end gap-4 px-8 pb-6">
                {[60, 80, 40, 30].map((h, i) => (
                  <div key={i} className="flex-1 animate-pulse rounded-t-lg bg-secondary" style={{ height: `${h}%` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Payment Progress + Revenue ─────────────────────────── */}
      <div
        className={cn(
          "group/panel relative overflow-hidden rounded-2xl border border-border/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-700 hover:shadow-md hover:border-primary/15",
          vis[6] ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        )}
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-green-100/80 shadow-sm">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Tỉ lệ đã thanh toán</h2>
              <p className="text-[11px] text-muted-foreground">Tiến độ thu tiền project</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-primary tabular-nums">{summary.paidPercentage}%</span>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary/80">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-teal-400 transition-all duration-1000 ease-out"
            style={{ width: loading ? '0%' : `${summary.paidPercentage}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {summary.paidProjects} đã thanh toán
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-amber-600">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {summary.waitingProjects} chờ thanh toán
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-rose-600">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            {summary.cancelledProjects} đã hủy
          </span>
        </div>
      </div>

      {/* ── Secondary Stats Grid ───────────────────────────────── */}
      <div
        className={cn(
          "grid grid-cols-2 gap-3 md:grid-cols-4 transition-all duration-700",
          vis[7] ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        )}
      >
        {secondaryStats.map(({ label, value, displayValue, icon: Icon, bg, ring, text, iconBg }) => (
          <div
            key={label}
            className={cn(
              "group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 ring-1 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
              bg, ring,
            )}
          >
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-10" />

            <div className="flex items-start gap-3">
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105",
                iconBg, text,
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-lg font-extrabold tabular-nums tracking-tight", text)}>
                  {loading ? '–' : displayValue ?? <AnimatedNumber target={value ?? 0} />}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Lists ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        {/* Recent Users */}
        <div
          className={cn(
            "group/panel relative overflow-hidden rounded-2xl border border-border/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-700 hover:shadow-md hover:border-primary/15",
            vis[8] ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
          )}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100" />

          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100/80">
                <UserCheck className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Người dùng mới nhất</h2>
            </div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary/5"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border/40">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboard?.recentUsers.length ? (
            <div className="divide-y divide-border/40">
              {dashboard.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-5 py-3 transition-colors duration-200 hover:bg-slate-50/50">
                  <div className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm transition-transform duration-300 hover:scale-105",
                    user.role === 'admin' ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-gradient-to-br from-blue-500 to-cyan-500',
                  )}>
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
                    <span className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                      user.role === 'admin'
                        ? 'bg-slate-50 text-slate-700 ring-slate-200/60'
                        : 'bg-blue-50 text-blue-700 ring-blue-200/60',
                    )}>
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
                <Users className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="font-semibold text-foreground">Chưa có người dùng</p>
              <p className="mt-1 text-sm text-muted-foreground">Dữ liệu user mới sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div
          className={cn(
            "group/panel relative overflow-hidden rounded-2xl border border-border/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-700 hover:shadow-md hover:border-primary/15",
            vis[9] ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
          )}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400/20 to-transparent opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100" />

          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-50 to-purple-100/80">
                <FolderOpen className="h-4 w-4 text-violet-600" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Projects gần đây</h2>
            </div>
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary/5"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border/40">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : dashboard?.recentProjects.length ? (
            <div className="divide-y divide-border/40">
              {dashboard.recentProjects.map((project) => {
                const statusMeta = getProjectStatusMeta(project.status)

                return (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="group flex items-center gap-3 px-5 py-3 transition-colors duration-200 hover:bg-slate-50/50"
                >
                  <div className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105",
                    statusMeta.iconWrapClassName,
                  )}>
                    <FolderOpen className={cn("h-4 w-4", statusMeta.iconClassName)} />
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
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      statusMeta.badgeClassName,
                    )}>
                      <ProjectStatusIcon status={project.status} className="h-3 w-3" /> {statusMeta.shortLabel}
                    </span>
                    <p className={cn(
                      "mt-0.5 text-xs font-semibold",
                      project.paidAmount != null ? 'text-emerald-700' : project.status === 'cancelled' ? 'text-rose-700' : 'text-muted-foreground',
                    )}>
                      {project.paidAmount != null ? formatCurrency(project.paidAmount) : statusMeta.amountFallbackLabel}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/20 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary/40" />
                </Link>
                )
              })}
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Camera className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="font-semibold text-foreground">Chưa có project nào</p>
              <p className="mt-1 text-sm text-muted-foreground">Dữ liệu project mới sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
