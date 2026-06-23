'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2, ChevronLeft, ChevronRight, Clock, FolderOpen, Search,
  Shield, User, Users,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  listUsers,
  type AdminUser,
  type AdminUserRole,
} from '@/lib/users-api'

const PAGE_SIZE = 15

const INITIAL_PAGINATION = {
  offset: 0,
  limit: PAGE_SIZE,
  total: 0,
  hasMore: false,
  nextOffset: 0,
}

function getInitials(user: AdminUser) {
  const source = user.name || user.username
  return source.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
]

function avatarColor(id: string) {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) & 0xffffffff
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatRole(role: AdminUserRole) {
  return role === 'admin' ? 'Admin' : 'User'
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | AdminUserRole>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState(INITIAL_PAGINATION)

  const requestIdRef = useRef(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  async function loadUsers({
    search,
    role,
    offset,
  }: {
    search: string
    role: 'all' | AdminUserRole
    offset: number
  }) {
    const requestId = ++requestIdRef.current

    if (offset === 0) {
      setLoading(true)
      setError(null)
    }

    try {
      const data = await listUsers({
        search: search || undefined,
        role: role === 'all' ? undefined : role,
        offset,
        limit: PAGE_SIZE,
      })

      if (requestId !== requestIdRef.current) {
        return
      }

      setUsers(data.users)
      setPagination(data.pagination)
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return
      }

      setError(err instanceof Error ? err.message : 'Không thể tải danh sách người dùng')
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers({
        search: searchQuery,
        role: roleFilter,
        offset: 0,
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [searchQuery, roleFilter])

  const page = pagination.offset / PAGE_SIZE + 1
  const totalPages = Math.max(1, Math.ceil(pagination.total / PAGE_SIZE))
  const pageUsersSummary = useMemo(() => {
    return users.reduce(
      (accumulator, user) => {
        if (user.role === 'admin') {
          accumulator.admins += 1
        } else {
          accumulator.users += 1
        }

        accumulator.projects += user.projectStats.projectCount
        accumulator.paidProjects += user.projectStats.paidProjectCount
        return accumulator
      },
      {
        admins: 0,
        users: 0,
        projects: 0,
        paidProjects: 0,
      },
    )
  }, [users])

  function goToPage(nextPage: number) {
    void loadUsers({
      search: searchQuery,
      role: roleFilter,
      offset: (nextPage - 1) * PAGE_SIZE,
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:px-6 md:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="hidden md:block">
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Shield className="h-5 w-5 text-primary" /> Quản lý người dùng
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading ? 'Đang tải dữ liệu...' : `${pagination.total} tài khoản trong hệ thống`}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void loadUsers({ search: searchQuery, role: roleFilter, offset: 0 })}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Tải lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{pagination.total}</p>
          <p className="text-xs text-muted-foreground">Tổng tài khoản</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Shield className="h-5 w-5 text-slate-700" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{pageUsersSummary.admins}</p>
          <p className="text-xs text-muted-foreground">Admin trong trang hiện tại</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
            <FolderOpen className="h-5 w-5 text-violet-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{pageUsersSummary.projects}</p>
          <p className="text-xs text-muted-foreground">Project của trang hiện tại</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{pageUsersSummary.paidProjects}</p>
          <p className="text-xs text-muted-foreground">Project đã thanh toán</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Tìm theo tên, username, email..."
            className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value as 'all' | AdminUserRole)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={() => void loadUsers({ search: searchQuery, role: roleFilter, offset: 0 })}
            className="mt-3 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            Thử lại
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-20 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Không có người dùng phù hợp</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Hãy thử đổi từ khóa tìm kiếm hoặc bộ lọc vai trò.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vai trò</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Doanh thu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Đăng nhập gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarColor(user.id)} text-xs font-bold text-white shadow-sm`}>
                          {getInitials(user)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{user.name || 'Chưa đặt tên'}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">@{user.username}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {formatRole(user.role)}
                      </span>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Tạo lúc {formatDate(user.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{user.projectStats.projectCount} project</p>
                      <p className="mt-1 text-xs text-emerald-700">
                        {user.projectStats.paidProjectCount} đã thanh toán
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        {user.projectStats.waitingProjectCount} chờ thanh toán
                      </p>
                      <p className="mt-1 text-xs">
                        {user.projectStats.totalPhotos} ảnh • {user.projectStats.totalViewSessions} lượt xem
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {formatCurrency(user.projectStats.totalPaidAmount)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {user.projectStats.lastProjectAt
                          ? `Project gần nhất ${formatDate(user.projectStats.lastProjectAt)}`
                          : 'Chưa có project'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top text-sm text-muted-foreground">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Chưa đăng nhập'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarColor(user.id)} text-sm font-bold text-white shadow-sm`}>
                    {getInitials(user)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{user.name || 'Chưa đặt tên'}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        user.role === 'admin'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {formatRole(user.role)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">@{user.username}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-[11px] text-muted-foreground">Project</p>
                    <p className="mt-1 text-base font-bold text-foreground">{user.projectStats.projectCount}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-[11px] text-muted-foreground">Doanh thu</p>
                    <p className="mt-1 text-base font-bold text-foreground">{formatCurrency(user.projectStats.totalPaidAmount)}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {user.projectStats.paidProjectCount} project đã thanh toán
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    {user.projectStats.waitingProjectCount} project chờ thanh toán
                  </p>
                  <p className="flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-violet-600" />
                    {user.projectStats.totalPhotos} ảnh • {user.projectStats.totalViewSessions} lượt xem
                  </p>
                  <p className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    {user.lastLoginAt ? `Đăng nhập ${formatDate(user.lastLoginAt)}` : 'Chưa đăng nhập'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-muted-foreground">
              Trang {page}/{totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Trước
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
