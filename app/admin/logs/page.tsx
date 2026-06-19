'use client'

import { MOCK_PROJECTS } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import {
  ScrollText, Monitor, Smartphone, Globe,
  Activity, Users, Eye, Wifi,
  Clock, BarChart2,
} from 'lucide-react'
import { useState, useMemo } from 'react'

/* ─── Device parsing ─────────────────────────────────────── */
type DeviceType = 'ios' | 'android' | 'windows' | 'mac' | 'unknown'
type DeviceInfo = { label: string; type: DeviceType }

function parseDevice(ua: string): DeviceInfo {
  if (/iPhone|iPad/.test(ua))  return { label: 'iOS',     type: 'ios' }
  if (/Android/.test(ua))      return { label: 'Android', type: 'android' }
  if (/Macintosh/.test(ua))    return { label: 'macOS',   type: 'mac' }
  if (/Windows/.test(ua))      return { label: 'Windows', type: 'windows' }
  return                               { label: 'Unknown', type: 'unknown' }
}

const DEVICE_STYLES: Record<DeviceType, { bg: string; text: string; icon: React.ReactNode }> = {
  ios:     { bg: 'bg-slate-100',  text: 'text-slate-600',  icon: <Smartphone className="w-3 h-3" /> },
  android: { bg: 'bg-green-50',   text: 'text-green-700',  icon: <Smartphone className="w-3 h-3" /> },
  mac:     { bg: 'bg-purple-50',  text: 'text-purple-700', icon: <Monitor className="w-3 h-3" />   },
  windows: { bg: 'bg-blue-50',    text: 'text-blue-700',   icon: <Monitor className="w-3 h-3" />   },
  unknown: { bg: 'bg-gray-50',    text: 'text-gray-500',   icon: <Globe className="w-3 h-3" />     },
}

function DeviceBadge({ ua }: { ua: string }) {
  const d = parseDevice(ua)
  const s = DEVICE_STYLES[d.type]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.icon}{d.label}
    </span>
  )
}

function ViewBadge({ count }: { count: number }) {
  const heat = count >= 6
    ? 'bg-red-100 text-red-600'
    : count >= 3
    ? 'bg-amber-100 text-amber-600'
    : 'bg-blue-50 text-blue-500'
  return (
    <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold ${heat}`}>
      {count}
    </span>
  )
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / (max || 1)) * 100)
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-5 text-right">{value}</span>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
export default function LogsPage() {
  const [filter, setFilter] = useState<'all' | DeviceType>('all')
  const [search, setSearch]  = useState('')

  const allLogs = useMemo(() =>
    MOCK_PROJECTS.flatMap((p) =>
      p.accessLogs.map((log) => ({
        ...log,
        projectName:   p.name,
        clientName:    p.clientName,
        projectStatus: p.status,
      }))
    ).sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()),
    []
  )

  const totalViews = allLogs.reduce((acc, l) => acc + l.viewCount, 0)
  const uniqueIPs  = new Set(allLogs.map((l) => l.ip)).size

  const projectSummary = useMemo(() => {
    const map: Record<string, { name: string; sessions: number; views: number }> = {}
    allLogs.forEach((l) => {
      if (!map[l.projectName]) map[l.projectName] = { name: l.projectName, sessions: 0, views: 0 }
      map[l.projectName].sessions++
      map[l.projectName].views += l.viewCount
    })
    return Object.values(map).sort((a, b) => b.views - a.views)
  }, [allLogs])

  const filtered = useMemo(() => {
    let list = allLogs
    if (filter !== 'all') list = list.filter((l) => parseDevice(l.userAgent).type === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((l) =>
        l.projectName.toLowerCase().includes(q) ||
        l.clientName.toLowerCase().includes(q)  ||
        l.ip.includes(q)
      )
    }
    return list
  }, [allLogs, filter, search])

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'all',     label: 'Tất cả' },
    { key: 'ios',     label: 'iOS' },
    { key: 'android', label: 'Android' },
    { key: 'windows', label: 'Windows' },
    { key: 'mac',     label: 'macOS' },
  ]

  const topIPs = Array.from(
    allLogs.reduce((acc, l) => {
      acc.set(l.ip, (acc.get(l.ip) ?? 0) + l.viewCount)
      return acc
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]).slice(0, 4)

  const maxProjectViews = Math.max(...projectSummary.map((x) => x.views), 1)

  /* ── Sidebar JSX (reused in both mobile & desktop) ─────── */
  const SidebarContent = (
    <div className="space-y-4">
      {/* Project views */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Lượt xem theo project</h3>
        </div>
        <div className="space-y-3">
          {projectSummary.map((p) => (
            <div key={p.name}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="font-medium text-foreground truncate max-w-[68%]">{p.name}</span>
                <span className="text-muted-foreground shrink-0">{p.sessions} session</span>
              </div>
              <MiniBar value={p.views} max={maxProjectViews} />
            </div>
          ))}
        </div>
      </div>

      {/* Device breakdown */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Thiết bị truy cập</h3>
        </div>
        <div className="space-y-2.5">
          {(
            [
              { type: 'ios',     label: 'iOS',     color: 'bg-slate-400' },
              { type: 'android', label: 'Android', color: 'bg-green-400' },
              { type: 'windows', label: 'Windows', color: 'bg-blue-400' },
              { type: 'mac',     label: 'macOS',   color: 'bg-purple-400' },
            ] as const
          ).map(({ type, label, color }) => {
            const cnt = allLogs.filter((l) => parseDevice(l.userAgent).type === type).length
            if (cnt === 0) return null
            const pct = Math.round((cnt / allLogs.length) * 100)
            return (
              <div key={type} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">{cnt} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top IPs */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">IP hoạt động nhiều</h3>
        </div>
        <div className="space-y-1.5">
          {topIPs.map(([ip, views]) => (
            <div key={ip} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <code className="text-xs font-mono text-foreground/80">{ip}</code>
              <span className="text-xs font-semibold text-primary">{views} lần</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2.5">
            <span className="w-8 h-8 md:w-9 md:h-9 rounded-xl hero-gradient flex items-center justify-center shadow-sm shrink-0">
              <ScrollText className="w-4 h-4 text-white" />
            </span>
            Access Logs
          </h1>
          {/* Search — hidden on smallest phones, shown from xs up */}
          <div className="relative hidden sm:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm project, client, IP…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-48 md:w-56 transition-all"
            />
          </div>
        </div>

        {/* Search — full-width on smallest screens */}
        <div className="relative sm:hidden">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm project, client, IP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full transition-all"
          />
        </div>

        <p className="text-muted-foreground text-xs md:text-sm">
          Theo dõi lượt truy cập của khách hàng theo thời gian thực
        </p>
      </div>

      {/* ── Stats ── */}
      {/* On mobile: horizontal scroll so all 3 cards visible in a row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3.5 md:p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-blue-100 text-xs font-medium">Sessions</p>
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Activity className="w-3 h-3 md:w-4 md:h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold">{allLogs.length}</p>
          <p className="text-blue-200 text-[10px] md:text-xs mt-0.5 md:mt-1 leading-tight">lượt truy cập</p>
        </div>

        <div className="rounded-2xl p-3.5 md:p-5 bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-md shadow-cyan-200">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-cyan-100 text-xs font-medium">Lần xem</p>
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Eye className="w-3 h-3 md:w-4 md:h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold">{totalViews}</p>
          <p className="text-cyan-200 text-[10px] md:text-xs mt-0.5 md:mt-1 leading-tight">tổng lượt xem</p>
        </div>

        <div className="rounded-2xl p-3.5 md:p-5 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-purple-200">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-purple-100 text-xs font-medium">IP</p>
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Wifi className="w-3 h-3 md:w-4 md:h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold">{uniqueIPs}</p>
          <p className="text-purple-200 text-[10px] md:text-xs mt-0.5 md:mt-1 leading-tight">duy nhất</p>
        </div>
      </div>

      {/* ── Body: two-column on desktop, stacked on mobile ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Log list (left / top) ── */}
        <div className="lg:col-span-2 space-y-3">

          {/* Filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === f.key
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'bg-white border border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
                }`}
              >
                {f.label}
                {f.key === 'all' && <span className="ml-1.5 opacity-70">{allLogs.length}</span>}
              </button>
            ))}
          </div>

          {/* ── DESKTOP table (hidden on mobile) ── */}
          <div className="hidden md:block bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project / Khách</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thiết bị</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thời gian</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Xem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary to-accent flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                          <div>
                            <p className="text-sm font-semibold leading-tight">{log.projectName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{log.clientName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <code className="text-xs bg-secondary px-2 py-1 rounded-md font-mono text-foreground/80">{log.ip}</code>
                      </td>
                      <td className="px-4 py-3.5">
                        <DeviceBadge ua={log.userAgent} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {formatDate(log.viewedAt)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ViewBadge count={log.viewCount} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-14">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <ScrollText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium">Không tìm thấy log nào</p>
                <p className="text-muted-foreground text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa</p>
              </div>
            )}

            {filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Hiển thị <span className="font-semibold text-foreground">{filtered.length}</span> / {allLogs.length} logs
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Cập nhật tự động
                </div>
              </div>
            )}
          </div>

          {/* ── MOBILE cards (hidden on desktop) ── */}
          <div className="md:hidden space-y-2.5">
            {filtered.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl text-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <ScrollText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">Không tìm thấy log nào</p>
                <p className="text-muted-foreground text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa</p>
              </div>
            ) : (
              <>
                {filtered.map((log) => {
                  const d = parseDevice(log.userAgent)
                  const s = DEVICE_STYLES[d.type]
                  return (
                    <div key={log.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                      {/* Top row: project + view badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-1 h-9 rounded-full bg-gradient-to-b from-primary to-accent flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-tight truncate">{log.projectName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{log.clientName}</p>
                          </div>
                        </div>
                        <ViewBadge count={log.viewCount} />
                      </div>

                      {/* Bottom row: IP, device, time */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <code className="text-xs bg-secondary px-2 py-1 rounded-md font-mono text-foreground/80">
                          {log.ip}
                        </code>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                          {s.icon}{d.label}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {formatDate(log.viewedAt)}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Mobile footer */}
                <div className="flex items-center justify-between px-1 pt-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{filtered.length}</span> / {allLogs.length} logs
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Cập nhật tự động
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Sidebar (right on desktop, below on mobile) ── */}
        <div>{SidebarContent}</div>
      </div>
    </div>
  )
}
