'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Photo, Project } from '@/lib/mock-data'
import { PHOTO_BATCH_SIZE } from '@/lib/image-resize'
import WatermarkCanvas from './WatermarkCanvas'
import PhotoViewer from './PhotoViewer'
import { Check, Download, Loader2, Lock, X, ZoomIn, LayoutGrid, Columns2, Square } from 'lucide-react'
import { downloadPhotos } from '@/lib/gallery-download'
import type { WatermarkSettings } from '@/lib/watermark-settings'

interface PhotoGridProps {
  project: Project
}

function ProtectedPhotoCard({
  photo,
  previewWidth,
  watermarkSettings,
  onClick,
}: {
  photo: Photo
  previewWidth: number | null
  watermarkSettings?: WatermarkSettings
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
      <WatermarkCanvas mode="cover" settings={watermarkSettings} />

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
  onToggleSelect,
  selected,
  selectionMode,
  downloading,
}: {
  photo: Photo
  onClick: () => void
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
  const [cols, setCols] = useState<1 | 2 | 3>(3)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const isPaid = project.status === 'paid'
  const previewWidth = project.effectiveImageResizeWidth !== undefined
    ? project.effectiveImageResizeWidth
    : project.imageResizeWidth ?? 720
  const watermarkSettings = project.effectiveWatermarkSettings
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

  const colsClass: Record<1 | 2 | 3, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }

  const ColsToggle = (
    <div className="gallery-cols-toggle flex-shrink-0">
      {([1, 2, 3] as const).map((n) => {
        const icons = {
          1: <Square className="h-4 w-4" />,
          2: <Columns2 className="h-4 w-4" />,
          3: <LayoutGrid className="h-4 w-4" />,
        }
        return (
          <button
            key={n}
            type="button"
            title={`${n} cột`}
            onClick={() => setCols(n)}
            className={`gallery-cols-btn ${
              cols === n ? 'gallery-cols-btn-active' : 'gallery-cols-btn-idle'
            }`}
          >
            {icons[n]}
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      {isPaid ? (
        /* ── Paid: everything on ONE row ── */
        <div className="gallery-action-bar mb-4">
          <div className="flex items-center gap-2">
            {/* Action buttons */}
            <button
              type="button"
              id="gallery-select-toggle"
              onClick={() => {
                setDownloadError(null)
                setSelectionMode((value) => {
                  if (value) setSelectedPhotoIds([])
                  return !value
                })
              }}
              className={`gallery-action-btn flex-shrink-0 ${
                selectionMode ? 'gallery-action-btn-ghost' : 'gallery-action-btn-outline'
              }`}
            >
              {selectionMode ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {selectionMode ? 'Hủy chọn' : 'Chọn nhiều'}
            </button>

            {!selectionMode && (
              <button
                type="button"
                id="gallery-download-all"
                onClick={() => void handleDownloadAllPhotos()}
                disabled={downloadingArchive}
                className="gallery-action-btn gallery-action-btn-primary flex-shrink-0"
              >
                {downloadingArchive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Tải tất cả
              </button>
            )}

            {selectionMode && (
              <>
                <div className="gallery-action-divider flex-shrink-0" />
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="gallery-action-btn gallery-action-btn-ghost flex-shrink-0"
                >
                  <Check className="h-4 w-4" />
                  {selectedCount === project.photos.length ? 'Bỏ chọn' : 'Chọn tất cả'}
                </button>
                {/* Download selected — blue when has selection */}
                <button
                  type="button"
                  onClick={() => void handleDownloadSelectedPhotos()}
                  disabled={!selectedCount || downloadingArchive}
                  className={`gallery-action-btn flex-shrink-0 ${
                    selectedCount > 0 ? 'gallery-action-btn-primary' : 'gallery-action-btn-secondary'
                  }`}
                >
                  {downloadingArchive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Tải xuống{selectedCount > 0 ? ` (${selectedCount})` : ''}
                </button>
              </>
            )}

            {/* Right side: always flush-right */}
            <div className="ml-auto flex flex-shrink-0 items-center gap-2">
              {selectionMode && (
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {selectedCount}/{project.photos.length}
                </span>
              )}
              {!selectionMode && ColsToggle}
            </div>
          </div>

          {downloadError && (
            <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              {downloadError}
            </div>
          )}
        </div>
      ) : (
        /* ── Unpaid: just toggle, right-aligned ── */
        <div className="mb-3 flex justify-end">
          {ColsToggle}
        </div>
      )}

      {/* Photo grid */}
      <div className={`grid gap-3 transition-all ${colsClass[cols]}`}>
        {visiblePhotos.map((photo, idx) =>
          isPaid ? (
            <PaidPhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => setViewerIndex(idx)}
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
              watermarkSettings={watermarkSettings}
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
          watermarkSettings={watermarkSettings}
        />
      )}
    </>
  )
}
