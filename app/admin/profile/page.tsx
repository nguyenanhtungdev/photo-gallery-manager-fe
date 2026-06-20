'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  UserCircle, Camera, Mail, Phone, LogOut,
  CheckCircle2, Shield, ChevronRight, KeyRound,
} from 'lucide-react'
import { clearSession, getStoredSession } from '@/lib/auth'

const DEFAULT_PHONE = 'Chưa cập nhật'
const ADMIN_ROLE = 'Quản trị viên'

/* ─── Toggle switch ───────────────────────────────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={value}
      className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-primary' : 'bg-border'}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}

/* ─── Main ────────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter()
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [username,    setUsername]    = useState('')
  const [phone,       setPhone]       = useState(DEFAULT_PHONE)
  const [joinedAt,    setJoinedAt]    = useState('')
  const [infoSaved,   setInfoSaved]   = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyView,  setNotifyView]  = useState(true)

  useEffect(() => {
    const session = getStoredSession()
    if (!session) { router.replace('/admin/login'); return }
    setName(session.user.name || session.user.username)
    setEmail(session.user.email)
    setUsername(session.user.username)
    setJoinedAt(formatJoinDate(session.user.createdAt))
  }, [router])

  function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault()
    setInfoSaved(true)
    setTimeout(() => setInfoSaved(false), 2500)
  }

  function handleLogout() {
    clearSession()
    router.replace('/admin/login')
  }

  const initials = (name || username || 'AD')
    .split(' ').filter(Boolean).slice(-2)
    .map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">

      {/* ── Desktop header ── */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl hero-gradient flex items-center justify-center shadow-sm shrink-0">
            <UserCircle className="w-4 h-4 text-white" />
          </span>
          Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1 ml-11">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* ── Avatar card ── */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
            <button
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
              title="Đổi ảnh đại diện"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">{name || username}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                <Shield className="w-2.5 h-2.5" /> {ADMIN_ROLE}
              </span>
              <span className="text-[10px] text-muted-foreground">Từ {joinedAt || 'Vừa tạo'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Thông tin cá nhân ── */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <h2 className="text-sm font-semibold">Thông tin cá nhân</h2>
        </div>
        <form onSubmit={handleSaveInfo} className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Họ tên */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-secondary/40 outline-none transition-all focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            {/* SĐT */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-secondary/40 outline-none transition-all focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={email}
                  readOnly
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-secondary/20 text-muted-foreground cursor-default"
                />
              </div>
            </div>

            {/* Username (readonly) */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={username}
                  readOnly
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-secondary/20 text-muted-foreground cursor-default"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className={`flex items-center gap-1.5 text-xs transition-opacity duration-300 ${infoSaved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu thành công
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/20"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* ── Bảo mật — nav row ── */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <h2 className="text-sm font-semibold">Bảo mật</h2>
        </div>
        <Link
          href="/admin/profile/change-password"
          className="flex items-center justify-between px-4 py-4 hover:bg-secondary/30 transition-colors group active:bg-secondary/50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <KeyRound className="w-4 h-4 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold">Đổi mật khẩu</p>
              <p className="text-xs text-muted-foreground">Cập nhật mật khẩu đăng nhập</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* ── Thông báo ── */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <h2 className="text-sm font-semibold">Thông báo</h2>
        </div>
        <div className="divide-y divide-border/60">
          {([
            { label: 'Email khi có lượt xem mới', sub: 'Nhận email khi khách xem gallery', value: notifyEmail, set: () => setNotifyEmail((v) => !v) },
            { label: 'Thông báo thanh toán', sub: 'Nhận thông báo khi trạng thái thay đổi', value: notifyView, set: () => setNotifyView((v) => !v) },
          ]).map(({ label, sub, value, set }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
              <Toggle value={value} onChange={set} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Đăng xuất ── */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-border rounded-2xl shadow-sm hover:border-red-200 hover:bg-red-50 group transition-all active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-red-500">Đăng xuất</p>
            <p className="text-xs text-muted-foreground">Kết thúc phiên làm việc</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
      </button>

      <div className="h-2" />
    </div>
  )
}

function formatJoinDate(value: string) {
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date)
}
