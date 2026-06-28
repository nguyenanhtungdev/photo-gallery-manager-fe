import type { LucideIcon } from 'lucide-react'
import { Ban, CheckCircle2, Clock } from 'lucide-react'
import type { ProjectStatus } from '@/lib/mock-data'

const STATUS_ICON: Record<ProjectStatus, LucideIcon> = {
  waiting_payment: Clock,
  paid: CheckCircle2,
  cancelled: Ban,
}

export function getProjectStatusIcon(status: ProjectStatus) {
  return STATUS_ICON[status]
}

export function ProjectStatusIcon({
  status,
  className,
}: {
  status: ProjectStatus
  className?: string
}) {
  const Icon = STATUS_ICON[status]
  return <Icon className={className} />
}
