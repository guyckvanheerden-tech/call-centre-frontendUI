import { useNavigate } from 'react-router-dom'
import { useTickets } from '@/hooks/useTickets'
import { useReportKPI, useReportDaily } from '@/hooks/useReports'
import KPICards from '@/components/dashboard/KPICards'
import { BreachTrendChart, ResponseTrendChart } from '@/components/dashboard/Charts'
import SLAStatusBadge from '@/components/sla/SLAStatusBadge'
import SLACountdown from '@/components/sla/SLACountdown'
import { formatRelative, findStatusDef, cn } from '@/lib/utils'
import { useTicketStatuses } from '@/hooks/useTicketStatuses'
import { format, subDays } from 'date-fns'

export default function SLAMonitoringPage() {
  const { data: tickets = [] }  = useTickets()
  const { data: statuses = [] } = useTicketStatuses()
  const { data: kpi } = useReportKPI()
  const navigate = useNavigate()

  const today  = new Date()
  const start7 = format(subDays(today, 6), 'yyyy-MM-dd')
  const end7   = format(today, 'yyyy-MM-dd')
  const { data: last7 = [] } = useReportDaily(start7, end7)

  const resolvedNames = new Set(statuses.filter((s) => s.isResolved).map((s) => s.name))
  const active = tickets
    .filter((t) => !resolvedNames.has(t.status))
    .sort((a, b) => {
      const order: Record<string, number> = { breached: 0, at_risk: 1, on_track: 2 }
      return (order[a.slaStatus] ?? 3) - (order[b.slaStatus] ?? 3)
    })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">SLA Monitoring</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time status of all active tickets</p>
      </div>

      {kpi && <KPICards kpi={kpi} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreachTrendChart data={last7} />
        <ResponseTrendChart data={last7} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Active Ticket SLA Status</h2>
          <p className="text-xs text-gray-400 mt-0.5">{active.length} active tickets</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Ticket</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">SLA</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">First Response</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Resolution</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {active.map((ticket) => {
                const { label: statusLabel, style: statusStyle } = findStatusDef(ticket.status, statuses)
                return (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]">{ticket.subject}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{ticket.id}</div>
                    </td>
                    <td className="px-4 py-3"><SLAStatusBadge status={ticket.slaStatus} /></td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={statusStyle}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <SLACountdown dueDate={ticket.firstResponseDue} label="" />
                    </td>
                    <td className="px-4 py-3">
                      <SLACountdown dueDate={ticket.resolutionDue} label="" />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {ticket.assignedAgent ?? <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatRelative(ticket.updatedAt)}</td>
                  </tr>
                )
              })}
              {active.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                    No active tickets — all clear!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
