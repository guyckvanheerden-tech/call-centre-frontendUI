import { cn, slaStatusConfig } from '@/lib/utils'
import type { SLAStatus } from '@/types'

interface Props {
  status: SLAStatus
  size?: 'sm' | 'md'
}

export default function SLAStatusBadge({ status, size = 'sm' }: Props) {
  const cfg = slaStatusConfig[status]
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      cfg.bg, cfg.color,
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
    )}>
      <span className={cn('rounded-full flex-shrink-0', cfg.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {cfg.label}
    </span>
  )
}
