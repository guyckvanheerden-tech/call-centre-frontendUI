import { useNavigate } from 'react-router-dom'
import { Users, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useTickets } from '@/hooks/useTickets'
import { useUsers } from '@/hooks/useUsers'
import { useReportKPI, useReportDaily } from '@/hooks/useReports'
import KPICards from '@/components/dashboard/KPICards'
import { BreachTrendChart, ResponseTrendChart, DomainVolumeChart, type DomainVolumeRow } from '@/components/dashboard/Charts'
import SLAStatusBadge from '@/components/sla/SLAStatusBadge'
import { cn, formatRelative } from '@/lib/utils'
import { format, subDays } from 'date-fns'

export default function DashboardPage() {
  const { data: tickets = [] } = useTickets()
  const { data: users   = [] } = useUsers()
  const navigate = useNavigate()

  const today   = new Date()
  const start7  = format(subDays(today, 6), 'yyyy-MM-dd')
  const end7    = format(today, 'yyyy-MM-dd')
  const { data: kpi }    = useReportKPI()
  const { data: last7 = [] } = useReportDaily(start7, end7)

  const breached = tickets.filter((t) => t.slaStatus === 'breached')
  const atRisk   = tickets.filter((t) => t.slaStatus === 'at_risk')

  // Domain volume: count tickets by the domain part of customerEmail
  const domainVolume: DomainVolumeRow[] = Object.entries(
    tickets.reduce<Record<string, number>>((acc, t) => {
      const domain = t.customerEmail?.split('@')[1] ?? 'unknown'
      acc[domain] = (acc[domain] ?? 0) + 1
      return acc
    }, {})
  )
    .map(([domain, count]) => ({ domain, tickets: count }))
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 6)

  const agentPool    = users.filter((u) => (u.role === 'agent' || u.role === 'admin') && u.enabled)
  const onlineAgents = agentPool.filter((u) => u.online)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live SLA overview — today</p>
      </div>

      {kpi && <KPICards kpi={kpi} />}

      {/* Resolved Tickets + Online Agents — 2-column live metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Resolved Tickets */}
        <div className="bg-white rounded-xl border border-emerald-100 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {tickets.filter((t) => t.status === 'resolved').length}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Resolved Tickets</div>
          </div>
        </div>

        {/* Online Agents */}
        <button
          onClick={() => navigate('/admin/online-agents')}
          className="bg-white rounded-xl border border-gray-200 hover:border-emerald-200 hover:shadow-sm transition-all px-5 py-4 flex items-center gap-4 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{onlineAgents.length}</span>
              <span className="text-sm text-gray-400">/ {agentPool.length} online</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Online Agents — click to manage</div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            {agentPool.slice(0, 4).map((u) => (
              <div key={u.id} className="relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-[10px] text-white font-semibold">
                  {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white',
                  u.online ? 'bg-emerald-500' : 'bg-gray-300'
                )} />
              </div>
            ))}
          </div>
          <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <BreachTrendChart data={last7} />
        <ResponseTrendChart data={last7} />
        <DomainVolumeChart data={domainVolume} />
      </div>

      {/* Urgent tickets table */}
      {(breached.length > 0 || atRisk.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Tickets Requiring Attention</h2>
            <button onClick={() => navigate('/tickets')} className="text-xs text-blue-600 hover:underline">
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {[...breached, ...atRisk].slice(0, 8).map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 text-left transition-colors"
              >
                <span className="font-mono text-xs text-gray-400 flex-shrink-0">{ticket.id}</span>
                <span className="flex-1 text-sm text-gray-800 font-medium truncate">{ticket.subject}</span>
                <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">{ticket.customerEmail}</span>
                <SLAStatusBadge status={ticket.slaStatus} />
                <span className="text-xs text-gray-400 flex-shrink-0 hidden md:block">{formatRelative(ticket.updatedAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
