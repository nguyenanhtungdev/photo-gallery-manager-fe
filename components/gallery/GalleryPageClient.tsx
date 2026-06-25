"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  ImageIcon,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import type { Project } from "@/lib/mock-data";
import { maskPhone } from "@/lib/utils";
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
            nextProject.status === "paid"
          ) {
            openThankYouCard(true);
          }

          return nextProject;
        });
      },
    });
  }, [initialProject.shareToken, openThankYouCard]);

  useEffect(() => {
    if (typeof window === "undefined" || initialProject.status !== "paid") {
      return;
    }

    const timer = window.setTimeout(() => {
      openThankYouCard(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialProject.status, openThankYouCard]);

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
                Thank You
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

            {isPaid ? (
              <span className="gallery-badge gallery-badge-paid">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã thanh toán
              </span>
            ) : (
              <span className="gallery-badge gallery-badge-pending">
                <Clock className="h-3.5 w-3.5" />
                Chờ thanh toán
              </span>
            )}
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
              <span>{isPaid ? "Watermark TẮT" : "Watermark BẬT"}</span>
            </div>
            <div className={`gallery-stat-pill ${isPaid ? "gallery-stat-pill-green" : ""}`}>
              <Download className="h-3.5 w-3.5 opacity-80" />
              <span>{isPaid ? "Có thể tải xuống" : "Chưa mở tải xuống"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Unpaid warning card */}
        {!isPaid && (
          <div className="gallery-warning-card">
            <div className="flex items-start gap-3.5">
              <div className="gallery-warning-icon-wrap">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Ảnh xem thử — Chưa thanh toán
                </p>
                <ul className="mt-2 space-y-1">
                  {[
                    "Chỉ hiển thị ảnh preview chất lượng thấp (40%)",
                    "Watermark bảo vệ hiển thị trên tất cả ảnh",
                    "Không thể tải hoặc lưu ảnh gốc",
                    "Liên hệ nhiếp ảnh gia sau khi thanh toán để nhận ảnh gốc",
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
        <PhotoGrid project={project} />

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
                Ảnh xem thử có chất lượng thấp. Thanh toán để nhận bộ ảnh chất lượng gốc.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
