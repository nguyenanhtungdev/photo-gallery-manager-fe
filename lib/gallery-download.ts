"use client";

import type { Photo } from "@/lib/mock-data";

type DownloadPhotosOptions = {
  archiveName?: string;
  forceArchive?: boolean;
};

export async function downloadPhotos(
  photos: Photo[],
  options: DownloadPhotosOptions = {},
) {
  if (!photos.length) {
    throw new Error("Không có ảnh để tải");
  }

  const response = await fetch("/api/gallery/download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      archiveName: options.archiveName,
      forceArchive: options.forceArchive ?? photos.length > 1,
      photos: photos.map((photo) => ({
        filename: photo.filename,
        url: photo.originalUrl,
      })),
    }),
  });

  if (!response.ok) {
    const fallbackMessage = "Không thể tải ảnh lúc này";
    const message = await readErrorMessage(response, fallbackMessage);
    throw new Error(message);
  }

  const blob = await response.blob();
  const fallbackName =
    photos.length === 1 && !options.forceArchive
      ? photos[0].filename
      : `${options.archiveName || "photo-gallery"}.zip`;

  triggerBrowserDownload(
    blob,
    getFileNameFromDisposition(response.headers.get("content-disposition")) ||
      fallbackName,
  );
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function getFileNameFromDisposition(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const match = contentDisposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? null;
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message || fallback;
  } catch {
    return fallback;
  }
}
