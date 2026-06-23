"use client";

import { useEffect, useRef } from "react";

interface WatermarkCanvasProps {
  /** Text watermark hiển thị */
  text?: string;
  /**
   * Chế độ layout của ảnh gốc bên dưới.
   * - 'cover'   → ảnh fill toàn bộ container (grid card)
   * - 'contain' → ảnh thu nhỏ vừa container, có thể có letterbox (lightbox)
   */
  mode?: "cover" | "contain";
  /** Tỉ lệ width/height của ảnh gốc (dùng cho mode contain để tính vùng ảnh thực) */
  imageAspectRatio?: number;
}

/**
 * Vẽ watermark text nhỏ ở góc dưới-phải của vùng ảnh thực tế bằng Canvas API.
 * Không bị ảnh hưởng bởi kích thước container — luôn nằm trên ảnh.
 */
export default function WatermarkCanvas({
  text = "kim cảnh · 0867177174",
  mode = "cover",
  imageAspectRatio,
}: WatermarkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!W || !H) return;

      // Tăng độ phân giải cho màn hình retina
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // ── Tính vùng ảnh thực tế (cho mode contain) ──────────────────
      let imgX = 0,
        imgY = 0,
        imgW = W,
        imgH = H;

      if (mode === "contain" && imageAspectRatio) {
        const containerRatio = W / H;
        if (imageAspectRatio > containerRatio) {
          // letterbox trên-dưới
          imgW = W;
          imgH = W / imageAspectRatio;
          imgX = 0;
          imgY = (H - imgH) / 2;
        } else {
          // pillarbox trái-phải
          imgH = H;
          imgW = H * imageAspectRatio;
          imgX = (W - imgW) / 2;
          imgY = 0;
        }
      }

      // ── Vẽ watermark ───────────────────────────────────────────────
      const fontSize = Math.max(12, Math.min(imgW * 0.035, 26)); // tăng size, min 12px max 18px
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textBaseline = "bottom";

      const paddingX = Math.max(8, imgW * 0.018);
      const paddingY = Math.max(14, imgH * 0.04);
      const textX = imgX + imgW - paddingX;
      const textY = imgY + imgH - paddingY;

      // Shadow để đọc được trên mọi nền ảnh
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      ctx.fillStyle = "rgba(255,255,255,0.17)";

      // Góc dưới-phải
      ctx.textAlign = "right";
      ctx.fillText(text, textX, textY);

      // Góc dưới-trái
      ctx.textAlign = "left";
      ctx.fillText(text, imgX + paddingX, textY);

      // Góc trên-phải
      ctx.textBaseline = "top";
      ctx.textAlign = "right";
      ctx.fillText(text, textX, imgY + paddingY);
    };

    draw();

    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [text, mode, imageAspectRatio]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 10,
      }}
    />
  );
}
