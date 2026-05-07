import { useMemo, useState } from 'react'
import { subDays, format } from 'date-fns'
import { Download, TrendingDown, TrendingUp, Calendar, User } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useReportDaily } from '@/hooks/useReports'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/lib/auth'
import { BreachTrendChart, ResponseTrendChart, DomainVolumeChart } from '@/components/dashboard/Charts'
import { cn } from '@/lib/utils'

type Preset = '7d' | '14d' | '30d' | 'custom'

const PRESETS: { value: Preset; label: string }[] = [
  { value: '7d',     label: 'Last 7 days'  },
  { value: '14d',    label: 'Last 14 days' },
  { value: '30d',    label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

function toInputDate(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export default function ReportsPage() {
  const { profile }        = useAuth()
  const { data: users = [] } = useUsers()
  const isAgent = profile?.role === 'agent'

  const today = useMemo(() => new Date(), [])

  const [preset,      setPreset]      = useState<Preset>('7d')
  const [customStart, setCustomStart] = useState(toInputDate(subDays(today, 6)))
  const [customEnd,   setCustomEnd]   = useState(toInputDate(today))
  // Agents always see their own data; admins can freely filter
  const [agentFilter, setAgentFilter] = useState('all')
  const effectiveAgentFilter = isAgent ? (profile?.id ?? 'all') : agentFilter

  const agentOptions = useMemo(
    () => users.filter((u) => u.role === 'agent'),
    [users]
  )

  // Resolve the active date range strings for the API
  const { rangeStartStr, rangeEndStr } = useMemo(() => {
    if (preset === 'custom') return { rangeStartStr: customStart, rangeEndStr: customEnd }
    const days = preset === '7d' ? 6 : preset === '14d' ? 13 : 29
    return {
      rangeStartStr: toInputDate(subDays(today, days)),
      rangeEndStr:   toInputDate(today),
    }
  }, [preset, customStart, customEnd, today])

  const agentIdParam = effectiveAgentFilter === 'all' ? undefined : effectiveAgentFilter
  const { data: reportData = [], isFetching } = useReportDaily(rangeStartStr, rangeEndStr, agentIdParam)

  // Re-derive Date objects for display labels
  const rangeStart = new Date(`${rangeStartStr}T12:00:00Z`)
  const rangeEnd   = new Date(`${rangeEndStr}T12:00:00Z`)

  // KPIs derived from active dataset
  const kpis = useMemo(() => {
    const totalBreaches = reportData.reduce((s, r) => s + r.breaches, 0)
    const totalResolved = reportData.reduce((s, r) => s + r.resolved, 0)
    const totalTickets  = reportData.reduce((s, r) => s + r.total, 0)
    const avgResponse   = reportData.length
      ? Math.round(reportData.reduce((s, r) => s + r.avgMins, 0) / reportData.length)
      : 0
    const compliance = totalTickets > 0
      ? Math.round(((totalTickets - totalBreaches) / totalTickets) * 100)
      : 100

    const last     = reportData[reportData.length - 1]?.avgMins ?? 0
    const prev     = reportData[reportData.length - 2]?.avgMins ?? last
    const improving = last <= prev

    return { totalBreaches, totalResolved, totalTickets, avgResponse, compliance, last, prev, improving }
  }, [reportData])

  // Range label
  const rangeLabel = useMemo(() => {
    const fmt = (d: Date) => format(d, 'd MMM yyyy')
    return `${fmt(rangeStart)} – ${fmt(rangeEnd)}`
  }, [rangeStart, rangeEnd])

  const selectedAgent = agentOptions.find((u) => u.id === effectiveAgentFilter)

  // Excel export
  const handleExport = () => {
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      reportData.map((r) => ({
        Date:                 r.label,
        'SLA Breaches':       r.breaches,
        'At Risk':            r.atRisk,
        'Avg Response (min)': r.avgMins,
        'Resolved':           r.resolved,
        'Total Tickets':      r.total,
        'Compliance %':       r.total > 0 ? Math.round(((r.total - r.breaches) / r.total) * 100) : 100,
      }))
    ), 'Daily Summary')

    // Domain volume is a static reference chart — omit from export or add separately

    // For the tickets sheet we use the daily summary rows (no full ticket list available here)
    const exportTickets = reportData.map((r) => ({
      Date:       r.label,
      'Breaches': r.breaches,
      'At Risk':  r.atRisk,
      'Resolved': r.resolved,
      'Total':    r.total,
    }))

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportTickets), 'Tickets')

    const agentSuffix = selectedAgent ? `_${selectedAgent.name.replace(/\s+/g, '')}` : ''
    XLSX.writeFile(
      wb,
      `SupportDesk_Report_${format(rangeStart, 'yyyyMMdd')}_${format(rangeEnd, 'yyyyMMdd')}${agentSuffix}.xlsx`
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {rangeLabel} · {reportData.length} days
            {selectedAgent && (
              <span className="ml-2 text-blue-600 font-medium">· {selectedAgent.name}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Download size={14} />
          Download Excel
        </button>
      </div>

      {/* Filters — date range + agent */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {/* Date presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-500 mr-1">Date range:</span>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                preset === p.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              {p.label}
            </button>
          ))}
          {preset === 'custom' && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customStart}
                max={customEnd}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={toInputDate(today)}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700"
              />
            </div>
          )}
        </div>

        {/* Agent filter — admins can freely filter; agents always see their own data */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
          <User size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-500 mr-1">Agent:</span>
          {isAgent ? (
            /* Agents see a locked chip showing their own name */
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white border border-blue-600 shadow-sm">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                currentUser?.online ? 'bg-emerald-300' : 'bg-blue-300'
              )} />
              {currentUser?.name}
              <span className="ml-1 opacity-70 text-[10px]">(your data)</span>
            </span>
          ) : (
            /* Admins see the full filter */
            <>
              <button
                onClick={() => setAgentFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  effectiveAgentFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                All Agents
              </button>
              {agentOptions.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setAgentFilter(u.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                    effectiveAgentFilter === u.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    u.online ? 'bg-emerald-500' : 'bg-gray-300'
                  )} />
                  {u.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Breaches',   value: kpis.totalBreaches,        accent: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-100'     },
          { label: 'Avg Response',     value: `${kpis.avgResponse}m`,    accent: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100'    },
          { label: 'SLA Compliance',   value: `${kpis.compliance}%`,     accent: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Tickets Resolved', value: kpis.totalResolved,        accent: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-100'  },
        ].map((stat) => (
          <div key={stat.label} className={cn('bg-white rounded-xl border p-5', stat.border)}>
            <div className={cn('text-2xl font-bold', stat.accent)}>{stat.value}</div>
            <div className="text-xs font-medium text-gray-700 mt-1">{stat.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {rangeLabel}{selectedAgent ? ` · ${selectedAgent.name}` : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Trend insight banner */}
      {reportData.length >= 2 && (
        <div className={cn(
          'flex items-center gap-3 rounded-xl px-4 py-3 border text-sm',
          kpis.improving ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
        )}>
          {kpis.improving
            ? <TrendingDown size={16} className="text-emerald-600 flex-shrink-0" />
            : <TrendingUp   size={16} className="text-amber-600  flex-shrink-0" />
          }
          <span className={kpis.improving ? 'text-emerald-700' : 'text-amber-700'}>
            {kpis.improving
              ? `Response times improved from ${kpis.prev}m to ${kpis.last}m on the last two days — good trend.`
              : `Response times rose from ${kpis.prev}m to ${kpis.last}m on the last two days — worth investigating.`
            }
          </span>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <BreachTrendChart data={reportData} />
        <ResponseTrendChart data={reportData} />
        <DomainVolumeChart />
      </div>

      {/* Daily breakdown table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Daily Breakdown</h2>
          <span className="text-xs text-gray-400">{reportData.length} days</span>
        </div>
        {reportData.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {isFetching
              ? 'Loading…'
              : effectiveAgentFilter !== 'all'
                ? `No tickets assigned to ${selectedAgent?.name ?? 'this agent'} in the selected period.`
                : 'No data for selected range.'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Date', 'Breaches', 'At Risk', 'Avg Response', 'Resolved', 'Total', 'Compliance'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.map((row) => {
                  const compliance = row.total > 0
                    ? Math.round(((row.total - row.breaches) / row.total) * 100)
                    : 100
                  return (
                    <tr key={row.isoDate} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700 font-medium whitespace-nowrap">{row.label}</td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          row.breaches > 2 ? 'bg-red-100 text-red-700'
                          : row.breaches > 0 ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                        )}>
                          {row.breaches}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">{row.atRisk}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{row.avgMins > 0 ? `${row.avgMins}m` : '—'}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{row.resolved}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{row.total}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                            <div
                              className={cn(
                                'h-1.5 rounded-full',
                                compliance >= 90 ? 'bg-emerald-500' : compliance >= 70 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                              style={{ width: `${compliance}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 whitespace-nowrap">{compliance}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-700">Total / Avg</td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-800">{kpis.totalBreaches}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-800">
                    {reportData.reduce((s, r) => s + r.atRisk, 0)}
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-800">{kpis.avgResponse > 0 ? `${kpis.avgResponse}m` : '—'}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-800">{kpis.totalResolved}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-800">{kpis.totalTickets}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-800">{kpis.compliance}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
