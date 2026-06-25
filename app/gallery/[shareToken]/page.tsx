import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Project } from "@/lib/mock-data";
import { getApiUrl, withApiKeyHeaders } from "@/lib/api-config";
import GalleryPageClient from "@/components/gallery/GalleryPageClient";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const requestHeaders = await headers();
  const apiHeaders = withApiKeyHeaders({
    "User-Agent": requestHeaders.get("user-agent") ?? "Anonymous visitor",
    "X-Forwarded-For":
      requestHeaders.get("x-forwarded-for") ??
      requestHeaders.get("x-real-ip") ??
      "Ẩn danh",
    "X-Real-IP": requestHeaders.get("x-real-ip") ?? "",
  });
  const response = await fetch(
    getApiUrl(`/projects/share/${encodeURIComponent(shareToken)}`),
    {
      headers: apiHeaders,
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

  return <GalleryPageClient initialProject={project} />;
}
