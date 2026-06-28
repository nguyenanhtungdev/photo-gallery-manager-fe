'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Ban, CheckCircle2, Clock, FolderOpen, ImageIcon, ReceiptText, RefreshCcw } from 'lucide-react'
import { getProjectStatusMeta } from '@/lib/project-status'
import { ProjectStatusIcon } from '@/lib/project-status-icons'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  getUserDashboardOverview,
  type UserDashboardOverview,
} from '@/lib/dashboard-api'

const EMPTY_SUMMARY = {
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

export default function UserDashboardPage() {
  const [dashboard, setDashboard] = useState<UserDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const data = await getUserDashboardOverview()
        if (!active) {
          return
        }

        setDashboard(data)
        setError(null)
      } catch (err) {
        if (!active) {
          return
        }

        setError(err instanceof Error ? err.message : 'Không thể tải dashboard user')
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
  const cancellationRateLabel = Number.isFinite(dashboard?.summary?.cancellationRate)
    ? `${dashboard?.summary?.cancellationRate}%`
    : 'NA'

  const stats = [
    {
      label: 'Tổng project',
      value: summary.totalProjects,
      meta: `${summary.totalPhotos} ảnh`,
      icon: FolderOpen,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Đã thanh toán',
      value: summary.paidProjects,
      icon: CheckCircle2,
      gradient: 'from-slate-700 to-slate-900',
    },
    {
      label: 'Chờ thanh toán',
      value: summary.waitingProjects,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Đã hủy',
      value: summary.cancelledProjects,
      icon: Ban,
      gradient: 'from-rose-500 to-red-500',
    },
    {
      label: 'Tỷ lệ hủy',
      value: cancellationRateLabel,
      meta: `${summary.cancelledProjects} hủy / ${summary.paidProjects} thanh toán`,
      icon: Ban,
      gradient: 'from-fuchsia-500 to-pink-500',
    },
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(summary.totalPaidAmount),
      icon: ReceiptText,
      gradient: 'from-rose-500 to-pink-500',
    },
  ]

  const secondaryStats = [
    {
      label: 'Lượt xem gallery',
      value: summary.totalViewSessions,
      tone: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: RefreshCcw,
    },
    {
      label: 'Ảnh / project',
      value: summary.averagePhotosPerProject,
      tone: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: ImageIcon,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-6 md:py-7">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Thống kê project và hiệu suất của riêng bạn.
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
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {stats.map(({ label, value, meta, icon: Icon, gradient }) => (
              <div
                key={label}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-md`}
              >
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="break-words text-3xl font-bold leading-none">{value}</p>
                  <p className="mt-1 text-[11px] font-medium leading-snug text-white/75">{label}</p>
                  {meta ? (
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-white/90">{meta}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {secondaryStats.map(({ label, value, tone, icon: Icon }) => (
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

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <h2 className="text-sm font-semibold text-foreground">Project gần đây</h2>
              <Link
                href="/projects"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Xem danh sách <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {dashboard?.recentProjects.length ? (
              <div className="divide-y divide-border/60">
                {dashboard.recentProjects.map((project) => {
                  const statusMeta = getProjectStatusMeta(project.status)

                  return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40 active:bg-secondary"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl hero-gradient text-sm font-bold text-white">
                      {project.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {project.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {project.clientName} • {project.photoCount} ảnh • {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}>
                        <ProjectStatusIcon status={project.status} className="h-3 w-3" />
                        {statusMeta.shortLabel}
                      </span>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {project.paidAmount != null ? formatCurrency(project.paidAmount) : statusMeta.amountFallbackLabel}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  )
                })}
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <FolderOpen className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Chưa có project nào</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Các project mới của bạn sẽ hiển thị ở đây.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
