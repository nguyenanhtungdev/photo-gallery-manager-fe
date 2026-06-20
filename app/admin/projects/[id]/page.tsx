'use client'

import { use, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/mock-data'
import { formatDate, maskPhone } from '@/lib/utils'
import { getProject, updateProjectStatus } from '@/lib/projects-api'
import {
  ArrowLeft, CheckCircle2, Clock, Copy, ExternalLink, ImageIcon,
  Trash2, Upload, AlertTriangle, ScrollText, User, Phone, Calendar,
  ChevronRight,
} from 'lucide-react'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProject() {
      try {
        const data = await getProject(id)
        if (!active) return
        setProject(data)
        setError(null)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Không thể tải project')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadProject()
    return () => { active = false }
  }, [id])

  function copyLink() {
    if (!project) return
    const url = `${window.location.origin}/gallery/${project.shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function toggleStatus() {
    if (!project) return
    try {
      setUpdatingStatus(true)
      const nextStatus = project.status === 'paid' ? 'waiting_payment' : 'paid'
      const updatedProject = await updateProjectStatus(project.id, nextStatus)
      setProject(updatedProject)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái project')
    } finally {
      setUpdatingStatus(false)
    }
  }

  function removePhoto(photoId: string) {
    setProject((current) => {
      if (!current) return current
      return { ...current, photos: current.photos.filter((p) => p.id !== photoId) }
    })
  }

  if (loading) {
    return (
      <div className="p-4 pt-4 md:p-6">
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Đang tải thông tin project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">{error ?? 'Project không tồn tại'}</p>
        <Link href="/admin/projects" className="mt-2 inline-block text-sm text-primary">
          ← Quay lại
        </Link>
      </div>
    )
  }

  const isPaid = project.status === 'paid'

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:space-y-6 md:p-6">

      {/* ── Back link ── */}
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại Projects
      </Link>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Project header card ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {/* Colored top strip */}
        <div
          className="h-1.5 w-full"
          style={{
            background: isPaid
              ? 'linear-gradient(90deg, hsl(160,84%,39%), hsl(145,63%,49%))'
              : 'linear-gradient(90deg, hsl(38,92%,50%), hsl(43,96%,56%))',
          }}
        />

        <div className="p-4 md:p-6">
          {/* Name + badge row */}
          <div className="mb-3 flex flex-wrap items-start gap-2">
            <h1 className="text-lg font-bold leading-tight md:text-xl flex-1 min-w-0 pr-2">
              {project.name}
            </h1>
            {isPaid ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Đã thanh toán
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Clock className="h-3.5 w-3.5" /> Chờ thanh toán
              </span>
            )}
          </div>

          {/* Meta info pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" /> {project.clientName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /> {maskPhone(project.clientPhone)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> {formatDate(project.createdAt)}
            </span>
          </div>

          {/* Action buttons — full-width on mobile, inline on desktop */}
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-2">
            <button
              id="btn-toggle-status"
              onClick={() => void toggleStatus()}
              disabled={updatingStatus}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
                isPaid
                  ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
              }`}
            >
              {isPaid ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {updatingStatus ? 'Đang cập nhật...' : isPaid ? 'Đánh dấu chờ TT' : 'Đánh dấu đã TT'}
            </button>

            <div className="grid grid-cols-2 gap-2 sm:contents">
              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm font-medium transition-all hover:border-primary/40 hover:bg-secondary active:scale-95"
              >
                <Copy className="h-4 w-4" />
                {copied ? '✓ Đã copy!' : 'Copy link'}
              </button>

              <Link
                href={`/gallery/${project.shareToken}`}
                target="_blank"
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm font-medium transition-all hover:border-primary/40 hover:bg-secondary active:scale-95"
              >
                <ExternalLink className="h-4 w-4" /> Xem gallery
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Watermark warning banner ── */}
      {!isPaid && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Watermark bảo vệ đang BẬT</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
              Khách hàng chỉ thấy ảnh preview chất lượng thấp với watermark. Bật{' '}
              <span className="font-semibold">&quot;Đã thanh toán&quot;</span>{' '}
              để cho phép tải ảnh gốc.
            </p>
          </div>
        </div>
      )}

      {/* ── Photos section ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5 md:px-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <ImageIcon className="h-3.5 w-3.5 text-primary" />
            </span>
            Ảnh
            <span className="ml-0.5 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {project.photos.length}
            </span>
          </h2>
          <button
            id="btn-upload-photos"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
          >
            <Upload className="h-3.5 w-3.5" /> Upload ảnh
          </button>
        </div>

        <div className="p-4 md:p-6">
          {project.photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-14 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <ImageIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Chưa có ảnh nào</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Upload ảnh để bắt đầu</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
              {project.photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary shadow-sm">
                  <Image
                    src={photo.previewUrl}
                    alt={photo.filename}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="rounded-xl bg-red-500/90 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-red-600 active:scale-95"
                      title="Xoá ảnh"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-xs text-white">{photo.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Access logs section ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-4 py-3.5 md:px-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
              <ScrollText className="h-3.5 w-3.5 text-accent" />
            </span>
            Lịch sử truy cập
            <span className="ml-0.5 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {project.accessLogs.length}
            </span>
          </h2>
        </div>

        <div className="divide-y divide-border/60">
          {project.accessLogs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có lượt truy cập nào
            </p>
          ) : (
            project.accessLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-4 py-3 md:px-6"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary text-base">
                  🌐
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium font-mono">{log.ip}</p>
                  <p className="max-w-xs truncate text-xs text-muted-foreground">
                    {log.userAgent.slice(0, 55)}…
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {log.viewCount}×
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(log.viewedAt)}</span>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
