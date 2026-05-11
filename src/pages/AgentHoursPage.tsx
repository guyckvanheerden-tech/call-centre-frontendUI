import { useState, useMemo } from 'react'
import {
  Clock, ChevronDown, ChevronRight, Calendar,
  Users, TrendingUp, LogIn, LogOut, Loader2,
} from 'lucide-react'
import { useAgentHours } from '@/hooks/useReports'
import { useUsers } from '@/hooks/useUsers'
import { cn, formatDateTime } from '@/lib/utils'
import type { AgentHoursRow, AgentDailyBreakdown } from '@/types'

// ── Date range presets ────────────────────────────────────────

type Preset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom'

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function getPresetRange(preset: Preset): { start: string; end: string } {
  const now   = new Date()
  const today = toISO(now)

  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday

  switch (preset) {
    case 'today':
      return { start: today, end: today }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { start: toISO(y), end: toISO(y) }
    }
    case 'this_week': {
      const end = new Date(startOfWeek); end.setDate(startOfWeek.getDate() + 6)
      return { start: toISO(startOfWeek), end: toISO(end) }
    }
    case 'last_week': {
      const s = new Date(startOfWeek); s.setDate(s.getDate() - 7)
      const e = new Date(s);           e.setDate(s.getDate() + 6)
      return { start: toISO(s), end: toISO(e) }
    }
    case 'this_month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { start: toISO(s), end: toISO(e) }
    }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: toISO(s), end: toISO(e) }
    }
    default:
      return { start: today, end: today }
  }
}

function fmtMins(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function fmtHours(hours: number): string {
  return `${hours.toFixed(1)}h`
}

// ── Daily sparkbar ────────────────────────────────────────────
function DailySparkBar({ days, maxMins }: { days: AgentDailyBreakdown[]; maxMins: number }) {
  if (days.length === 0) return null
  return (
    <div className="flex items-end gap-px h-8">
      {days.map((d) => {
        const pct = maxMins > 0 ? (d.minutes / maxMins) * 100 : 0
        return (
          <div key={d.date} className="group relative flex-1 flex items-end h-8">
            <div
              title={`${d.label}: ${fmtMins(d.minutes)}`}
              style={{ height: `${Math.max(pct, d.minutes > 0 ? 8 : 0)}%` }}
              className={cn(
                'w-full rounded-sm transition-all',
                d.minutes > 0 ? 'bg-blue-400 group-hover:bg-blue-500' : 'bg-gray-100'
              )}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Agent row ─────────────────────────────────────────────────
function AgentRow({ agent, maxMins, expectedHours }: {
  agent: AgentHoursRow; maxMins: number; expectedHours: number
}) {
  const [expanded, setExpanded] = useState(false)
  const totalExpected = expectedHours * agent.dailyBreakdown.filter(d => d.minutes > 0 || true).length

  // Attendance rate vs expected (only count working days where they logged in at all)
  const workedDays   = agent.dailyBreakdown.filter((d) => d.minutes > 0).length
  const pctOfExpected = expectedHours > 0 && workedDays > 0
    ? Math.min(100, Math.round((agent.totalHours / (expectedHours * workedDays)) * 100))
    : null

  return (
    <>
      <tr
        onClick={() => setExpanded((v) => !v)}
        className="cursor-pointer hover:bg-blue-50/40 transition-colors border-b border-gray-100"
      >
        {/* Expand toggle + name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded
              ? <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
              : <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />}
            <div>
              <div className="text-sm font-medium text-gray-900">{agent.name}</div>
              <div className="text-xs text-gray-400">{agent.email}</div>
            </div>
          </div>
        </td>

        {/* Total hours */}
        <td className="px-4 py-3 text-center">
          <span className={cn(
            'text-sm font-semibold',
            agent.totalHours === 0 ? 'text-gray-300' : 'text-gray-900'
          )}>
            {fmtHours(agent.totalHours)}
          </span>
          {pctOfExpected !== null && (
            <div className={cn(
              'text-[10px] font-medium mt-0.5',
              pctOfExpected >= 90 ? 'text-emerald-600'
                : pctOfExpected >= 70 ? 'text-amber-500'
                  : 'text-red-500'
            )}>
              {pctOfExpected}% of expected
            </div>
          )}
        </td>

        {/* Sessions */}
        <td className="px-4 py-3 text-center">
          <span className="text-sm text-gray-700">{agent.sessionCount}</span>
          {agent.avgSessionMinutes > 0 && (
            <div className="text-[10px] text-gray-400 mt-0.5">avg {fmtMins(agent.avgSessionMinutes)}</div>
          )}
        </td>

        {/* Days active */}
        <td className="px-4 py-3 text-center">
          <span className="text-sm text-gray-700">
            {agent.dailyBreakdown.filter((d) => d.minutes > 0).length}
          </span>
          <div className="text-[10px] text-gray-400 mt-0.5">
            of {agent.dailyBreakdown.length} days
          </div>
        </td>

        {/* Spark bars */}
        <td className="px-4 py-3 w-40">
          <DailySparkBar days={agent.dailyBreakdown} maxMins={maxMins} />
        </td>

        {/* First / Last login */}
        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
          {agent.firstLogin ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <LogIn size={10} className="text-emerald-500" />
                {new Date(agent.firstLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </div>
              {agent.lastLogin && agent.lastLogin !== agent.firstLogin && (
                <div className="flex items-center gap-1">
                  <LogOut size={10} className="text-gray-400" />
                  {new Date(agent.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-300 italic">No logins</span>
          )}
        </td>
      </tr>

      {/* Expanded: daily breakdown table */}
      {expanded && (
        <tr className="bg-slate-50 border-b border-gray-100">
          <td colSpan={6} className="px-8 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Daily Breakdown
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Daily table */}
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-200">
                    <th className="text-left pb-1">Date</th>
                    <th className="text-right pb-1">Hours</th>
                    <th className="text-right pb-1">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.dailyBreakdown.map((d) => (
                    <tr key={d.date} className="border-b border-gray-100 last:border-0">
                      <td className="py-1 text-gray-600">{d.label}</td>
                      <td className={cn('py-1 text-right font-medium', d.minutes === 0 ? 'text-gray-300' : 'text-gray-800')}>
                        {fmtMins(d.minutes)}
                      </td>
                      <td className="py-1 pl-3 w-24">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={cn('h-1.5 rounded-full', d.minutes > 0 ? 'bg-blue-400' : '')}
                            style={{ width: `${expectedHours > 0 ? Math.min(100, (d.minutes / (expectedHours * 60)) * 100) : 0}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Session log */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Login Sessions ({agent.sessions.length})</p>
                <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin pr-1">
                  {agent.sessions.length === 0
                    ? <p className="text-xs text-gray-300 italic">No sessions in this period</p>
                    : agent.sessions.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-white border border-gray-100 rounded px-2 py-1">
                        <LogIn size={10} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-gray-600">{formatDateTime(s.start)}</span>
                        <span className="text-gray-300">→</span>
                        {s.end
                          ? <span className="text-gray-600">{formatDateTime(s.end)}</span>
                          : <span className="text-emerald-500 font-medium">Online now</span>}
                        <span className="ml-auto text-gray-400 font-medium">{fmtMins(s.minutes)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today',       label: 'Today' },
  { value: 'yesterday',   label: 'Yesterday' },
  { value: 'this_week',   label: 'This Week' },
  { value: 'last_week',   label: 'Last Week' },
  { value: 'this_month',  label: 'This Month' },
  { value: 'last_month',  label: 'Last Month' },
  { value: 'custom',      label: 'Custom Range' },
]

export default function AgentHoursPage() {
  const [preset, setPreset]         = useState<Preset>('this_week')
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')
  const [agentFilter, setAgentFilter] = useState('all')
  const [expectedHours, setExpectedHours] = useState(8)

  const { data: users = [] } = useUsers()
  const agents = useMemo(() => users.filter((u) => u.role === 'agent' && u.enabled), [users])

  const { start, end } = useMemo(() => {
    if (preset === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd }
    }
    if (preset !== 'custom') return getPresetRange(preset)
    return { start: '', end: '' }
  }, [preset, customStart, customEnd])

  const { data, isLoading, isError } = useAgentHours(
    start, end,
    agentFilter !== 'all' ? agentFilter : undefined
  )

  const agentRows  = data?.agents ?? []
  const maxMins    = useMemo(
    () => Math.max(1, ...agentRows.flatMap((a) => a.dailyBreakdown.map((d) => d.minutes))),
    [agentRows]
  )

  const totalHours = agentRows.reduce((s, a) => s + a.totalHours, 0)
  const activeDays  = new Set(
    agentRows.flatMap((a) => a.dailyBreakdown.filter((d) => d.minutes > 0).map((d) => d.date))
  ).size

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Agent Hours</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Track when agents are logged in and available
            </p>
          </div>

          {/* Summary chips */}
          {!isLoading && agentRows.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg">
                <Clock size={12} />
                <span className="font-medium">{totalHours.toFixed(1)}h total</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg">
                <Users size={12} />
                <span className="font-medium">{agentRows.length} agent{agentRows.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-lg">
                <TrendingUp size={12} />
                <span className="font-medium">{activeDays} active day{activeDays !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-3 flex-wrap flex-shrink-0">
        <Calendar size={13} className="text-gray-400 flex-shrink-0" />

        {/* Preset buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-lg border transition-colors',
                preset === p.value
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date pickers */}
        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 text-gray-700" />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 text-gray-700" />
          </div>
        )}

        <div className="w-px h-4 bg-gray-200" />

        {/* Agent filter */}
        <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-blue-400">
          <option value="all">All Agents</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        {/* Expected hours per day */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-gray-500">Expected hrs/day:</span>
          <input
            type="number" min={1} max={24} value={expectedHours}
            onChange={(e) => setExpectedHours(Number(e.target.value))}
            className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 text-gray-700 text-center"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-thin bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-blue-400" size={20} />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-40 text-red-400 text-sm">
            Failed to load report. Check the backend is running.
          </div>
        ) : !start || !end ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            Select a date range to view the report.
          </div>
        ) : agentRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Clock size={28} className="text-gray-200" />
            <p className="text-gray-400 text-sm">No session data for this period.</p>
            <p className="text-gray-300 text-xs">
              Sessions are recorded when agents toggle their online status.
            </p>
          </div>
        ) : (
          <div className="p-4">
            <table className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Agent</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Total Hours</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Sessions</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Days Active</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 w-40">Daily Activity</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">First / Last Login</th>
                </tr>
              </thead>
              <tbody>
                {agentRows.map((agent) => (
                  <AgentRow
                    key={agent.userId}
                    agent={agent}
                    maxMins={maxMins}
                    expectedHours={expectedHours}
                  />
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              Click any row to expand daily breakdown and individual login sessions.
              "Expected hrs/day" is used to calculate the % of expected hours.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
