"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Download,
  ImageIcon,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import type { Project } from "@/lib/mock-data";
import { getProjectStatusMeta, isProjectCancelled } from "@/lib/project-status";
import { ProjectStatusIcon } from "@/lib/project-status-icons";
import { formatCurrency, formatDate, maskPhone } from "@/lib/utils";
import PhotoGrid from "@/components/gallery/PhotoGrid";
import { subscribeToProjectShareRealtime } from "@/lib/project-share-realtime";

export default function GalleryPageClient({
  initialProject,
}: {
  initialProject: Project;
}) {
  const [project, setProject] = useState(initialProject);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [showThankYouCard, setShowThankYouCard] = useState(false);
  const isPaid = project.status === "paid";
  const isCancelled = isProjectCancelled(project.status);
  const statusMeta = getProjectStatusMeta(project.status);
  const isPhotoStorageExpired = Boolean(project.isPhotoStorageExpired);
  const paidDateLabel = project.paidAt ? formatDate(project.paidAt) : null;
  const photosCleanedDateLabel = project.photosCleanedAt
    ? formatDate(project.photosCleanedAt)
    : null;
  const thankYouStorageKey = `gallery-thank-you-seen:${initialProject.shareToken}`;

  const openThankYouCard = useCallback((unlockedNow = false) => {
    if (typeof window === "undefined") {
      return;
    }

    const hasSeenCard = window.localStorage.getItem(thankYouStorageKey) === "1";
    if (hasSeenCard) {
      return;
    }

    window.localStorage.setItem(thankYouStorageKey, "1");
    setJustUnlocked(unlockedNow);
    setShowThankYouCard(true);
  }, [thankYouStorageKey]);

  useEffect(() => {
    return subscribeToProjectShareRealtime(initialProject.shareToken, {
      onProjectUpdated: ({ project: nextProject }) => {
        setProject((currentProject) => {
          if (
            currentProject.status !== "paid" &&
            nextProject.status === "paid" &&
            !nextProject.isPhotoStorageExpired
          ) {
            openThankYouCard(true);
          }

          return nextProject;
        });
      },
    });
  }, [initialProject.shareToken, openThankYouCard]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      initialProject.status !== "paid" ||
      initialProject.isPhotoStorageExpired
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      openThankYouCard(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialProject.isPhotoStorageExpired, initialProject.status, openThankYouCard]);

  return (
    <div className="min-h-screen bg-background">
      {showThankYouCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-emerald-200 bg-white shadow-[0_32px_80px_-24px_rgba(16,185,129,0.35)]">
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-400 to-sky-400 px-6 pb-8 pt-6 text-white">
              <button
                type="button"
                onClick={() => setShowThankYouCard(false)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/18 transition-colors hover:bg-white/28"
                aria-label="Đóng thiệp cảm ơn"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/18 backdrop-blur-sm">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Cảm ơn
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight">
                Cảm ơn quý khách đã sử dụng dịch vụ
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/90">
                Bộ ảnh gốc của quý khách đã sẵn sàng. Chúc quý khách có thật nhiều kỷ niệm đẹp với gallery này.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 ring-1 ring-emerald-200/80">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Đã mở tải ảnh gốc
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 font-medium text-sky-700 ring-1 ring-sky-200/80">
                  <Download className="h-3.5 w-3.5" />
                  Có thể tải toàn bộ album
                </span>
                {justUnlocked ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700 ring-1 ring-amber-200/80">
                    <Sparkles className="h-3.5 w-3.5" />
                    Gallery vừa được mở khóa
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setShowThankYouCard(false)}
                className="flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Xem gallery ngay
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Hero ── */}
      <div className="gallery-hero">
        {/* decorative blobs */}
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />

        <div className="mx-auto max-w-5xl px-4 py-5 sm:py-6">
          {/* Top: icon + status badge */}
          <div className="flex items-center justify-between gap-4">
            <div className="gallery-hero-icon" style={{width:40,height:40,borderRadius:12}}>
              <Camera className="h-5 w-5 text-white" />
            </div>

            <span className={isPaid ? "gallery-badge gallery-badge-paid" : "gallery-badge gallery-badge-pending"}>
              <ProjectStatusIcon status={project.status} className="h-3.5 w-3.5" />
              {statusMeta.label}
            </span>
          </div>

          {/* Project name & client */}
          <div className="mt-3">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {project.name}
            </h1>
            <p className="mt-1 text-xs text-white/70">
              {project.clientName}
              {maskPhone(project.clientPhone)
                ? ` • ${maskPhone(project.clientPhone)}`
                : ""}
            </p>
          </div>

          {/* Stats pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="gallery-stat-pill">
              <ImageIcon className="h-3.5 w-3.5 opacity-80" />
              <span className="font-bold">{project.photos.length}</span>
              <span className="opacity-75">ảnh</span>
            </div>
            <div className={`gallery-stat-pill ${isPaid ? "gallery-stat-pill-green" : "gallery-stat-pill-amber"}`}>
                <Shield className="h-3.5 w-3.5 opacity-80" />
              <span>{isPhotoStorageExpired ? "Ảnh đã quá hạn" : isPaid ? "Watermark TẮT" : isCancelled ? "Project đã hủy" : "Watermark BẬT"}</span>
            </div>
            <div className={`gallery-stat-pill ${isPaid ? "gallery-stat-pill-green" : ""}`}>
              <Download className="h-3.5 w-3.5 opacity-80" />
              <span>{isPhotoStorageExpired ? "Không còn lưu trữ" : isPaid ? "Có thể tải xuống" : "Chưa mở tải xuống"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Paid success card */}
        {isPaid && (
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
            <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-emerald-900">
                      Thanh toán thành công
                    </p>
                    {typeof project.paidAmount === "number" ? (
                      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        {formatCurrency(project.paidAmount)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                    {isPhotoStorageExpired
                      ? "Thanh toán đã được ghi nhận, nhưng bộ ảnh đã quá hạn lưu trữ và không còn trên hệ thống."
                      : "Gallery đã được mở khóa. Quý khách có thể xem ảnh không watermark và tải bộ ảnh gốc."}
                  </p>
                  {paidDateLabel ? (
                    <p className="mt-1 text-sm font-medium text-emerald-800">
                      Ngày thanh toán: {paidDateLabel}
                    </p>
                  ) : null}
                </div>
              </div>

              {!isPhotoStorageExpired ? (
                <div className="flex flex-wrap gap-2 pl-14 sm:justify-end sm:pl-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <Shield className="h-3.5 w-3.5" />
                    Không watermark
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <Download className="h-3.5 w-3.5" />
                    Tải ảnh gốc
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {isPhotoStorageExpired ? (
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
            <div className="flex items-start gap-3.5 px-4 py-4 sm:px-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Ảnh đã quá hạn lưu trữ
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-800/80">
                  Bộ ảnh đã được xóa khỏi hệ thống theo chính sách lưu trữ sau thanh toán, nên hiện không còn ảnh để xem hoặc tải xuống.
                </p>
                {photosCleanedDateLabel ? (
                  <p className="mt-1 text-xs font-medium text-amber-800">
                    Thời điểm ghi nhận: {photosCleanedDateLabel}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Unpaid warning card */}
        {!isPaid && (
          <div className="gallery-warning-card">
            <div className="flex items-start gap-3.5">
              <div className="gallery-warning-icon-wrap">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  {isCancelled ? "Project đã hủy" : "Ảnh xem thử — Chưa thanh toán"}
                </p>
                <ul className="mt-2 space-y-1">
                  {[
                    "Chỉ hiển thị ảnh preview chất lượng thấp (40%)",
                    "Watermark bảo vệ hiển thị trên tất cả ảnh",
                    "Không thể tải hoặc lưu ảnh gốc",
                    isCancelled
                      ? "Project này đã được đánh dấu hủy nên gallery chỉ còn ở chế độ xem thử"
                      : "Liên hệ nhiếp ảnh gia sau khi thanh toán để nhận ảnh gốc",
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-2 text-xs text-amber-700/80 dark:text-amber-400/80">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Photo Grid */}
        {!isPhotoStorageExpired ? <PhotoGrid project={project} /> : null}

        {/* Footer */}
        <div className="border-t border-border pt-6 pb-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Camera className="h-4 w-4 text-primary" />
              </div>
              <span>Photo Gallery Manager</span>
            </div>
            {!isPaid && (
              <p className="text-xs text-muted-foreground">
                {isCancelled
                  ? "Project đã hủy nên gallery vẫn ở chế độ xem thử."
                  : "Ảnh xem thử có chất lượng thấp. Thanh toán để nhận bộ ảnh chất lượng gốc."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
