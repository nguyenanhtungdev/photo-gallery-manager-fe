'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserCircle, Camera, Mail, Phone, Lock, LogOut,
  CheckCircle2, Eye, EyeOff, Bell, Shield, ChevronRight,
} from 'lucide-react'

/* ─── Mock admin info ─────────────────────────────────────── */
const ADMIN = {
  name: 'Nguyễn Tuấn Dũng',
  email: 'admin@photogallery.vn',
  phone: '0912 345 678',
  role: 'Quản trị viên',
  joinedAt: 'Tháng 1, 2026',
  avatar: null as string | null,
}

/* ─── Input field ─────────────────────────────────────────── */
function Field({
  label, value, onChange, type = 'text', icon: Icon, readOnly = false,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  icon: React.ElementType
  readOnly?: boolean
}) {
  const [showPw, setShowPw] = useState(false)
  const inputType = type === 'password' ? (showPw ? 'text' : 'password') : type

  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type={inputType}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full pl-10 pr-${type === 'password' ? '10' : '4'} py-2.5 text-sm rounded-xl border border-border bg-white outline-none transition-all
            ${readOnly
              ? 'text-muted-foreground bg-secondary/30 cursor-default'
              : 'focus:border-primary focus:ring-2 focus:ring-primary/20'
            }`}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Section card ────────────────────────────────────────── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-secondary/30">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

/* ─── Main ────────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter()
  const [name,        setName]        = useState(ADMIN.name)
  const [phone,       setPhone]       = useState(ADMIN.phone)
  const [currentPw,   setCurrentPw]   = useState('')
  const [newPw,       setNewPw]       = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [saved,       setSaved]       = useState(false)
  const [pwSaved,     setPwSaved]     = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyView,  setNotifyView]  = useState(true)

  function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleSavePw(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw || newPw.length < 6) return
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2500)
  }

  function handleLogout() {
    router.push('/admin/login')
  }

  const initials = name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">

      {/* ── Header — desktop only ── */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl hero-gradient flex items-center justify-center shadow-sm shrink-0">
            <UserCircle className="w-4 h-4 text-white" />
          </span>
          Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1 ml-11.5">
          Quản lý thông tin tài khoản của bạn
        </p>
      </div>

      {/* ── Avatar card ── */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>
            <button
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
              title="Đổi ảnh đại diện"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">{name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{ADMIN.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                <Shield className="w-2.5 h-2.5" /> {ADMIN.role}
              </span>
              <span className="text-[10px] text-muted-foreground">Từ {ADMIN.joinedAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Thông tin cá nhân ── */}
      <SectionCard title="Thông tin cá nhân">
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <Field label="Họ và tên" value={name} onChange={setName} icon={UserCircle} />
          <Field label="Email" value={ADMIN.email} icon={Mail} readOnly />
          <Field label="Số điện thoại" value={phone} onChange={setPhone} type="tel" icon={Phone} />

          <div className="flex items-center justify-between pt-1">
            <div className={`flex items-center gap-1.5 text-xs transition-all duration-300 ${saved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu thành công
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Đổi mật khẩu ── */}
      <SectionCard title="Bảo mật & Mật khẩu">
        <form onSubmit={handleSavePw} className="space-y-4">
          <Field label="Mật khẩu hiện tại" value={currentPw} onChange={setCurrentPw} type="password" icon={Lock} />
          <Field label="Mật khẩu mới" value={newPw} onChange={setNewPw} type="password" icon={Lock} />
          <Field label="Xác nhận mật khẩu mới" value={confirmPw} onChange={setConfirmPw} type="password" icon={Lock} />

          {newPw && confirmPw && newPw !== confirmPw && (
            <p className="text-xs text-red-500">Mật khẩu không khớp</p>
          )}
          {newPw && newPw.length < 6 && (
            <p className="text-xs text-amber-500">Mật khẩu cần ít nhất 6 ký tự</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className={`flex items-center gap-1.5 text-xs transition-all duration-300 ${pwSaved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Mật khẩu đã được cập nhật
            </div>
            <button
              type="submit"
              disabled={!currentPw || !newPw || !confirmPw || newPw !== confirmPw || newPw.length < 6}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cập nhật
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Thông báo ── */}
      <SectionCard title="Thông báo">
        <div className="space-y-3">
          {[
            { label: 'Email khi có lượt xem mới', sub: 'Nhận email khi khách xem gallery', value: notifyEmail, set: setNotifyEmail },
            { label: 'Thông báo thanh toán', sub: 'Nhận thông báo khi trạng thái thay đổi', value: notifyView, set: setNotifyView },
          ].map(({ label, sub, value, set }) => (
            <div key={label} className="flex items-center justify-between py-0.5">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
              <button
                onClick={() => set((v) => !v)}
                className={`relative w-10 h-5.5 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Đăng xuất ── */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-between px-5 py-4 bg-white border border-border rounded-2xl shadow-sm hover:border-red-200 hover:bg-red-50 group transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-red-500">Đăng xuất</p>
            <p className="text-xs text-muted-foreground">Kết thúc phiên làm việc hiện tại</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
      </button>

      {/* Bottom spacing for mobile nav */}
      <div className="h-2" />
    </div>
  )
}
