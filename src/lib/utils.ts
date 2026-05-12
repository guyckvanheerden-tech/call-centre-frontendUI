import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, differenceInMinutes, format } from 'date-fns'
import type { SLAStatus, TicketStatusDef } from '@/types'

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

/**
 * Convert a hex colour (e.g. '#3B82F6') to inline React styles for a badge.
 * Background is the colour at 12% opacity; text uses the full colour.
 */
export function colorToStyle(hex: string): React.CSSProperties {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
    color: hex,
  }
}

/**
 * Look up a status definition by name from the dynamic list.
 * Falls back to a neutral grey style if not found.
 */
export function findStatusDef(
  name: string,
  statuses: TicketStatusDef[],
): { label: string; style: React.CSSProperties } {
  const found = statuses.find((s) => s.name === name)
  return found
    ? { label: found.label, style: colorToStyle(found.color) }
    : { label: name, style: { backgroundColor: 'rgba(107,114,128,0.12)', color: '#6B7280' } }
}
