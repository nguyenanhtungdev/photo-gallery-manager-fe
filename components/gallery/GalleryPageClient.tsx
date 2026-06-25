"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  ImageIcon,
  Shield,
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
  const isPaid = project.status === "paid";

  useEffect(() => {
    return subscribeToProjectShareRealtime(initialProject.shareToken, {
      onProjectUpdated: ({ project: nextProject }) => {
        setProject((currentProject) => {
          if (
            currentProject.status !== "paid" &&
            nextProject.status === "paid"
          ) {
            setJustUnlocked(true);
          }

          return nextProject;
        });
      },
    });
  }, [initialProject.shareToken]);

  useEffect(() => {
    if (!justUnlocked) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setJustUnlocked(false);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [justUnlocked]);

  return (
    <div className="min-h-screen bg-background">
      {!isPaid && (
        <div className="border-b border-yellow-400/20 bg-yellow-400/10 px-4 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-400" />
            <p className="text-sm font-medium text-yellow-400">
              Ảnh xem thử — Chưa thanh toán. Bảo vệ ảnh đang bật. Liên hệ nhiếp
              ảnh gia để được cung cấp ảnh gốc.
            </p>
          </div>
        </div>
      )}

      {justUnlocked && (
        <div className="border-b border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-600">
              Gallery đã được mở khóa. Bạn có thể xem và tải ảnh gốc ngay bây
              giờ.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {project.clientName}
                {maskPhone(project.clientPhone)
                  ? ` • ${maskPhone(project.clientPhone)}`
                  : ""}
              </p>
            </div>
          </div>

          {isPaid ? (
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1.5 text-sm font-medium text-green-400">
              <CheckCircle2 className="h-4 w-4" /> Đã thanh toán
            </span>
          ) : (
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-sm font-medium text-yellow-400">
              <Clock className="h-4 w-4" /> Chờ thanh toán
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="glass flex items-center gap-3 rounded-xl p-4">
            <ImageIcon className="h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-lg font-bold">{project.photos.length}</p>
              <p className="text-xs text-muted-foreground">Ảnh</p>
            </div>
          </div>
          <div className="glass flex items-center gap-3 rounded-xl p-4">
            <Shield
              className={`h-5 w-5 flex-shrink-0 ${
                isPaid ? "text-green-400" : "text-yellow-400"
              }`}
            />
            <div>
              <p className="text-sm font-semibold">
                {isPaid ? "Bảo vệ TẮT" : "Bảo vệ BẬT"}
              </p>
              <p className="text-xs text-muted-foreground">Watermark</p>
            </div>
          </div>
          <div className="glass col-span-2 flex items-center gap-3 rounded-xl p-4 sm:col-span-1">
            <Download
              className={`h-5 w-5 flex-shrink-0 ${
                isPaid ? "text-green-400" : "text-muted-foreground"
              }`}
            />
            <div>
              <p className="text-sm font-semibold">
                {isPaid ? "Có thể tải" : "Chưa mở"}
              </p>
              <p className="text-xs text-muted-foreground">Download</p>
            </div>
          </div>
        </div>

        {!isPaid && (
          <div className="glass rounded-2xl border border-yellow-400/20 p-5">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-yellow-400">
                  Ảnh được bảo vệ
                </p>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                  <li>Chỉ hiển thị ảnh preview chất lượng thấp (40%)</li>
                  <li>Watermark bảo vệ hiển thị trên tất cả ảnh</li>
                  <li>Không thể tải hoặc lưu ảnh gốc</li>
                  <li>
                    Liên hệ nhiếp ảnh gia sau khi thanh toán để nhận ảnh gốc
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <PhotoGrid project={project} />

        <div className="border-t border-border py-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4" />
            <span>Photo Gallery Manager</span>
          </div>
          {!isPaid && (
            <p className="mt-2 text-xs text-muted-foreground">
              Ảnh xem thử có chất lượng thấp. Thanh toán để nhận bộ ảnh chất
              lượng gốc.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
