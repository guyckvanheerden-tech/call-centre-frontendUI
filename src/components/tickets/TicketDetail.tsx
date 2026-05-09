import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Clock, Tag, MoreHorizontal, CheckCircle2,
  Send, ChevronDown, Paperclip, Bold, Italic, Link2,
  CornerUpLeft, TicketIcon, Sparkles, Loader2, MessageCircle, Mail,
} from 'lucide-react'
import { useUpdateTicket, useAddMessage } from '@/hooks/useTickets'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/lib/auth'
import { aiApi } from '@/lib/api'
import type { Ticket, TicketMessage, TicketStatus } from '@/types'

const TICKET_TYPES = [
  'Lead',
  'Quote',
  'Reservation - SA',
  'Cancellations',
  'PO/Vouchers',
  'Conference',
  'Account query',
  'POP',
  'Amendments',
  'Reservation - INT',
] as const
import SLAStatusBadge from '@/components/sla/SLAStatusBadge'
import SLACountdown from '@/components/sla/SLACountdown'
import { cn, formatDateTime, formatRelative, ticketStatusConfig } from '@/lib/utils'

const cannedResponses = [
  { id: 'c1', label: 'Initial Acknowledgement',
    body: 'Thank you for contacting us. I have received your request and will investigate this as a priority. I will update you within the next hour with a resolution or progress update.' },
  { id: 'c2', label: 'Awaiting More Info',
    body: 'Thank you for getting in touch. To assist you effectively, could you please provide the following information:\n\n1. \n2. \n\nI look forward to your response.' },
  { id: 'c3', label: 'Escalation Notice',
    body: 'I have escalated your request to our specialist team. They will be in contact with you directly within the next 2 hours. I apologise for any inconvenience.' },
  { id: 'c4', label: 'Resolution Confirmation',
    body: 'I\'m pleased to advise that your request has been resolved. Please let me know if you require any further assistance. We appreciate your patience.' },
]

export default function TicketDetail({ ticket }: { ticket: Ticket }) {
  const navigate = useNavigate()
  const { mutate: updateTicketMutate } = useUpdateTicket()
  const addMessage = useAddMessage()
  const { data: users = [] } = useUsers()
  const { profile: currentUser } = useAuth()

  const updateTicket = (id: string, patch: Partial<Ticket>) => updateTicketMutate({ id, patch })
  const agents = users.filter((u) => u.role === 'agent')

  // All messages collapsed except the last one
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(ticket.messages.length > 0 ? [ticket.messages[ticket.messages.length - 1].id] : [])
  )
  const [replyBody, setReplyBody] = useState('')
  const [showCanned, setShowCanned] = useState(false)
  const [isPolishing, setIsPolishing] = useState(false)
  const [polishError, setPolishError] = useState<string | null>(null)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  // Re-expand last message when ticket changes
  useEffect(() => {
    setExpandedIds(new Set(ticket.messages.length > 0 ? [ticket.messages[ticket.messages.length - 1].id] : []))
    setReplyBody('')
  }, [ticket.id])

  const toggleExpanded = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleResolve = () =>
    updateTicket(ticket.id, { status: 'resolved', updatedAt: new Date().toISOString() })

  const handlePolish = async () => {
    if (!replyBody.trim() || isPolishing) return
    setIsPolishing(true)
    setPolishError(null)
    try {
      const { corrected } = await aiApi.grammarCheck(replyBody)
      setReplyBody(corrected)
      setTimeout(() => replyRef.current?.focus(), 0)
    } catch {
      setPolishError('AI unavailable — check your API key')
    } finally {
      setIsPolishing(false)
    }
  }

  const handleSend = () => {
    const body = replyBody.trim()
    if (!body || !ticket.ticketType) return
    addMessage.mutate(
      { ticketId: ticket.id, body, direction: 'outbound' },
      {
        onSuccess: () => {
          setReplyBody('')
        },
      }
    )
  }

  const statusCfg = ticketStatusConfig[ticket.status]

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('/tickets')}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-gray-400">{ticket.id}</span>
            <span className="text-gray-300">·</span>
            <h2 className="text-sm font-semibold text-gray-900 truncate">{ticket.subject}</h2>
            {ticket.channel === 'whatsapp' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                <MessageCircle size={9} /> WhatsApp
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">
                <Mail size={9} /> Email
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <SLAStatusBadge status={ticket.slaStatus} />
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusCfg.bg, statusCfg.color)}>
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-400">{ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {ticket.status !== 'resolved' && (
            <button
              onClick={handleResolve}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <CheckCircle2 size={13} />
              Mark Resolved
            </button>
          )}
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Email thread + reply */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 bg-gray-50">

          {/* Thread scroll area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-2">
            {ticket.messages.map((msg, idx) => {
              const senderUser = msg.direction === 'outbound'
                ? users.find((u) => u.name === msg.from)
                : undefined
              return (
                <EmailMessage
                  key={msg.id}
                  msg={msg}
                  ticket={ticket}
                  isExpanded={expandedIds.has(msg.id)}
                  isLast={idx === ticket.messages.length - 1}
                  onToggle={() => toggleExpanded(msg.id)}
                  onReplyClick={() => replyRef.current?.focus()}
                  senderImageUrl={senderUser?.signatureImage}
                />
              )
            })}
          </div>

          {/* Reply composer — email style */}
          {ticket.status !== 'resolved' ? (
            <div className="flex-shrink-0 bg-white border-t-2 border-gray-100 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.06)]">
              {/* Reply header */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  {ticket.channel === 'whatsapp' ? (
                    <>
                      <MessageCircle size={14} className="text-green-600" />
                      <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">WhatsApp Reply</span>
                    </>
                  ) : (
                    <>
                      <CornerUpLeft size={14} className="text-blue-600" />
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Reply</span>
                    </>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-gray-400 w-8 flex-shrink-0">To</span>
                    <span className="text-xs font-medium text-gray-800">
                      {ticket.channel === 'whatsapp' && ticket.customerPhone
                        ? ticket.customerPhone
                        : ticket.customerEmail}
                    </span>
                  </div>
                  {ticket.channel !== 'whatsapp' && (
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs text-gray-400 w-8 flex-shrink-0">From</span>
                      <span className="text-xs text-gray-600">
                        {currentUser?.name ?? 'Agent'}{' '}
                        <span className="text-gray-400">&lt;{currentUser?.email ?? 'agent@company.com'}&gt;</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Formatting toolbar */}
              <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-gray-100 bg-gray-50/60">
                <ToolbarBtn icon={<Bold size={13} />} />
                <ToolbarBtn icon={<Italic size={13} />} />
                <ToolbarBtn icon={<Link2 size={13} />} />
                <div className="w-px h-4 bg-gray-200 mx-1.5" />
                <ToolbarBtn icon={<Paperclip size={13} />} />
                <div className="flex-1" />
                {/* Canned responses */}
                <div className="relative">
                  <button
                    onClick={() => setShowCanned((v) => !v)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2.5 py-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Templates
                    <ChevronDown size={11} className={cn('transition-transform', showCanned && 'rotate-180')} />
                  </button>
                  {showCanned && (
                    <div className="absolute bottom-full right-0 mb-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-30">
                      <div className="px-3 py-2 border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Canned responses
                      </div>
                      {cannedResponses.map((c) => (
                        <button
                          key={c.id}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setReplyBody(c.body)
                            setShowCanned(false)
                            setTimeout(() => replyRef.current?.focus(), 0)
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <div className="text-xs font-medium text-gray-800">{c.label}</div>
                          <div className="text-xs text-gray-400 truncate mt-0.5">{c.body.slice(0, 65)}…</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Body textarea */}
              <textarea
                ref={replyRef}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write your reply here…"
                rows={4}
                className="w-full px-5 py-3.5 text-sm text-gray-800 placeholder-gray-300 outline-none resize-none bg-white leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
                }}
              />

              {/* Signature preview — text + optional image */}
              {(currentUser?.signature || currentUser?.signatureImage) && (
                <div className="px-5 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                    <span className="text-[10px] text-gray-300 select-none">signature</span>
                  </div>
                  {currentUser.signature && (
                    <pre className="text-xs text-gray-400 font-sans whitespace-pre-wrap leading-relaxed">
                      {currentUser.signature}
                    </pre>
                  )}
                  {currentUser.signatureImage && (
                    <img
                      src={currentUser.signatureImage}
                      alt="Signature"
                      className="mt-2 max-h-14 max-w-[220px] object-contain opacity-70"
                    />
                  )}
                </div>
              )}

              {/* Send bar */}
              <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 bg-gray-50/80">
                <span className={cn('text-xs', !ticket.ticketType ? 'text-amber-500 font-medium' : polishError ? 'text-red-500' : 'text-gray-400')}>
                  {!ticket.ticketType
                    ? 'Select a Ticket Type before replying'
                    : polishError
                      ? polishError
                      : replyBody.trim().length > 0
                        ? `${replyBody.trim().length} chars · Ctrl+Enter to send`
                        : 'Ctrl+Enter to send'}
                </span>
                <div className="flex items-center gap-2">
                  {/* AI Polish button */}
                  <button
                    onClick={handlePolish}
                    disabled={!replyBody.trim() || isPolishing}
                    title="Polish with AI — fixes grammar and tone"
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border',
                      isPolishing
                        ? 'bg-purple-50 border-purple-200 text-purple-400 cursor-wait'
                        : 'bg-white border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-40 disabled:cursor-not-allowed'
                    )}
                  >
                    {isPolishing
                      ? <><Loader2 size={12} className="animate-spin" /> Polishing…</>
                      : <><Sparkles size={12} /> Polish</>
                    }
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!replyBody.trim() || !ticket.ticketType}
                    className={cn(
                      'flex items-center gap-2 px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors shadow-sm',
                      ticket.channel === 'whatsapp'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    )}
                  >
                    {ticket.channel === 'whatsapp' ? (
                      <><MessageCircle size={12} /> Send WhatsApp</>
                    ) : (
                      <>Send Reply <Send size={12} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center gap-3">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span className="text-sm text-gray-500">This ticket is resolved. Reopen it to send a reply.</span>
              <button
                onClick={() => updateTicket(ticket.id, { status: 'open' })}
                className="ml-auto text-xs text-blue-600 hover:underline font-medium"
              >
                Reopen ticket
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-[272px] flex-shrink-0 bg-white overflow-y-auto scrollbar-thin">
          <Section title="SLA Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Policy</span>
                <span className="text-xs font-medium text-gray-800">{ticket.slaPolicy}</span>
              </div>
              <SLAStatusBadge status={ticket.slaStatus} size="md" />
              <div className="space-y-1.5 bg-gray-50 rounded-lg p-3">
                <SLACountdown dueDate={ticket.firstResponseDue} label="First response" />
                <SLACountdown dueDate={ticket.resolutionDue} label="Resolution" />
              </div>
            </div>
          </Section>

          <Section title="Ticket Info">
            <MetaRow icon={<User size={12} />} label="Customer" value={ticket.customerEmail} />
            {ticket.channel === 'whatsapp' && ticket.customerPhone && (
              <MetaRow icon={<MessageCircle size={12} />} label="WhatsApp" value={ticket.customerPhone} />
            )}
            <MetaRow icon={<Tag size={12} />} label="Domain" value={ticket.domain} />
            <MetaRow icon={<Clock size={12} />} label="Opened" value={formatRelative(ticket.createdAt)} />
            <div className="mt-3">
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select
                value={ticket.status}
                onChange={(e) => updateTicket(ticket.id, { status: e.target.value as TicketStatus })}
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none bg-white text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              >
                <option value="open">Open</option>
                <option value="pending">Pending / In Progress</option>
                <option value="waiting_3rd_party">Waiting on 3rd Party</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="mt-3">
              <label className={cn(
                'text-xs mb-1 flex items-center gap-1',
                !ticket.ticketType ? 'text-amber-600 font-medium' : 'text-gray-500'
              )}>
                Ticket Type
                {!ticket.ticketType && <span className="text-amber-500">*</span>}
              </label>
              <select
                value={ticket.ticketType ?? ''}
                onChange={(e) => updateTicket(ticket.id, { ticketType: e.target.value || undefined })}
                className={cn(
                  'w-full text-xs border rounded-lg px-2.5 py-1.5 outline-none bg-white text-gray-700 focus:ring-2 focus:ring-blue-50',
                  !ticket.ticketType
                    ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-50'
                    : 'border-gray-200 focus:border-blue-400'
                )}
              >
                <option value="">— Select type —</option>
                {TICKET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {!ticket.ticketType && (
                <p className="text-[10px] text-amber-500 mt-1">Required before replying</p>
              )}
            </div>
          </Section>

          <Section title="Assignment">
            <label className="text-xs text-gray-500 mb-1 block">Assigned agent</label>
            {currentUser?.role === 'admin' ? (
              <select
                value={ticket.assignedAgentId || ''}
                onChange={(e) => {
                  const agent = agents.find((a) => a.id === e.target.value)
                  updateTicket(ticket.id, {
                    assignedAgentId: e.target.value || null,
                    assignedAgent: agent?.name || null,
                  })
                }}
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none bg-white text-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            ) : (
              <div className="text-xs text-gray-800 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                {ticket.assignedAgent ?? <span className="text-gray-400 italic">Unassigned</span>}
              </div>
            )}
          </Section>

          {ticket.tags.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-1">
                {ticket.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Email message card ────────────────────────────────────────────────────────

function EmailMessage({
  msg, ticket, isExpanded, isLast, onToggle, onReplyClick, senderImageUrl,
}: {
  msg: TicketMessage
  ticket: Ticket
  isExpanded: boolean
  isLast: boolean
  onToggle: () => void
  onReplyClick: () => void
  senderImageUrl?: string
}) {
  const isInbound = msg.direction === 'inbound'

  // Parse signature from outbound messages (split on "-- \n")
  let bodyMain = msg.body
  let bodySig: string | null = null
  if (!isInbound) {
    const sigMarker = '\n\n-- \n'
    const sigIdx = msg.body.indexOf(sigMarker)
    if (sigIdx !== -1) {
      bodyMain = msg.body.slice(0, sigIdx)
      bodySig = msg.body.slice(sigIdx + sigMarker.length)
    }
  }

  const initials = isInbound
    ? msg.from.split('@')[0].slice(0, 2).toUpperCase()
    : msg.from.split(' ').map((n) => n[0]).join('').slice(0, 2)

  const snippet = msg.body.replace(/\n+/g, ' ').slice(0, 90)

  return (
    <div className={cn(
      'bg-white rounded-xl border shadow-sm overflow-hidden transition-shadow',
      isLast ? 'border-blue-100 shadow-blue-50' : 'border-gray-200',
    )}>
      {/* Header row — always visible, click to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50/70 transition-colors text-left"
      >
        {/* Avatar */}
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
          isInbound
            ? 'bg-gray-200 text-gray-600'
            : 'bg-blue-100 text-blue-700'
        )}>
          {initials}
        </div>

        {/* Sender + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">{msg.from}</span>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatDateTime(msg.createdAt)}</span>
          </div>

          {isExpanded ? (
            /* Show To line when expanded */
            <div className="text-xs text-gray-400 mt-0.5">
              To:{' '}
              <span className="text-gray-600">
                {isInbound ? ticket.domain : ticket.customerEmail}
              </span>
            </div>
          ) : (
            /* Show preview snippet when collapsed */
            <div className="text-xs text-gray-400 mt-0.5 truncate">{snippet}</div>
          )}
        </div>

        <ChevronDown
          size={14}
          className={cn('flex-shrink-0 text-gray-400 mt-1 transition-transform duration-150', isExpanded && 'rotate-180')}
        />
      </button>

      {/* Email body — shown when expanded */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="px-5 py-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{bodyMain}</p>

            {/* Signature block — text + optional image */}
            {(bodySig || senderImageUrl) && (
              <>
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 border-t border-dashed border-gray-200" />
                </div>
                {bodySig && (
                  <pre className="text-xs text-gray-400 font-sans whitespace-pre-wrap leading-relaxed">{bodySig}</pre>
                )}
                {senderImageUrl && (
                  <img
                    src={senderImageUrl}
                    alt="Signature"
                    className="mt-2 max-h-14 max-w-[220px] object-contain opacity-75"
                  />
                )}
              </>
            )}
          </div>

          {/* Reply shortcut on last inbound message */}
          {isLast && isInbound && (
            <div className="flex items-center gap-2 px-5 pb-3">
              <button
                onClick={(e) => { e.stopPropagation(); onReplyClick() }}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                <CornerUpLeft size={12} />
                Reply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function ToolbarBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
      {icon}
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 px-4 py-4">
      <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 mb-2.5">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-xs text-gray-800 break-all">{value}</div>
      </div>
    </div>
  )
}
