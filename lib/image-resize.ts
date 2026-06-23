export type ImageResizeWidth = 120 | 360 | 480 | 720
export type ImageResizeSetting = ImageResizeWidth | null

export const IMAGE_RESIZE_OPTIONS: Array<{ value: ImageResizeSetting; label: string; description: string }> = [
  { value: 720, label: '720px', description: 'Đẹp và nhẹ, khuyên dùng' },
  { value: 480, label: '480px', description: 'Nhẹ hơn cho mạng chậm' },
  { value: 360, label: '360px', description: 'Preview nhỏ' },
  { value: 120, label: '120px', description: 'Siêu nhẹ / thumbnail' },
  { value: null, label: 'Giữ ảnh gốc', description: 'Không giảm trước khi upload' },
]

export const DEFAULT_IMAGE_RESIZE_WIDTH: ImageResizeWidth = 720
export const PHOTO_BATCH_SIZE = 5

export function isImageResizeWidth(value: unknown): value is ImageResizeWidth {
  return value === 120 || value === 360 || value === 480 || value === 720
}

export function formatResizeSetting(value: ImageResizeSetting | undefined) {
  return value ? `${value}px` : 'Giữ ảnh gốc'
}
