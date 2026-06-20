'use client'

interface WatermarkCanvasProps {
  className?: string
}

export default function WatermarkCanvas({ className }: WatermarkCanvasProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 overflow-hidden select-none ${className || ''}`}
      aria-hidden="true"
    >
      {/* Góc trên-trái */}
      <div className="absolute top-3 left-3 watermark-animate">
        <span className="watermark-stamp-text">kim cảnh · 0867177174</span>
      </div>

      {/* Góc dưới-phải */}
      <div className="absolute bottom-5 right-3 watermark-animate">
        <span className="watermark-stamp-text">kim cảnh · 0867177174</span>
      </div>
    </div>
  )
}
