'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MOCK_PROJECTS, Project, Photo } from '@/lib/mock-data'
import { formatDate, maskPhone } from '@/lib/utils'
import {
  ArrowLeft, CheckCircle2, Clock, Copy, ExternalLink, ImageIcon,
  Trash2, Upload, ToggleLeft, ToggleRight, AlertTriangle, ScrollText
} from 'lucide-react'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const found = MOCK_PROJECTS.find((p) => p.id === id)
  const [project, setProject] = useState<Project | null>(found || null)
  const [copied, setCopied] = useState(false)

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Project không tồn tại</p>
        <Link href="/admin/projects" className="text-primary text-sm mt-2 inline-block">← Quay lại</Link>
      </div>
    )
  }

  const isPaid = project.status === 'paid'

  function toggleStatus() {
    setProject({ ...project!, status: isPaid ? 'waiting_payment' : 'paid' })
  }

  function copyLink() {
    const url = `${window.location.origin}/gallery/${project!.shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function removePhoto(photoId: string) {
    setProject({ ...project!, photos: project!.photos.filter((p) => p.id !== photoId) })
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại Projects
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-bold">{project.name}</h1>
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-400/10 text-green-400 border border-green-400/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã thanh toán
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                  <Clock className="w-3.5 h-3.5" /> Chờ thanh toán
                </span>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>👤 {project.clientName} &nbsp;|&nbsp; 📞 {maskPhone(project.clientPhone)}</p>
              <p>📅 Tạo lúc: {formatDate(project.createdAt)}</p>
              {project.notes && <p>📝 {project.notes}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              id="btn-toggle-status"
              onClick={toggleStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isPaid
                  ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20'
                  : 'bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20'
              }`}
            >
              {isPaid ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {isPaid ? 'Đánh dấu chờ TT' : 'Đánh dấu đã TT'}
            </button>

            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-secondary/60 border border-border hover:border-primary/40 transition-all"
            >
              <Copy className="w-4 h-4" />
              {copied ? '✓ Đã copy!' : 'Copy link khách'}
            </button>

            <Link
              href={`/gallery/${project.shareToken}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-secondary/60 border border-border hover:border-primary/40 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Xem gallery
            </Link>
          </div>
        </div>
      </div>

      {/* Payment status banner */}
      {!isPaid && (
        <div className="flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-400">Watermark bảo vệ đang BẬT</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Khách hàng chỉ thấy ảnh preview chất lượng thấp với watermark. Bật "Đã thanh toán" để cho phép tải ảnh gốc.
            </p>
          </div>
        </div>
      )}

      {/* Photos */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            Ảnh ({project.photos.length})
          </h2>
          <button
            id="btn-upload-photos"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
          >
            <Upload className="w-4 h-4" /> Upload ảnh
          </button>
        </div>

        {project.photos.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Chưa có ảnh nào</p>
            <p className="text-muted-foreground text-xs mt-1">Upload ảnh để bắt đầu</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {project.photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-secondary">
                <Image
                  src={photo.previewUrl}
                  alt={photo.filename}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="bg-destructive/80 hover:bg-destructive text-white p-2 rounded-lg transition-colors"
                    title="Xoá ảnh"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{photo.filename}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Access Logs */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-5">
          <ScrollText className="w-4 h-4 text-accent" />
          Lịch sử truy cập ({project.accessLogs.length})
        </h2>
        {project.accessLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">Chưa có lượt truy cập nào</p>
        ) : (
          <div className="space-y-2">
            {project.accessLogs.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs">🌐</div>
                  <div>
                    <p className="text-sm font-mono font-medium">{log.ip}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{log.userAgent.slice(0, 60)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{log.viewCount} lần xem</span>
                  <span className="text-xs">{formatDate(log.viewedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
