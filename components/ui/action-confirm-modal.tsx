'use client'

import { AlertTriangle, Loader2, X } from 'lucide-react'

type ActionConfirmModalProps = {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'warning' | 'danger'
  confirming?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

const TONE_STYLES = {
  warning: {
    icon: 'border-amber-200 bg-amber-50 text-amber-600',
    panel: 'border-amber-200 bg-amber-50/80 text-amber-800',
    confirmButton: 'bg-amber-500 text-white shadow-sm shadow-amber-500/20 hover:bg-amber-600',
  },
  danger: {
    icon: 'border-rose-200 bg-rose-50 text-rose-600',
    panel: 'border-rose-200 bg-rose-50/80 text-rose-800',
    confirmButton: 'bg-rose-600 text-white shadow-sm shadow-rose-500/20 hover:bg-rose-700',
  },
} as const

export function ActionConfirmModal({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Quay lại',
  tone = 'warning',
  confirming = false,
  onClose,
  onConfirm,
}: ActionConfirmModalProps) {
  const styles = TONE_STYLES[tone]

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={confirming ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-5 py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${styles.icon}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`mx-5 rounded-2xl border px-4 py-3 text-sm ${styles.panel}`}>
          Hành động này sẽ được áp dụng ngay sau khi xác nhận.
        </div>

        <div className="flex gap-3 px-5 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={confirming}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${styles.confirmButton}`}
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirming ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
