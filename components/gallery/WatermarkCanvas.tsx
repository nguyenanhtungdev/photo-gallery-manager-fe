"use client";

import { useEffect, useRef } from "react";
import {
  DEFAULT_WATERMARK_SETTINGS,
  normalizeWatermarkSettings,
  type WatermarkSettings,
} from "@/lib/watermark-settings";

interface WatermarkCanvasProps {
  /** Text watermark hiển thị */
  text?: string;
  /** Cấu hình watermark do user chọn khi share khách */
  settings?: Partial<WatermarkSettings> | null;
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
  text,
  settings,
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

      const watermark = normalizeWatermarkSettings({
        ...settings,
        text: text ?? settings?.text ?? DEFAULT_WATERMARK_SETTINGS.text,
      });

      // ── Vẽ watermark ───────────────────────────────────────────────
      const fontSize = Math.max(10, Math.min(imgW * 0.035, 26) * watermark.textScale);
      const customRotation = (watermark.rotationDegrees * Math.PI) / 180;
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

      const paddingX = Math.max(20, imgW * 0.05);
      const paddingY = Math.max(20, imgH * 0.08);
      const left = imgX + paddingX;
      const right = imgX + imgW - paddingX;
      const top = imgY + paddingY;
      const bottom = imgY + imgH - paddingY;
      const centerX = imgX + imgW / 2;
      const centerY = imgY + imgH / 2;

      const drawLabel = (
        x: number,
        y: number,
        align: CanvasTextAlign,
        baseline: CanvasTextBaseline,
        rotation = 0,
        scale = 1,
      ) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;

        const metrics = ctx.measureText(watermark.text);
        const textHeight = fontSize * 1.25;
        const textWidth = metrics.width;
        const originX =
          align === "center" ? -textWidth / 2 : align === "right" ? -textWidth : 0;
        const originY =
          baseline === "middle"
            ? -textHeight / 2
            : baseline === "bottom"
              ? -textHeight
              : 0;

        if (watermark.style === "badge") {
          const padX = fontSize * 0.7;
          const padY = fontSize * 0.38;
          const radius = Math.min(10, fontSize * 0.45);
          ctx.shadowColor = "rgba(0,0,0,0.25)";
          ctx.shadowBlur = 5;
          ctx.shadowOffsetY = 1;
          ctx.fillStyle = `rgba(15,23,42,${Math.min(0.85, watermark.opacity + 0.25)})`;
          drawRoundRect(
            ctx,
            originX - padX,
            originY - padY,
            textWidth + padX * 2,
            textHeight + padY * 2,
            radius,
          );
          ctx.fill();
          ctx.shadowColor = "transparent";
          ctx.fillStyle = `rgba(255,255,255,${Math.min(1, watermark.opacity + 0.35)})`;
          ctx.fillText(watermark.text, 0, 0);
        } else if (watermark.style === "dark") {
          ctx.shadowColor = `rgba(255,255,255,${Math.min(0.65, watermark.opacity + 0.15)})`;
          ctx.shadowBlur = 3;
          ctx.fillStyle = `rgba(0,0,0,${watermark.opacity})`;
          ctx.fillText(watermark.text, 0, 0);
        } else if (watermark.style === "outline") {
          ctx.lineWidth = Math.max(2, fontSize * 0.12);
          ctx.strokeStyle = `rgba(0,0,0,${Math.min(0.8, watermark.opacity + 0.25)})`;
          ctx.fillStyle = `rgba(255,255,255,${watermark.opacity})`;
          ctx.strokeText(watermark.text, 0, 0);
          ctx.fillText(watermark.text, 0, 0);
        } else {
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 3;
          ctx.shadowOffsetY = 1;
          ctx.fillStyle = `rgba(255,255,255,${watermark.opacity})`;
          ctx.fillText(watermark.text, 0, 0);
        }

        ctx.restore();
      };

      if (watermark.position === "bottom-corners") {
        drawLabel(left, bottom, "left", "bottom", customRotation);
        drawLabel(right, bottom, "right", "bottom", customRotation);
      } else if (watermark.position === "top-corners") {
        drawLabel(left, top, "left", "top", customRotation);
        drawLabel(right, top, "right", "top", customRotation);
      } else if (watermark.position === "center") {
        drawRepeatedLabels(customRotation, 1.2);
      } else if (watermark.position === "diagonal") {
        drawRepeatedLabels(-Math.PI / 7 + customRotation, 1.35);
      } else if (watermark.position === "custom") {
        drawRepeatedLabels(
          customRotation,
          1.2,
          imgX + imgW * watermark.customX,
          imgY + imgH * watermark.customY,
        );
      } else {
        drawLabel(left, top, "left", "top", customRotation);
        drawLabel(right, top, "right", "top", customRotation);
        drawLabel(left, bottom, "left", "bottom", customRotation);
        drawLabel(right, bottom, "right", "bottom", customRotation);
      }

      function drawRepeatedLabels(
        rotation: number,
        scale: number,
        originX = centerX,
        originY = centerY,
      ) {
        const columns = Math.max(1, Math.min(6, watermark.textsPerLine));
        const rows = Math.max(1, Math.min(5, watermark.lineCount));
        const xSpan = Math.max(fontSize * 5, imgW - paddingX * 3);
        const ySpan = Math.max(fontSize * 2.8, Math.min(imgH * 0.62, imgH - paddingY * 2));

        for (let row = 0; row < rows; row += 1) {
          const yOffset = rows === 1 ? 0 : (row / (rows - 1) - 0.5) * ySpan;

          for (let column = 0; column < columns; column += 1) {
            const xOffset = columns === 1 ? 0 : (column / (columns - 1) - 0.5) * xSpan;
            drawLabel(
              originX + xOffset,
              originY + yOffset,
              "center",
              "middle",
              rotation,
              scale,
            );
          }
        }
      }
    };

    draw();

    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [text, settings, mode, imageAspectRatio]);

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

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
