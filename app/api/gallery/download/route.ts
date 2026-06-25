import { NextRequest, NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { PassThrough, Readable } from "node:stream";

export const runtime = "nodejs";

type DownloadPhotoInput = {
  filename: string;
  url: string;
};

type DownloadRequestBody = {
  archiveName?: string;
  forceArchive?: boolean;
  photos?: DownloadPhotoInput[];
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | DownloadRequestBody
    | null;
  const photos = body?.photos?.filter(
    (photo) => typeof photo?.filename === "string" && typeof photo?.url === "string",
  );

  if (!photos?.length) {
    return NextResponse.json(
      { message: "Danh sách ảnh tải xuống không hợp lệ" },
      { status: 400 },
    );
  }

  if (photos.length === 1 && !body?.forceArchive) {
    return proxySinglePhoto(photos[0]);
  }

  return streamArchive({
    archiveName: body?.archiveName ?? "photo-gallery",
    photos,
  });
}

async function proxySinglePhoto(photo: DownloadPhotoInput) {
  const response = await fetch(photo.url, { cache: "no-store" });
  if (!response.ok || !response.body) {
    return NextResponse.json(
      { message: "Không thể tải ảnh gốc lúc này" },
      { status: 502 },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Disposition": buildContentDisposition(photo.filename),
      "Content-Type":
        response.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}

function streamArchive({
  archiveName,
  photos,
}: {
  archiveName: string;
  photos: DownloadPhotoInput[];
}) {
  const output = new PassThrough();
  const archive = new ZipArchive({
    zlib: { level: 9 },
  });
  const usedNames = new Set<string>();

  archive.on("error", (error) => {
    output.destroy(error);
  });
  archive.pipe(output);

  void (async () => {
    try {
      for (const photo of photos) {
        const response = await fetch(photo.url, { cache: "no-store" });
        if (!response.ok || !response.body) {
          throw new Error(`Không thể tải ảnh ${photo.filename}`);
        }

        archive.append(Readable.fromWeb(response.body as never), {
          name: ensureUniqueFileName(sanitizeFileName(photo.filename), usedNames),
        });
      }

      await archive.finalize();
    } catch (error: unknown) {
      output.destroy(
        error instanceof Error ? error : new Error("Không thể tạo file zip"),
      );
    }
  })();

  return new NextResponse(Readable.toWeb(output) as ReadableStream, {
    headers: {
      "Content-Disposition": buildContentDisposition(
        `${sanitizeFileName(archiveName) || "photo-gallery"}.zip`,
      ),
      "Content-Type": "application/zip",
      "Cache-Control": "no-store",
    },
  });
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function ensureUniqueFileName(filename: string, usedNames: Set<string>) {
  const normalized = filename || "photo";
  if (!usedNames.has(normalized)) {
    usedNames.add(normalized);
    return normalized;
  }

  const dotIndex = normalized.lastIndexOf(".");
  const baseName = dotIndex > 0 ? normalized.slice(0, dotIndex) : normalized;
  const extension = dotIndex > 0 ? normalized.slice(dotIndex) : "";

  let counter = 2;
  while (usedNames.has(`${baseName}-${counter}${extension}`)) {
    counter += 1;
  }

  const uniqueName = `${baseName}-${counter}${extension}`;
  usedNames.add(uniqueName);
  return uniqueName;
}

function buildContentDisposition(filename: string) {
  const normalized = sanitizeFileName(filename) || "download";
  const asciiFilename = toAsciiFilename(normalized);
  const encodedFilename = encodeRFC5987ValueChars(normalized);

  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;
}

function toAsciiFilename(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/"/g, "")
    .trim();

  return normalized || "download";
}

function encodeRFC5987ValueChars(value: string) {
  return encodeURIComponent(value)
    .replace(/['()]/g, escape)
    .replace(/\*/g, "%2A");
}
