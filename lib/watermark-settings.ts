export type WatermarkPosition =
  | "bottom-corners"
  | "top-corners"
  | "all-corners"
  | "center"
  | "diagonal"
  | "custom";

export type WatermarkStyle = "light" | "dark" | "outline" | "badge";

export type WatermarkSettings = {
  text: string;
  opacity: number;
  textScale: number;
  rotationDegrees: number;
  textsPerLine: number;
  lineCount: number;
  customX: number;
  customY: number;
  position: WatermarkPosition;
  style: WatermarkStyle;
};

export const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
  text: "kim cảnh · 0867177174",
  opacity: 0.4,
  textScale: 1,
  rotationDegrees: 0,
  textsPerLine: 1,
  lineCount: 1,
  customX: 0.5,
  customY: 0.5,
  position: "all-corners",
  style: "light",
};

export const WATERMARK_POSITION_OPTIONS: Array<{
  value: WatermarkPosition;
  label: string;
  description: string;
}> = [
  {
    value: "bottom-corners",
    label: "Hai góc dưới",
    description: "Gọn, ít che ảnh nhất",
  },
  {
    value: "top-corners",
    label: "Hai góc trên",
    description: "Phù hợp ảnh có chủ thể ở dưới",
  },
  {
    value: "all-corners",
    label: "Bốn góc",
    description: "Cân bằng giữa bảo vệ và thẩm mỹ",
  },
  {
    value: "center",
    label: "Giữa ảnh",
    description: "Dễ nhận diện trên mọi ảnh",
  },
  {
    value: "diagonal",
    label: "Chéo giữa",
    description: "Bảo vệ mạnh khi gửi preview",
  },
  {
    value: "custom",
    label: "Tùy chỉnh",
    description: "Kéo trực tiếp trên ảnh mẫu",
  },
];

export const WATERMARK_STYLE_OPTIONS: Array<{
  value: WatermarkStyle;
  label: string;
}> = [
  { value: "light", label: "Trắng" },
  { value: "dark", label: "Đen" },
  { value: "outline", label: "Viền chữ" },
  { value: "badge", label: "Nhãn nền" },
];

export function normalizeWatermarkSettings(
  value?: Partial<WatermarkSettings> | null,
): WatermarkSettings {
  const text = value?.text?.trim() || DEFAULT_WATERMARK_SETTINGS.text;
  const opacity =
    typeof value?.opacity === "number" && Number.isFinite(value.opacity)
      ? Math.min(1, Math.max(0.1, value.opacity))
      : DEFAULT_WATERMARK_SETTINGS.opacity;
  const position = isWatermarkPosition(value?.position)
    ? value.position
    : DEFAULT_WATERMARK_SETTINGS.position;
  const style = isWatermarkStyle(value?.style)
    ? value.style
    : DEFAULT_WATERMARK_SETTINGS.style;
  const textScale = normalizeWatermarkNumber(
    value?.textScale,
    DEFAULT_WATERMARK_SETTINGS.textScale,
    0.5,
    3,
  );
  const rotationDegrees = normalizeWatermarkNumber(
    value?.rotationDegrees,
    DEFAULT_WATERMARK_SETTINGS.rotationDegrees,
    -180,
    180,
  );
  const textsPerLine = normalizeWatermarkCount(
    value?.textsPerLine,
    DEFAULT_WATERMARK_SETTINGS.textsPerLine,
    1,
    6,
  );
  const lineCount = normalizeWatermarkCount(
    value?.lineCount,
    DEFAULT_WATERMARK_SETTINGS.lineCount,
    1,
    5,
  );
  const customX = normalizeWatermarkCoordinate(
    value?.customX,
    DEFAULT_WATERMARK_SETTINGS.customX,
  );
  const customY = normalizeWatermarkCoordinate(
    value?.customY,
    DEFAULT_WATERMARK_SETTINGS.customY,
  );

  return {
    text,
    opacity,
    textScale,
    rotationDegrees,
    textsPerLine,
    lineCount,
    customX,
    customY,
    position,
    style,
  };
}

function normalizeWatermarkCount(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const numericValue =
    typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, numericValue));
}

function normalizeWatermarkNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const numericValue =
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, numericValue));
}

function normalizeWatermarkCoordinate(value: unknown, fallback: number) {
  const numericValue =
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(0.95, Math.max(0.05, numericValue));
}

function isWatermarkPosition(value: unknown): value is WatermarkPosition {
  return WATERMARK_POSITION_OPTIONS.some((option) => option.value === value);
}

function isWatermarkStyle(value: unknown): value is WatermarkStyle {
  return WATERMARK_STYLE_OPTIONS.some((option) => option.value === value);
}
