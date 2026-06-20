'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import WatermarkCanvas from './WatermarkCanvas'
import { Photo } from '@/lib/mock-data'

interface PhotoViewerProps {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
  isPaid: boolean
}

export default function PhotoViewer({
  photos, initialIndex, onClose, isPaid,
}: PhotoViewerProps) {
  const [current, setCurrent] = useState(initialIndex)
  const photo = photos[current]

  const prev = useCallback(() => setCurrent((i) => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setCurrent((i) => (i + 1) % photos.length), [photos.length])

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-20 bg-black/50 rounded-full px-4 py-1.5 text-sm text-white font-medium">
        {current + 1} / {photos.length}
      </div>

      {/* Download (paid only) */}
      {isPaid && (
        <a
          href={photo.originalUrl}
          download={photo.filename}
          target="_blank"
          rel="noreferrer"
          className="absolute top-4 right-16 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <Download className="w-5 h-5 text-white" />
        </a>
      )}

      {/* Nav */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Image container */}
      <div className="relative max-w-5xl max-h-[85vh] w-full mx-16 rounded-xl overflow-hidden">
        <div
          className="relative w-full"
          style={{ paddingBottom: '66.6%' }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          <Image
            src={isPaid ? photo.originalUrl : photo.previewUrl}
            alt={photo.filename}
            fill
            className={`object-contain ${!isPaid ? 'photo-protected' : ''}`}
            sizes="(max-width: 1280px) 90vw, 1024px"
            draggable={false}
            priority
            unoptimized
          />

          {/* Watermark overlay (unpaid only) */}
          {!isPaid && (
            <>
              <WatermarkCanvas />
              {/* Transparent click blocker */}
              <div className="absolute inset-0 z-20" onContextMenu={(e) => e.preventDefault()} />
            </>
          )}
        </div>


      </div>

      {/* Filename */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
        {photo.filename}
      </p>
    </div>
  )
}
