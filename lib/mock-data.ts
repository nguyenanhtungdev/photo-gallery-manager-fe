import type { WatermarkSettings } from './watermark-settings'

export type ProjectStatus = 'waiting_payment' | 'paid' | 'cancelled'

export interface Photo {
  id: string
  projectId: string
  storageKey?: string
  filename: string
  previewUrl: string
  originalUrl: string
  contentType?: string
  fileSize?: number
  width: number
  height: number
}

export interface AccessLog {
  id: string
  projectId: string
  ip: string
  userAgent: string
  viewedAt: string
  viewCount: number
}

export interface Project {
  id: string
  projectCode?: string | null
  name: string
  clientName: string
  clientPhone: string | null
  shareToken: string
  status: ProjectStatus
  paidAmount?: number | null
  paidAt?: string | null
  photosCleanedAt?: string | null
  photosCleanupReason?: 'retention_expired' | null
  isPhotoStorageExpired?: boolean
  imageResizeWidth?: 120 | 360 | 480 | 720 | null
  effectiveImageResizeWidth?: 120 | 360 | 480 | 720 | null
  effectiveWatermarkSettings?: WatermarkSettings
  notes?: string
  createdAt: string
  photos: Photo[]
  accessLogs: AccessLog[]
}

// Picsum photos for realistic mock images
const makePicsumPhoto = (projectId: string, seed: number, idx: number): Photo => ({
  id: `photo-${projectId}-${idx}`,
  projectId,
  filename: `DSC_${1000 + seed + idx}.jpg`,
  previewUrl: `https://picsum.photos/seed/${seed + idx}/800/600`,
  originalUrl: `https://picsum.photos/seed/${seed + idx}/2400/1800`,
  width: 2400,
  height: 1800,
})

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    projectCode: 'PG-A1B2C3',
    name: 'Wedding - Anh & Linh',
    clientName: 'Nguyễn Văn Anh',
    clientPhone: '0912345678',
    shareToken: 'share-token-abc123',
    status: 'waiting_payment',
    notes: 'Chụp lễ cưới tại Intercontinental. Khách đang xem xét.',
    createdAt: '2026-06-15T10:00:00Z',
    photos: Array.from({ length: 8 }, (_, i) => makePicsumPhoto('proj-001', 10, i)),
    accessLogs: [
      { id: 'log-1', projectId: 'proj-001', ip: '192.168.1.105', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', viewedAt: '2026-06-18T08:30:00Z', viewCount: 3 },
      { id: 'log-2', projectId: 'proj-001', ip: '103.72.44.12', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', viewedAt: '2026-06-18T14:15:00Z', viewCount: 7 },
      { id: 'log-3', projectId: 'proj-001', ip: '192.168.1.105', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', viewedAt: '2026-06-19T09:00:00Z', viewCount: 2 },
    ],
  },
  {
    id: 'proj-002',
    projectCode: 'PG-D4E5F6',
    name: 'Portrait - Chị Mai',
    clientName: 'Trần Thị Mai',
    clientPhone: '0987654321',
    shareToken: 'share-token-def456',
    status: 'paid',
    paidAmount: 3500000,
    paidAt: '2026-06-10T14:30:00Z',
    notes: 'Chụp chân dung công ty. Đã thanh toán đủ.',
    createdAt: '2026-06-10T14:30:00Z',
    photos: Array.from({ length: 6 }, (_, i) => makePicsumPhoto('proj-002', 30, i)),
    accessLogs: [
      { id: 'log-4', projectId: 'proj-002', ip: '42.118.55.90', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', viewedAt: '2026-06-11T10:00:00Z', viewCount: 5 },
    ],
  },
  {
    id: 'proj-003',
    projectCode: 'PG-789ABC',
    name: 'Gia đình - Nhà anh Minh',
    clientName: 'Phạm Văn Minh',
    clientPhone: '0934567890',
    shareToken: 'share-token-ghi789',
    status: 'cancelled',
    notes: 'Chụp ảnh gia đình cuối tuần. Gửi link xem thử.',
    createdAt: '2026-06-17T09:00:00Z',
    photos: Array.from({ length: 10 }, (_, i) => makePicsumPhoto('proj-003', 50, i)),
    accessLogs: [
      { id: 'log-5', projectId: 'proj-003', ip: '171.243.11.44', userAgent: 'Mozilla/5.0 (Linux; Android 13)', viewedAt: '2026-06-17T20:00:00Z', viewCount: 1 },
    ],
  },
  {
    id: 'proj-004',
    projectCode: 'PG-DEF012',
    name: 'Sản phẩm - Cửa hàng Hoa',
    clientName: 'Lê Thị Hoa',
    clientPhone: '0901234567',
    shareToken: 'share-token-jkl012',
    status: 'paid',
    paidAmount: 2200000,
    paidAt: '2026-06-05T16:00:00Z',
    createdAt: '2026-06-05T16:00:00Z',
    photos: Array.from({ length: 5 }, (_, i) => makePicsumPhoto('proj-004', 70, i)),
    accessLogs: [],
  },
]

export function getProjectByToken(token: string): Project | undefined {
  return MOCK_PROJECTS.find((p) => p.shareToken === token)
}

export function getProjectById(id: string): Project | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id)
}
