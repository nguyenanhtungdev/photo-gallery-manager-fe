'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FolderOpen, ImageIcon, Clock, CheckCircle2,
  TrendingUp, ArrowRight, ChevronRight, Camera,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getDashboardOverview, type DashboardOverview } from '@/lib/dashboard-api'

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const data = await getDashboardOverview()
        if (!active) {
          return
        }

        setDashboard(data)
        setError(null)
      } catch (err) {
        if (!active) {
          return
        }

        setError(err instanceof Error ? err.message : 'Không thể tải dashboard')
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

  const summary = dashboard?.summary ?? {
    totalProjects: 0,
    paidProjects: 0,
    waitingProjects: 0,
    totalPhotos: 0,
    totalViewSessions: 0,
    totalPaidAmount: 0,
    paidPercentage: 0,
    averagePhotosPerProject: 0,
  }

  const stats = [
    {
      label: 'Tổng Projects',
      value: summary.totalProjects,
      icon: FolderOpen,
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-200',
    },
    {
      label: 'Đã thanh toán',
      value: summary.paidProjects,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-green-500',
      shadow: 'shadow-emerald-200',
    },
    {
      label: 'Chờ thanh toán',
      value: summary.waitingProjects,
      icon: Clock,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-200',
    },
    {
      label: 'Tổng ảnh',
      value: summary.totalPhotos,
      icon: ImageIcon,
      gradient: 'from-sky-400 to-cyan-500',
      shadow: 'shadow-sky-200',
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 md:px-6 md:py-7">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Tổng quan hệ thống quản lý ảnh</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, gradient, shadow }) => (
              <div
                key={label}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-md ${shadow}`}
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

          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Tỉ lệ thanh toán</p>
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
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/80">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-emerald-700">{formatCurrency(summary.totalPaidAmount)}</p>
                <p className="text-xs text-emerald-700/80">Tổng tiền đã thu</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{summary.totalViewSessions}</p>
                <p className="text-xs text-muted-foreground">Lượt xem</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <ImageIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{summary.averagePhotosPerProject}</p>
                <p className="text-xs text-muted-foreground">Ảnh / project</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <h2 className="text-sm font-semibold text-foreground">Projects gần đây</h2>
              <Link
                href="/admin/projects"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Xem tất cả <ArrowRight className="h-3 w-3" />
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
                        {project.clientName} • {project.photoCount} ảnh • {formatDate(project.createdAt)}
                      </p>
                      {project.paidAmount != null ? (
                        <p className="mt-1 text-xs font-medium text-emerald-700">
                          Đã thu {formatCurrency(project.paidAmount)}
                        </p>
                      ) : null}
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      project.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {project.status === 'paid' ? 'Đã TT' : 'Chờ TT'}
                    </span>
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
                  Tạo project đầu tiên để bắt đầu theo dõi dashboard.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
