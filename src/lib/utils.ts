import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, differenceInMinutes, format } from 'date-fns'
import type { SLAStatus, TicketStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelative(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDateTime(date: string) {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export function formatTime(date: string) {
  return format(new Date(date), 'HH:mm')
}

export function minutesToHuman(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function slaCountdown(dueDate: string): { minutes: number; label: string; overdue: boolean } {
  const now = new Date()
  const due = new Date(dueDate)
  const minutes = differenceInMinutes(due, now)
  const overdue = minutes < 0
  return {
    minutes: Math.abs(minutes),
    label: overdue ? `${minutesToHuman(Math.abs(minutes))} overdue` : `${minutesToHuman(minutes)} left`,
    overdue,
  }
}

export const slaStatusConfig: Record<SLAStatus, { label: string; color: string; bg: string; dot: string }> = {
  on_track: { label: 'On Track', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  at_risk:  { label: 'At Risk',  color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500'  },
  breached: { label: 'Breached', color: 'text-red-700',     bg: 'bg-red-50',     dot: 'bg-red-500'    },
}

export const ticketStatusConfig: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  open:             { label: 'Open',               color: 'text-blue-700',   bg: 'bg-blue-50'    },
  pending:          { label: 'Pending / In Progress', color: 'text-amber-700',  bg: 'bg-amber-50'   },
  waiting_3rd_party:{ label: 'Waiting on 3rd Party', color: 'text-purple-700', bg: 'bg-purple-50'  },
  resolved:         { label: 'Resolved',           color: 'text-gray-600',   bg: 'bg-gray-100'   },
}
