import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, Filter, Plus, X } from 'lucide-react'
import { useDataStore } from '@/store'
import type { Ticket, TicketStatus, SLAStatus, User } from '@/types'
import SLAStatusBadge from '@/components/sla/SLAStatusBadge'
import { cn, formatRelative, ticketStatusConfig } from '@/lib/utils'

const LOGGED_IN_USER_ID = 'u1'

type SortField = 'id' | 'subject' | 'updatedAt' | 'slaStatus'
type SortDir = 'asc' | 'desc'

const statusOrder: Record<SLAStatus, number> = { breached: 0, at_risk: 1, on_track: 2 }

export default function TicketList() {
  const tickets = useDataStore((s) => s.tickets)
  const users = useDataStore((s) => s.users)
  const updateTicket = useDataStore((s) => s.updateTicket)
  const navigate = useNavigate()
  const [showNewTicket, setShowNewTicket] = useState(false)

  const currentUser = users.find((u) => u.id === LOGGED_IN_USER_ID)
  const isAgent = currentUser?.role === 'agent'
  const canAssign = currentUser?.role === 'admin'
  const assignableAgents = users.filter((u) => u.role === 'agent' && u.enabled)

  // Agents only see their own assigned tickets
  const visibleTickets = useMemo(
    () => isAgent ? tickets.filter((t) => t.assignedAgentId === LOGGED_IN_USER_ID) : tickets,
    [tickets, isAgent]
  )

  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all' | 'active'>('active')
  const [filterSLA, setFilterSLA] = useState<SLAStatus | 'all'>('all')
  const [filterDomain, setFilterDomain] = useState('all')
  const [sortField, setSortField] = useState<SortField>('slaStatus')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const domains = useMemo(() => [...new Set(visibleTickets.map((t) => t.domain))], [visibleTickets])

  const filtered = useMemo(() => {
    let t = [...visibleTickets]
    if (filterStatus === 'active') t = t.filter((x) => x.status !== 'resolved')
    else if (filterStatus !== 'all') t = t.filter((x) => x.status === filterStatus)
    if (filterSLA !== 'all') t = t.filter((x) => x.slaStatus === filterSLA)
    if (filterDomain !== 'all') t = t.filter((x) => x.domain === filterDomain)

    t.sort((a, b) => {
      let val = 0
      if (sortField === 'slaStatus') val = statusOrder[a.slaStatus] - statusOrder[b.slaStatus]
      else if (sortField === 'updatedAt') val = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      else if (sortField === 'subject') val = a.subject.localeCompare(b.subject)
      else if (sortField === 'id') val = a.id.localeCompare(b.id)
      return sortDir === 'asc' ? val : -val
    })
    return t
  }, [tickets, filterStatus, filterSLA, filterDomain, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-gray-300" />
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />
  }

  const counts = {
    breached: visibleTickets.filter((t) => t.slaStatus === 'breached').length,
    atRisk: visibleTickets.filter((t) => t.slaStatus === 'at_risk').length,
    open: visibleTickets.filter((t) => t.status === 'open').length,
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
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={13} />
          New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-3 flex-wrap">
        <Filter size={13} className="text-gray-400 flex-shrink-0" />
        <FilterChip label="Status" value={filterStatus} onChange={(v) => setFilterStatus(v as TicketStatus | 'all' | 'active')}
          options={[
            { value: 'active',           label: 'Active (default)' },
            { value: 'all',              label: 'All Statuses' },
            { value: 'open',             label: 'Open' },
            { value: 'pending',          label: 'Pending / In Progress' },
            { value: 'waiting_3rd_party',label: 'Waiting on 3rd Party' },
            { value: 'resolved',         label: 'Resolved' },
          ]} />
        <FilterChip label="SLA" value={filterSLA} onChange={(v) => setFilterSLA(v as SLAStatus | 'all')}
          options={[
            { value: 'all', label: 'All SLA' },
            { value: 'on_track', label: 'On Track' },
            { value: 'at_risk', label: 'At Risk' },
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
              <Th onClick={() => toggleSort('id')} label="ID"><SortIcon field="id" /></Th>
              <Th onClick={() => toggleSort('subject')} label="Subject"><SortIcon field="subject" /></Th>
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
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                canAssign={canAssign}
                assignableAgents={assignableAgents}
                onAssign={(agentId) => {
                  const agent = assignableAgents.find((a) => a.id === agentId)
                  updateTicket(ticket.id, {
                    assignedAgentId: agentId || null,
                    assignedAgent: agent?.name || null,
                    updatedAt: new Date().toISOString(),
                  })
                }}
              />
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-gray-400 text-sm">
            No tickets match your filters.
          </div>
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
    <th
      onClick={onClick}
      className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap cursor-pointer select-none hover:text-gray-800 group"
    >
      <span className="flex items-center gap-1">
        {label}
        {children}
      </span>
    </th>
  )
}

function FilterChip({ value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 outline-none hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 cursor-pointer"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function TicketRow({ ticket, onClick, canAssign, assignableAgents, onAssign }: {
  ticket: Ticket
  onClick: () => void
  canAssign: boolean
  assignableAgents: User[]
  onAssign: (agentId: string) => void
}) {
  const statusCfg = ticketStatusConfig[ticket.status]

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer hover:bg-blue-50/50 transition-colors',
        ticket.slaStatus === 'breached' && 'bg-red-50/40 hover:bg-red-50',
        ticket.slaStatus === 'at_risk'  && 'bg-amber-50/30 hover:bg-amber-50/60',
      )}
    >
      <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">{ticket.id}</td>
      <td className="px-4 py-3 max-w-xs">
        <span className="text-gray-900 font-medium line-clamp-1">{ticket.subject}</span>
        {ticket.tags.length > 0 && (
          <div className="flex gap-1 mt-0.5">
            {ticket.tags.map((tag) => (
              <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="text-gray-700 text-xs font-medium truncate max-w-[180px]">{ticket.customerEmail}</div>
        <div className="text-gray-400 text-xs truncate max-w-[180px]">{ticket.domain}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <SLAStatusBadge status={ticket.slaStatus} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusCfg.bg, statusCfg.color)}>
          {statusCfg.label}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => canAssign && e.stopPropagation()}>
        {canAssign ? (
          <select
            value={ticket.assignedAgentId ?? ''}
            onChange={(e) => onAssign(e.target.value)}
            className={cn(
              'text-xs rounded-lg px-2 py-1 border outline-none cursor-pointer transition-colors',
              ticket.assignedAgentId
                ? 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 focus:border-blue-400'
                : 'border-dashed border-gray-300 bg-transparent text-gray-400 hover:border-blue-300 focus:border-blue-400'
            )}
          >
            <option value="">Unassigned</option>
            {assignableAgents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
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

// ─── New Ticket Modal ──────────────────────────────────────────────────────────

function NewTicketModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (ticketId: string) => void
}) {
  const domains = useDataStore((s) => s.domains)
  const users = useDataStore((s) => s.users)
  const createTicket = useDataStore((s) => s.createTicket)
  const tickets = useDataStore((s) => s.tickets)

  const [subject, setSubject] = useState('')
  const [email, setEmail] = useState('')
  const [domainId, setDomainId] = useState(domains[0]?.id ?? '')

  const onlinePool = users.filter((u) => u.role === 'agent' && u.enabled && u.online)
  const subjectRef = useRef<HTMLInputElement>(null)

  useEffect(() => { subjectRef.current?.focus() }, [])

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !email.trim()) return
    const countBefore = tickets.length
    createTicket(subject.trim(), email.trim(), domainId)
    // The new ticket is prepended, so grab it from the store after creation
    const newId = `TKT-${1000 + countBefore + 1}`
    onCreated(newId)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">New Ticket</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Subject <span className="text-red-400">*</span></label>
            <input
              ref={subjectRef}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Customer Email <span className="text-red-400">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Domain</label>
            <select
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700 bg-white"
            >
              {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Round-robin preview */}
          <div className={cn(
            'rounded-lg px-3 py-2.5 text-xs',
            onlinePool.length > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          )}>
            {onlinePool.length > 0
              ? `Will be assigned via round-robin to one of ${onlinePool.length} online agent${onlinePool.length !== 1 ? 's' : ''}`
              : 'No agents are online — ticket will be created unassigned'}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={!subject.trim() || !email.trim()}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Create Ticket
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
