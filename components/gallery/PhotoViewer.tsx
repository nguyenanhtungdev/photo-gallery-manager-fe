'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react'
import WatermarkCanvas from './WatermarkCanvas'
import { Photo } from '@/lib/mock-data'
import { downloadPhotos } from '@/lib/gallery-download'

interface PhotoViewerProps {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
  isPaid: boolean
  previewWidth?: number | null
}

export default function PhotoViewer({
  photos, initialIndex, onClose, isPaid, previewWidth = 720,
}: PhotoViewerProps) {
  const [current, setCurrent] = useState(initialIndex)
  const [imgRatio, setImgRatio] = useState<number | undefined>(undefined)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const photo = photos[current]
  const thumbStripRef = useRef<HTMLDivElement>(null)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])

  const prev = useCallback(() => setCurrent((i) => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setCurrent((i) => (i + 1) % photos.length), [photos.length])

  // Load aspect ratio for watermark positioning
  useEffect(() => {
    if (!photo || isPaid) return
    const img = new window.Image()
    img.onload = () => {
      if (img.naturalHeight > 0) setImgRatio(img.naturalWidth / img.naturalHeight)
    }
    img.src = photo.previewUrl
  }, [photo, isPaid])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  // Auto-scroll the thumbnail strip to keep current thumb visible
  useEffect(() => {
    const strip = thumbStripRef.current
    const thumb = thumbRefs.current[current]
    if (!strip || !thumb) return

    const stripRect = strip.getBoundingClientRect()
    const thumbRect = thumb.getBoundingClientRect()

    const scrollLeft =
      thumb.offsetLeft - strip.clientWidth / 2 + thumb.offsetWidth / 2

    strip.scrollTo({ left: scrollLeft, behavior: 'smooth' })

    void stripRect; void thumbRect // suppress unused-var warnings
  }, [current])

  if (!photo) return null

  async function handleDownloadCurrentPhoto() {
    try {
      setDownloadError(null)
      setDownloading(true)
      await downloadPhotos([photo], { forceArchive: false })
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Không thể tải ảnh lúc này')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="bg-white/10 rounded-full px-4 py-1.5 text-sm text-white font-medium">
          {current + 1} / {photos.length}
        </div>
        <div className="flex items-center gap-2">
          {isPaid && (
            <button
              type="button"
              onClick={() => void handleDownloadCurrentPhoto()}
              disabled={downloading}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-white" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Download error */}
      {downloadError && (
        <div className="flex-shrink-0 flex justify-center pb-1">
          <div className="rounded-full bg-red-500/90 px-4 py-2 text-xs font-medium text-white">
            {downloadError}
          </div>
        </div>
      )}

      {/* ── Main image area ── */}
      <div className="relative flex-1 flex items-center justify-center px-2 sm:px-16 min-h-0">
        <div
          className="relative w-full h-full"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          <Image
            src={isPaid ? photo.originalUrl : photo.previewUrl}
            alt={photo.filename}
            fill
            className={`object-contain rounded-xl ${!isPaid ? 'photo-protected' : ''}`}
            sizes={!isPaid && previewWidth ? `${previewWidth}px` : '(max-width: 1280px) 90vw, 1024px'}
            draggable={false}
            priority
            quality={!isPaid ? 60 : undefined}
            unoptimized={isPaid || !previewWidth}
          />

          {/* Watermark */}
          {!isPaid && (
            <WatermarkCanvas mode="contain" imageAspectRatio={imgRatio} />
          )}

          {/* Transparent click blocker (unpaid) */}
          {!isPaid && (
            <div className="absolute inset-0 z-20" onContextMenu={(e) => e.preventDefault()} />
          )}
        </div>

        {/* Prev / Next nav */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 sm:left-4 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 sm:right-4 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* ── Filename ── */}
      <p className="flex-shrink-0 text-center text-white/40 text-xs py-1.5 overflow-hidden text-ellipsis whitespace-nowrap px-8">
        {photo.filename}
      </p>

      {/* ── Thumbnail strip (Facebook-style) ── */}
      {photos.length > 1 && (
        <div className="flex-shrink-0 pb-4">
          <div
            ref={thumbStripRef}
            className="viewer-thumb-strip"
          >
            {photos.map((p, idx) => {
              const isActive = idx === current
              return (
                <button
                  key={p.id}
                  ref={(el) => { thumbRefs.current[idx] = el }}
                  type="button"
                  onClick={() => setCurrent(idx)}
                  className={`viewer-thumb ${isActive ? 'viewer-thumb-active' : 'viewer-thumb-idle'}`}
                  title={p.filename}
                >
                  <Image
                    src={isPaid ? p.originalUrl : p.previewUrl}
                    alt={p.filename}
                    fill
                    className="object-cover"
                    sizes="80px"
                    draggable={false}
                    unoptimized
                  />
                  {/* dim inactive */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:opacity-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
