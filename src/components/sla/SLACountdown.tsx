import { Clock } from 'lucide-react'
import { slaCountdown } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function SLACountdown({ dueDate, label }: { dueDate: string; label: string }) {
  const { label: timeLabel, overdue } = slaCountdown(dueDate)
  return (
    <div className={cn(
      'flex items-center gap-1.5 text-xs font-medium',
      overdue ? 'text-red-600' : 'text-gray-600'
    )}>
      <Clock size={12} />
      <span>{label}:</span>
      <span className={cn('font-semibold', overdue && 'text-red-600')}>{timeLabel}</span>
    </div>
  )
}
