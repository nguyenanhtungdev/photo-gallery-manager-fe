'use client'

import { useScreenshotGuard } from '@/hooks/useScreenshotGuard'

/**
 * Bọc quanh nội dung ảnh.
 * Khi detect screenshot → che màn hình bằng overlay đen mờ.
 */
export default function ScreenshotGuard({ children }: { children: React.ReactNode }) {
  const isBlocked = useScreenshotGuard(2000)

  return (
    <div className="relative">
      {children}

      {/* Overlay đen khi detect screenshot */}
      {isBlocked && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3"
          style={{
            background: 'rgba(0,0,0,0.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48" height="48" viewBox="0 0 24 24"
            fill="none" stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 500 }}>
            Nội dung được bảo vệ
          </p>
        </div>
      )}
    </div>
  )
}
