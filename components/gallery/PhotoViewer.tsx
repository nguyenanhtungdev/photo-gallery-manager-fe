'use client'

import { useState, useCallback, useEffect } from 'react'
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

  const prev = useCallback(() => setCurrent((i) => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setCurrent((i) => (i + 1) % photos.length), [photos.length])

  // Load aspect ratio thực của ảnh hiện tại để watermark nằm đúng trên ảnh
  useEffect(() => {
    if (!photo || isPaid) return
    const img = new window.Image()
    img.onload = () => {
      if (img.naturalHeight > 0) setImgRatio(img.naturalWidth / img.naturalHeight)
    }
    img.src = photo.previewUrl
  }, [photo, isPaid])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3">
        <div className="bg-black/50 rounded-full px-4 py-1.5 text-sm text-white font-medium">
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
      {downloadError ? (
        <div className="absolute top-14 left-1/2 z-20 -translate-x-1/2 rounded-full bg-red-500/90 px-4 py-2 text-xs font-medium text-white">
          {downloadError}
        </div>
      ) : null}

      {/* Image area — fill available space */}
      <div className="relative w-full flex-1 flex items-center justify-center px-2 sm:px-16 pt-14 pb-10">
        {/* Image wrapper — tận dụng tối đa diện tích */}
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

        {/* Nav — overlay trên image area */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 sm:left-4 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 sm:right-4 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Filename */}
      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40 text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[80vw]">
        {photo.filename}
      </p>
    </div>
  )
}
