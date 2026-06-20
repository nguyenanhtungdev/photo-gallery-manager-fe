import { notFound } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Clock,
  Shield,
  ImageIcon,
  AlertTriangle,
  Download,
} from "lucide-react";
import type { Project } from "@/lib/mock-data";
import { maskPhone } from "@/lib/utils";
import PhotoGrid from "@/components/gallery/PhotoGrid";
import ScreenshotGuard from "@/components/gallery/ScreenshotGuard";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(
    `${apiUrl}/projects/share/${encodeURIComponent(shareToken)}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return notFound();
  }

  if (!response.ok) {
    throw new Error("Khong the tai gallery");
  }

  const data = (await response.json()) as { project?: Project };
  const project = data.project;

  if (!project) {
    return notFound();
  }

  const isPaid = project.status === "paid";

  return (
    <div className="min-h-screen bg-background">
      {/* Top banner for unpaid */}
      {!isPaid && (
        <div className="px-4 py-3 border-b bg-yellow-400/10 border-yellow-400/20">
          <div className="flex items-center max-w-5xl gap-3 mx-auto">
            <AlertTriangle className="flex-shrink-0 w-4 h-4 text-yellow-400" />
            <p className="text-sm font-medium text-yellow-400">
              Ảnh xem thử — Chưa thanh toán. Watermark bảo vệ đang bật. Liên hệ
              nhiếp ảnh gia để được cung cấp ảnh gốc.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl px-4 py-8 mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {project.clientName} • {maskPhone(project.clientPhone)}
              </p>
            </div>
          </div>

          {/* Status badge */}
          {isPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-400/10 text-green-400 border border-green-400/20 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" /> Đã thanh toán
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 flex-shrink-0">
              <Clock className="w-4 h-4" /> Chờ thanh toán
            </span>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 p-4 glass rounded-xl">
            <ImageIcon className="flex-shrink-0 w-5 h-5 text-primary" />
            <div>
              <p className="text-lg font-bold">{project.photos.length}</p>
              <p className="text-xs text-muted-foreground">Ảnh</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 glass rounded-xl">
            <Shield
              className={`w-5 h-5 flex-shrink-0 ${isPaid ? "text-green-400" : "text-yellow-400"}`}
            />
            <div>
              <p className="text-sm font-semibold">
                {isPaid ? "Bảo vệ TẮT" : "Bảo vệ BẬT"}
              </p>
              <p className="text-xs text-muted-foreground">Watermark</p>
            </div>
          </div>
          <div className="flex items-center col-span-2 gap-3 p-4 glass rounded-xl sm:col-span-1">
            <Download
              className={`w-5 h-5 flex-shrink-0 ${isPaid ? "text-green-400" : "text-muted-foreground"}`}
            />
            <div>
              <p className="text-sm font-semibold">
                {isPaid ? "Có thể tải" : "Chưa mở"}
              </p>
              <p className="text-xs text-muted-foreground">Download</p>
            </div>
          </div>
        </div>

        {/* Protection notice (unpaid) */}
        {!isPaid && (
          <div className="p-5 border glass rounded-2xl border-yellow-400/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-yellow-400">
                  Ảnh được bảo vệ
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Chỉ hiển thị ảnh preview chất lượng thấp (40%)</li>
                  <li>Watermark cá nhân hoá hiển thị trên tất cả ảnh</li>
                  <li>Không thể tải hoặc lưu ảnh gốc</li>
                  <li>
                    Liên hệ nhiếp ảnh gia sau khi thanh toán để nhận ảnh gốc
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Photo grid — bọc ScreenshotGuard cho ảnh chưa thanh toán */}
        {isPaid ? (
          <PhotoGrid project={project} />
        ) : (
          <ScreenshotGuard>
            <PhotoGrid project={project} />
          </ScreenshotGuard>
        )}

        {/* Footer */}
        <div className="py-6 text-center border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Camera className="w-4 h-4" />
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
