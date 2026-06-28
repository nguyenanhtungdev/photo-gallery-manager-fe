import type { ProjectStatus } from '@/lib/mock-data'

const STATUS_META: Record<
  ProjectStatus,
  {
    label: string
    shortLabel: string
    badgeClassName: string
    accentGradient: string
    surfaceGradient: string
    iconWrapClassName: string
    iconClassName: string
    amountFallbackLabel: string
  }
> = {
  waiting_payment: {
    label: 'Chờ thanh toán',
    shortLabel: 'Chờ TT',
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    accentGradient: 'linear-gradient(180deg, hsl(38,92%,50%), hsl(43,96%,56%))',
    surfaceGradient: 'linear-gradient(135deg, hsl(38,92%,98%), hsl(43,96%,95%))',
    iconWrapClassName: 'bg-amber-50',
    iconClassName: 'text-amber-500',
    amountFallbackLabel: 'Chờ thanh toán',
  },
  paid: {
    label: 'Đã thanh toán',
    shortLabel: 'Đã TT',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    accentGradient: 'linear-gradient(180deg, hsl(160,84%,39%), hsl(145,63%,49%))',
    surfaceGradient: 'linear-gradient(135deg, hsl(160,84%,98%), hsl(145,63%,96%))',
    iconWrapClassName: 'bg-emerald-50',
    iconClassName: 'text-emerald-600',
    amountFallbackLabel: 'Đã thanh toán',
  },
  cancelled: {
    label: 'Đã hủy',
    shortLabel: 'Đã hủy',
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    accentGradient: 'linear-gradient(180deg, hsl(350,84%,60%), hsl(6,78%,58%))',
    surfaceGradient: 'linear-gradient(135deg, hsl(350,100%,98%), hsl(6,100%,97%))',
    iconWrapClassName: 'bg-rose-50',
    iconClassName: 'text-rose-600',
    amountFallbackLabel: 'Đã hủy',
  },
}

export function getProjectStatusMeta(status: ProjectStatus) {
  return STATUS_META[status]
}

export function isProjectPaid(status: ProjectStatus) {
  return status === 'paid'
}

export function isProjectCancelled(status: ProjectStatus) {
  return status === 'cancelled'
}
