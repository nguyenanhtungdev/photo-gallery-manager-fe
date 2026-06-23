import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return 'Chưa có'
  if (phone.length <= 4) return phone
  const start = phone.slice(0, 3)
  const end = phone.slice(-3)
  const masked = '*'.repeat(Math.max(0, phone.length - 6))
  return `${start}${masked}${end}`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`
}

export function parseUserAgent(ua: string): string {
  if (/iPhone|iPad|iOS/.test(ua)) return '📱 iOS'
  if (/Android/.test(ua)) return '📱 Android'
  if (/Macintosh/.test(ua)) return '💻 macOS'
  if (/Windows/.test(ua)) return '🖥️ Windows'
  return '🌐 Unknown'
}
