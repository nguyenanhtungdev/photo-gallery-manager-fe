'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Photo, Project } from '@/lib/mock-data'
import { PHOTO_BATCH_SIZE } from '@/lib/image-resize'
import WatermarkCanvas from './WatermarkCanvas'
import PhotoViewer from './PhotoViewer'
import { Download, ZoomIn, Lock, Loader2 } from 'lucide-react'

interface PhotoGridProps {
  project: Project
}

function ProtectedPhotoCard({
  photo,
  previewWidth,
  onClick,
}: {
  photo: Photo
  previewWidth: number | null
  onClick: () => void
}) {
  return (
    <div
      className="relative group rounded-xl overflow-hidden bg-secondary cursor-pointer"
      style={{ aspectRatio: '4/3' }}
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <Image
        src={photo.previewUrl}
        alt="Ảnh xem thử"
        fill
        className="object-cover photo-protected"
        sizes={previewWidth ? `${previewWidth}px` : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
        quality={60}
        draggable={false}
        unoptimized={!previewWidth}
      />

      {/* Watermark góc dưới-phải của ảnh (cover mode) */}
      <WatermarkCanvas mode="cover" />

      {/* Transparent blocker prevents right-click on image */}
      <div
        className="absolute inset-0 z-20"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 z-30 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 bg-black/60 rounded-full px-4 py-2 text-white text-sm font-medium">
          <ZoomIn className="w-4 h-4" /> Xem thử
        </div>
      </div>

      {/* Lock icon bottom right */}
      <div className="absolute bottom-2 right-2 z-30 bg-yellow-400/80 rounded-full p-1">
        <Lock className="w-3 h-3 text-yellow-900" />
      </div>
    </div>
  )
}

function PaidPhotoCard({
  photo,
  onClick,
}: {
  photo: Photo
  onClick: () => void
}) {
  return (
    <div
      className="relative group rounded-xl overflow-hidden bg-secondary cursor-pointer"
      style={{ aspectRatio: '4/3' }}
      onClick={onClick}
    >
      <Image
        src={photo.originalUrl}
        alt={photo.filename}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        unoptimized
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <ZoomIn className="w-6 h-6 text-white" />
      </div>
      {/* Download button */}
      <a
        href={photo.originalUrl}
        download={photo.filename}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-primary rounded-lg p-1.5"
        title="Tải ảnh"
      >
        <Download className="w-3.5 h-3.5 text-white" />
      </a>
    </div>
  )
}

export default function PhotoGrid({ project }: PhotoGridProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(PHOTO_BATCH_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const isPaid = project.status === 'paid'
  const previewWidth = project.effectiveImageResizeWidth !== undefined
    ? project.effectiveImageResizeWidth
    : project.imageResizeWidth ?? 720
  const visiblePhotos = project.photos.slice(0, visibleCount)
  const hasMorePhotos = visibleCount < project.photos.length

  // Log access on mount (mock)
  useEffect(() => {
    console.log('[Access Log] Gallery viewed:', {
      projectId: project.id,
      time: new Date().toISOString(),
      userAgent: navigator.userAgent,
    })
  }, [project.id])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasMorePhotos || loadingMore) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        setLoadingMore(true)
        window.setTimeout(() => {
          setVisibleCount((count) => Math.min(count + PHOTO_BATCH_SIZE, project.photos.length))
          setLoadingMore(false)
        }, 180)
      },
      { rootMargin: '500px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMorePhotos, loadingMore, project.photos.length])

  return (
    <>
      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visiblePhotos.map((photo, idx) =>
          isPaid ? (
            <PaidPhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => setViewerIndex(idx)}
            />
          ) : (
            <ProtectedPhotoCard
              key={photo.id}
              photo={photo}
              previewWidth={previewWidth}
              onClick={() => setViewerIndex(idx)}
            />
          )
        )}
      </div>

      {hasMorePhotos ? (
        <div ref={loadMoreRef} className="flex justify-center py-5">
          {loadingMore ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải thêm ảnh...
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Cuộn xuống để tải thêm ảnh</span>
          )}
        </div>
      ) : null}

      {/* Download All (paid only) */}
      {isPaid && (
        <div className="flex justify-center pt-4">
          <button
            id="btn-download-all"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors glow-primary"
          >
            <Download className="w-5 h-5" />
            Tải tất cả ({project.photos.length} ảnh)
          </button>
        </div>
      )}

      {/* Lightbox */}
      {viewerIndex !== null && (
        <PhotoViewer
          photos={project.photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          isPaid={isPaid}
          previewWidth={previewWidth}
        />
      )}
    </>
  )
}
