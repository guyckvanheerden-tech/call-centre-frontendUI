import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, Filter, Plus, X, Mail, MessageCircle, Phone } from 'lucide-react'
import { useTickets, useCreateTicket, useUpdateTicket } from '@/hooks/useTickets'
import { useUsers } from '@/hooks/useUsers'
import { useDomains } from '@/hooks/useDomains'
import { useTicketStatuses } from '@/hooks/useTicketStatuses'
import { useQuery } from '@tanstack/react-query'
import { channelRoutingApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Ticket, TicketStatus, SLAStatus, User, TicketChannel, TicketStatusDef, ChannelKey } from '@/types'
import SLAStatusBadge from '@/components/sla/SLAStatusBadge'
import { cn, formatRelative, findStatusDef } from '@/lib/utils'

function ChannelBadge({ channel }: { channel: TicketChannel }) {
  if (channel === 'whatsapp') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
        <MessageCircle size={9} /> WhatsApp
      </span>
    )
  }
  if (channel === 'phone') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
        <Phone size={9} /> Phone
      </span>
    )
  }
  if (channel === 'webchat') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">
        <MessageCircle size={9} /> Webchat
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">
      <Mail size={9} /> Email
    </span>
  )
}

type SortField = 'id' | 'subject' | 'updatedAt' | 'slaStatus'
type SortDir   = 'asc' | 'desc'
const statusOrder: Record<SLAStatus, number> = { breached: 0, at_risk: 1, on_track: 2 }

export default function TicketList() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const { data: tickets = [],  isLoading: ticketsLoading } = useTickets()
  const { data: users   = [] }                              = useUsers()
  const { data: statuses = [] }                             = useTicketStatuses()
  const { data: routing }                                   = useQuery({
    queryKey: ['channel-routing'],
    queryFn:  channelRoutingApi.getSettings,
    staleTime: 60_000,
  })
  const updateTicket   = useUpdateTicket()

  // Build a priority map: channel → score (lower = higher priority)
  const channelPriority = useMemo<Record<string, number>>(() => {
    const order: ChannelKey[] = routing?.priority_order ?? ['phone', 'webchat', 'whatsapp', 'email']
    return Object.fromEntries(order.map((ch, i) => [ch, i]))
  }, [routing])

  // Names of statuses that mark a ticket as closed
  const resolvedNames = useMemo(
    () => new Set(statuses.filter((s) => s.isResolved).map((s) => s.name)),
    [statuses]
  )

  const [showNewTicket, setShowNewTicket] = useState(false)

  const isAgent       = profile?.role === 'agent'
  const canAssign     = profile?.role === 'admin'
  // Agents only see their own tickets (API already filters, but guard locally too)
  const visibleTickets = useMemo(
    () => isAgent ? tickets.filter((t) => t.assignedAgentId === profile?.id) : tickets,
    [tickets, isAgent, profile?.id]
  )
  const assignableAgents = useMemo(
    () => users.filter((u) => u.role === 'agent' && u.enabled),
    [users]
  )

  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all' | 'active'>('active')
  const [filterSLA,    setFilterSLA]    = useState<SLAStatus | 'all'>('all')
  const [filterDomain, setFilterDomain] = useState('all')
  const [sortField,    setSortField]    = useState<SortField>('slaStatus')
  const [sortDir,      setSortDir]      = useState<SortDir>('asc')

  const domains = useMemo(() => [...new Set(visibleTickets.map((t) => t.domain))], [visibleTickets])

  const filtered = useMemo(() => {
    let t = [...visibleTickets]
    if (filterStatus === 'active')       t = t.filter((x) => !resolvedNames.has(x.status))
    else if (filterStatus !== 'all')     t = t.filter((x) => x.status === filterStatus)
    if (filterSLA    !== 'all')          t = t.filter((x) => x.slaStatus === filterSLA)
    if (filterDomain !== 'all')          t = t.filter((x) => x.domain   === filterDomain)
    t.sort((a, b) => {
      let val = 0
      if (sortField === 'slaStatus') {
        // Primary: SLA urgency
        val = statusOrder[a.slaStatus] - statusOrder[b.slaStatus]
        // Secondary: channel priority (within same SLA band, high-priority channels surface first)
        if (val === 0) {
          const pa = channelPriority[a.channel] ?? 99
          const pb = channelPriority[b.channel] ?? 99
          val = pa - pb
        }
        // Tertiary: most recent
        if (val === 0) val = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
      else if (sortField === 'updatedAt') val = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      else if (sortField === 'subject')   val = a.subject.localeCompare(b.subject)
      else if (sortField === 'id')        val = a.id.localeCompare(b.id)
      return sortDir === 'asc' ? val : -val
    })
    return t
  }, [visibleTickets, filterStatus, filterSLA, filterDomain, sortField, sortDir, resolvedNames])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-gray-300" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-blue-500" />
      : <ChevronDown size={12} className="text-blue-500" />
  }

  const counts = {
    breached: visibleTickets.filter((t) => t.slaStatus === 'breached').length,
    atRisk:   visibleTickets.filter((t) => t.slaStatus === 'at_risk').length,
  }

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            {isAgent ? 'My Tickets' : 'Tickets'}
          </h2>
          <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{filtered.length}</span>
          {counts.breached > 0 && (
            <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-medium">
              {counts.breached} breached
            </span>
          )}
          {counts.atRisk > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
              {counts.atRisk} at risk
            </span>
          )}
        </div>
        {canAssign && (
          <button
            onClick={() => setShowNewTicket(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus size={13} />
            New Ticket
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-3 flex-wrap">
        <Filter size={13} className="text-gray-400 flex-shrink-0" />
        <FilterChip label="Status" value={filterStatus}
          onChange={(v) => setFilterStatus(v as TicketStatus | 'all' | 'active')}
          options={[
            { value: 'active', label: 'Active (default)' },
            { value: 'all',    label: 'All Statuses' },
            ...statuses.map((s) => ({ value: s.name, label: s.label })),
          ]} />
        <FilterChip label="SLA" value={filterSLA}
          onChange={(v) => setFilterSLA(v as SLAStatus | 'all')}
          options={[
            { value: 'all',      label: 'All SLA' },
            { value: 'on_track', label: 'On Track' },
            { value: 'at_risk',  label: 'At Risk' },
            { value: 'breached', label: 'Breached' },
          ]} />
        <FilterChip label="Domain" value={filterDomain} onChange={setFilterDomain}
          options={[
            { value: 'all', label: 'All Domains' },
            ...domains.map((d) => ({ value: d, label: d })),
          ]} />
        {(filterStatus !== 'active' || filterSLA !== 'all' || filterDomain !== 'all') && (
          <button
            onClick={() => { setFilterStatus('active'); setFilterSLA('all'); setFilterDomain('all') }}
            className="text-xs text-gray-400 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="border-b border-gray-200">
              <Th onClick={() => toggleSort('id')}        label="ID"><SortIcon field="id" /></Th>
              <Th onClick={() => toggleSort('subject')}   label="Subject"><SortIcon field="subject" /></Th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">Customer / Domain</th>
              <Th onClick={() => toggleSort('slaStatus')} label="SLA"><SortIcon field="slaStatus" /></Th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">Assigned</th>
              <Th onClick={() => toggleSort('updatedAt')} label="Last Activity"><SortIcon field="updatedAt" /></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                statuses={statuses}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                canAssign={canAssign}
                assignableAgents={assignableAgents}
                onAssign={(agentId) => {
                  updateTicket.mutate({ id: ticket.id, patch: { assignedAgentId: agentId || null } })
                }}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-gray-400 text-sm">No tickets match your filters.</div>
        )}
      </div>

      {showNewTicket && (
        <NewTicketModal
          onClose={() => setShowNewTicket(false)}
          onCreated={(id) => { setShowNewTicket(false); navigate(`/tickets/${id}`) }}
        />
      )}
    </div>
  )
}

function Th({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <th onClick={onClick}
      className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap cursor-pointer select-none hover:text-gray-800">
      <span className="flex items-center gap-1">{label}{children}</span>
    </th>
  )
}

function FilterChip({ value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 cursor-pointer">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function TicketRow({ ticket, statuses, onClick, canAssign, assignableAgents, onAssign }: {
  ticket: Ticket; statuses: TicketStatusDef[]; onClick: () => void; canAssign: boolean
  assignableAgents: User[]; onAssign: (id: string) => void
}) {
  const { label: statusLabel, style: statusStyle } = findStatusDef(ticket.status, statuses)
  return (
    <tr onClick={onClick}
      className={cn(
        'cursor-pointer hover:bg-blue-50/50 transition-colors',
        ticket.slaStatus === 'breached' && 'bg-red-50/40 hover:bg-red-50',
        ticket.slaStatus === 'at_risk'  && 'bg-amber-50/30 hover:bg-amber-50/60',
      )}>
      <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">{ticket.id}</td>
      <td className="px-4 py-3 max-w-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-900 font-medium line-clamp-1">{ticket.subject}</span>
          <ChannelBadge channel={ticket.channel ?? 'email'} />
        </div>
        {ticket.tags.length > 0 && (
          <div className="flex gap-1 mt-0.5">
            {ticket.tags.map((tag) => (
              <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="text-gray-700 text-xs font-medium truncate max-w-[180px]">
          {ticket.channel === 'whatsapp' && ticket.customerPhone
            ? ticket.customerPhone
            : ticket.customerEmail}
        </div>
        <div className="text-gray-400 text-xs truncate max-w-[180px]">{ticket.domain}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap"><SLAStatusBadge status={ticket.slaStatus} /></td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={statusStyle}>
          {statusLabel}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => canAssign && e.stopPropagation()}>
        {canAssign ? (
          <select value={ticket.assignedAgentId ?? ''}
            onChange={(e) => onAssign(e.target.value)}
            className={cn(
              'text-xs rounded-lg px-2 py-1 border outline-none cursor-pointer transition-colors',
              ticket.assignedAgentId
                ? 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 focus:border-blue-400'
                : 'border-dashed border-gray-300 bg-transparent text-gray-400 hover:border-blue-300'
            )}>
            <option value="">Unassigned</option>
            {assignableAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        ) : ticket.assignedAgent ? (
          <span className="text-xs text-gray-700">{ticket.assignedAgent}</span>
        ) : (
          <span className="text-xs text-gray-400 italic">Unassigned</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatRelative(ticket.updatedAt)}</td>
    </tr>
  )
}

// ── New Ticket Modal ───────────────────────────────────────────

function NewTicketModal({ onClose, onCreated }: {
  onClose: () => void; onCreated: (id: string) => void
}) {
  const { data: domains = [] } = useDomains()
  const { data: users   = [] } = useUsers()
  const createTicket = useCreateTicket()

  const [subject,  setSubject]  = useState('')
  const [email,    setEmail]    = useState('')
  const [domainId, setDomainId] = useState(domains[0]?.id ?? '')
  const subjectRef = useRef<HTMLInputElement>(null)

  useEffect(() => { subjectRef.current?.focus() }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const onlinePool = users.filter((u) => u.role === 'agent' && u.enabled && u.online)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !email.trim()) return
    const ticket = await createTicket.mutateAsync({
      subject: subject.trim(), customerEmail: email.trim(), domainId,
    })
    onCreated(ticket.id)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">New Ticket</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Subject <span className="text-red-400">*</span></label>
            <input ref={subjectRef} value={subject} onChange={(e) => setSubject(e.target.value)} required
              placeholder="Brief description of the issue"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Customer Email <span className="text-red-400">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="customer@example.com"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Domain</label>
            <select value={domainId} onChange={(e) => setDomainId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700 bg-white">
              {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className={cn('rounded-lg px-3 py-2.5 text-xs',
            onlinePool.length > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
            {onlinePool.length > 0
              ? `Will be assigned via round-robin to one of ${onlinePool.length} online agent${onlinePool.length !== 1 ? 's' : ''}`
              : 'No agents are online — ticket will be created unassigned'}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button type="submit"
              disabled={!subject.trim() || !email.trim() || createTicket.isPending}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors">
              {createTicket.isPending ? 'Creating…' : 'Create Ticket'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
          {createTicket.isError && (
            <p className="text-xs text-red-500">{(createTicket.error as Error).message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
