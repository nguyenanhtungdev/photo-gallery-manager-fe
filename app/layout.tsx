import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: 'Photo Gallery Manager',
  description: 'Hệ thống quản lý ảnh chuyên nghiệp cho nhiếp ảnh gia',
}
//add
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body suppressHydrationWarning className={inter.className}>{children}</body>
    </html>
  )
}
