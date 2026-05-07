import { Ticket, AlertTriangle, XCircle, Clock } from 'lucide-react'
import type { KPIData } from '@/types'
import { cn } from '@/lib/utils'

const cards = (kpi: KPIData) => [
  {
    label: 'Open Tickets',
    value: kpi.totalOpen,
    icon: <Ticket size={18} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    trend: null,
  },
  {
    label: 'At Risk',
    value: kpi.atRisk,
    icon: <AlertTriangle size={18} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    trend: null,
  },
  {
    label: 'SLA Breached',
    value: kpi.breached,
    icon: <XCircle size={18} />,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    trend: null,
  },
  {
    label: 'Avg Response',
    value: `${kpi.avgResponseMinutes}m`,
    icon: <Clock size={18} />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    trend: null,
  },
]

export default function KPICards({ kpi }: { kpi: KPIData }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards(kpi).map((card) => (
        <div
          key={card.label}
          className={cn('bg-white rounded-xl border p-5 flex items-start gap-4', card.border)}
        >
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', card.bg, card.color)}>
            {card.icon}
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
