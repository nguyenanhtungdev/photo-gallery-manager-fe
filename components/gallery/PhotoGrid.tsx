'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Photo, Project } from '@/lib/mock-data'
import { PHOTO_BATCH_SIZE } from '@/lib/image-resize'
import WatermarkCanvas from './WatermarkCanvas'
import PhotoViewer from './PhotoViewer'
import { Check, Download, Loader2, Lock, X, ZoomIn } from 'lucide-react'
import { downloadPhotos } from '@/lib/gallery-download'

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
  onDownload,
  onToggleSelect,
  selected,
  selectionMode,
  downloading,
}: {
  photo: Photo
  onClick: () => void
  onDownload: () => void
  onToggleSelect: () => void
  selected: boolean
  selectionMode: boolean
  downloading: boolean
}) {
  return (
    <div
      className={`relative group rounded-xl overflow-hidden bg-secondary cursor-pointer ${
        selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
      style={{ aspectRatio: '4/3' }}
      onClick={selectionMode ? onToggleSelect : onClick}
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
      {selectionMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect()
          }}
          className={`absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
            selected
              ? 'border-primary bg-primary text-white'
              : 'border-white/70 bg-black/40 text-white'
          }`}
          title={selected ? 'Bỏ chọn ảnh' : 'Chọn ảnh'}
        >
          <Check className="h-4 w-4" />
        </button>
      )}
      {/* Download button */}
      <button
        type="button"
        className="absolute bottom-2 right-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-primary rounded-lg p-1.5 disabled:opacity-60"
        title="Tải ảnh"
        disabled={downloading}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClickCapture={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          void onDownload()
        }}
      >
        {downloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
        ) : (
          <Download className="w-3.5 h-3.5 text-white" />
        )}
      </button>
    </div>
  )
}

export default function PhotoGrid({ project }: PhotoGridProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(PHOTO_BATCH_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(null)
  const [downloadingArchive, setDownloadingArchive] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const isPaid = project.status === 'paid'
  const previewWidth = project.effectiveImageResizeWidth !== undefined
    ? project.effectiveImageResizeWidth
    : project.imageResizeWidth ?? 720
  const visiblePhotos = project.photos.slice(0, visibleCount)
  const hasMorePhotos = visibleCount < project.photos.length
  const selectedPhotos = project.photos.filter((photo) => selectedPhotoIds.includes(photo.id))
  const selectedCount = selectedPhotos.length

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

  function togglePhotoSelection(photoId: string) {
    setSelectedPhotoIds((currentIds) =>
      currentIds.includes(photoId)
        ? currentIds.filter((id) => id !== photoId)
        : [...currentIds, photoId],
    )
  }

  function toggleSelectAll() {
    if (selectedCount === project.photos.length) {
      setSelectedPhotoIds([])
      return
    }

    setSelectedPhotoIds(project.photos.map((photo) => photo.id))
  }

  async function handleDownloadSinglePhoto(photo: Photo) {
    try {
      setDownloadError(null)
      setDownloadingPhotoId(photo.id)
      await downloadPhotos([photo], { forceArchive: false })
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Không thể tải ảnh lúc này')
    } finally {
      setDownloadingPhotoId(null)
    }
  }

  async function handleDownloadAllPhotos() {
    try {
      setDownloadError(null)
      setDownloadingArchive(true)
      await downloadPhotos(project.photos, {
        archiveName: `${project.name}-${project.clientName}`,
        forceArchive: true,
      })
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Không thể tải ảnh lúc này')
    } finally {
      setDownloadingArchive(false)
    }
  }

  async function handleDownloadSelectedPhotos() {
    if (!selectedPhotos.length) {
      return
    }

    try {
      setDownloadError(null)
      setDownloadingArchive(true)
      await downloadPhotos(selectedPhotos, {
        archiveName: `${project.name}-selected`,
        forceArchive: selectedPhotos.length > 1,
      })
      setSelectionMode(false)
      setSelectedPhotoIds([])
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Không thể tải ảnh lúc này')
    } finally {
      setDownloadingArchive(false)
    }
  }

  return (
    <>
      {isPaid && (
        <div className="mb-4 rounded-2xl border border-border bg-white/80 p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDownloadError(null)
                setSelectionMode((value) => {
                  if (value) {
                    setSelectedPhotoIds([])
                  }
                  return !value
                })
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                selectionMode
                  ? 'bg-secondary text-foreground'
                  : 'bg-primary/10 text-primary hover:bg-primary/15'
              }`}
            >
              {selectionMode ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {selectionMode ? 'Hủy chọn' : 'Chọn nhiều'}
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadAllPhotos()}
              disabled={downloadingArchive}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloadingArchive && !selectionMode ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Tải tất cả
            </button>
            {selectionMode && (
              <>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                >
                  <Check className="h-4 w-4" />
                  {selectedCount === project.photos.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadSelectedPhotos()}
                  disabled={!selectedCount || downloadingArchive}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadingArchive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Tải đã chọn ({selectedCount})
                </button>
              </>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {selectionMode
                ? `Đã chọn ${selectedCount}/${project.photos.length} ảnh`
                : 'Tải từng ảnh bằng nút tải trên mỗi ảnh'}
            </span>
          </div>
          {downloadError ? (
            <p className="mt-2 text-sm text-red-500">{downloadError}</p>
          ) : null}
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visiblePhotos.map((photo, idx) =>
          isPaid ? (
            <PaidPhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => setViewerIndex(idx)}
              onDownload={() => void handleDownloadSinglePhoto(photo)}
              onToggleSelect={() => togglePhotoSelection(photo.id)}
              selected={selectedPhotoIds.includes(photo.id)}
              selectionMode={selectionMode}
              downloading={downloadingPhotoId === photo.id}
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
