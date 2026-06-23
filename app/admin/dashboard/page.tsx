'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Camera, CheckCircle2, ChevronRight, Clock, FolderOpen,
  ImageIcon, ReceiptText, Shield, UserCheck, Users,
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

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const data = await getAdminDashboardOverview()
        if (!active) {
          return
        }

        setDashboard(data)
        setError(null)
      } catch (err) {
        if (!active) {
          return
        }

        setError(err instanceof Error ? err.message : 'Không thể tải dashboard admin')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()
    return () => {
      active = false
    }
  }, [])

  const summary = dashboard?.summary ?? EMPTY_SUMMARY
  const primaryStats = [
    {
      label: 'Tổng người dùng',
      value: summary.totalUsers,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Admin',
      value: summary.totalAdmins,
      icon: Shield,
      gradient: 'from-slate-700 to-slate-900',
    },
    {
      label: 'Phiên hoạt động',
      value: summary.activeSessions,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-green-500',
    },
    {
      label: 'Tổng project',
      value: summary.totalProjects,
      icon: FolderOpen,
      gradient: 'from-violet-500 to-fuchsia-500',
    },
  ]

  const secondaryStats = [
    {
      label: 'Đã thanh toán',
      value: summary.paidProjects,
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Chờ thanh toán',
      value: summary.waitingProjects,
      icon: Clock,
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: 'Tổng ảnh',
      value: summary.totalPhotos,
      icon: ImageIcon,
      tone: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(summary.totalPaidAmount),
      icon: ReceiptText,
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-6 md:py-7">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Tổng quan người dùng, phiên đăng nhập và hiệu suất hệ thống ảnh.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu dashboard admin...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {primaryStats.map(({ label, value, icon: Icon, gradient }) => (
              <div
                key={label}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-md`}
              >
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-3xl font-bold leading-none">{value}</p>
                  <p className="mt-1 text-[11px] font-medium leading-snug text-white/75">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Tỉ lệ project đã thanh toán</p>
                <span className="text-sm font-bold text-primary">{summary.paidPercentage}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="hero-gradient h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${summary.paidPercentage}%` }}
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
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Lượt xem gallery</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{summary.totalViewSessions}</p>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Ảnh / project</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{summary.averagePhotosPerProject}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {secondaryStats.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${tone}`}>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/80">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{value}</p>
                    <p className="text-xs opacity-80">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                <h2 className="text-sm font-semibold text-foreground">Người dùng mới / gần đây</h2>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Xem danh sách <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {dashboard?.recentUsers.length ? (
                <div className="divide-y divide-border/60">
                  {dashboard.recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
                        user.role === 'admin' ? 'bg-slate-800' : 'hero-gradient'
                      }`}>
                        {(user.name || user.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.name || user.username}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          @{user.username} • {user.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {formatRole(user.role)}
                        </span>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {user.lastLoginAt ? `Login ${formatDate(user.lastLoginAt)}` : 'Chưa đăng nhập'}
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
                  <p className="font-medium text-foreground">Chưa có người dùng nào</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dữ liệu user mới sẽ xuất hiện tại đây.
                  </p>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                <h2 className="text-sm font-semibold text-foreground">Projects gần đây</h2>
                <Link
                  href="/admin/projects"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Xem projects <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {dashboard?.recentProjects.length ? (
                <div className="divide-y divide-border/60">
                  {dashboard.recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/admin/projects/${project.id}`}
                      className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40 active:bg-secondary"
                    >
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                        project.status === 'paid'
                          ? 'bg-green-50 group-hover:bg-green-100'
                          : 'bg-amber-50 group-hover:bg-amber-100'
                      }`}>
                        <FolderOpen className={`h-4 w-4 ${project.status === 'paid' ? 'text-green-600' : 'text-amber-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                          {project.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {project.clientName} • {project.photoCount} ảnh
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project.owner ? `Owner: @${project.owner.username}` : 'Owner không xác định'} • {formatDate(project.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          project.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {project.status === 'paid' ? 'Đã TT' : 'Chờ TT'}
                        </span>
                        {project.paidAmount != null ? (
                          <p className="mt-1 text-xs font-medium text-emerald-700">
                            {formatCurrency(project.paidAmount)}
                          </p>
                        ) : null}
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <Camera className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">Chưa có project nào</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dữ liệu project mới sẽ xuất hiện tại đây.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
