import { useState, useEffect } from 'react'
import {
  ArrowUp, ArrowDown, Save, Loader2, Check,
  Phone, MessageSquare, Mail, Users, Info, AlertCircle,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { channelRoutingApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { ChannelKey, ChannelRoutingSettings } from '@/types'

// ─── Channel metadata ─────────────────────────────────────────────────────────

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

const CHANNEL_META: Record<ChannelKey, {
  label:   string
  icon:    React.ReactNode
  bg:      string
  border:  string
  badge:   string
  dot:     string
  desc:    string
}> = {
  phone: {
    label:  'Phone',
    icon:   <Phone size={16} />,
    bg:     'bg-purple-50',
    border: 'border-purple-200',
    badge:  'bg-purple-100 text-purple-700',
    dot:    'bg-purple-500',
    desc:   'Inbound calls & click-to-call via your PBX',
  },
  webchat: {
    label:  'Webchat',
    icon:   <MessageSquare size={16} />,
    bg:     'bg-sky-50',
    border: 'border-sky-200',
    badge:  'bg-sky-100 text-sky-700',
    dot:    'bg-sky-500',
    desc:   'Live chat sessions from the embedded widget',
  },
  whatsapp: {
    label:  'WhatsApp',
    icon:   <WhatsAppIcon size={16} />,
    bg:     'bg-emerald-50',
    border: 'border-emerald-200',
    badge:  'bg-emerald-100 text-emerald-700',
    dot:    'bg-emerald-500',
    desc:   'Inbound WhatsApp messages via Twilio',
  },
  email: {
    label:  'Email',
    icon:   <Mail size={16} />,
    bg:     'bg-blue-50',
    border: 'border-blue-200',
    badge:  'bg-blue-100 text-blue-700',
    dot:    'bg-blue-500',
    desc:   'Inbound email tickets',
  },
}

// ─── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200
        ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
        ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ChannelRoutingPage() {
  const qc = useQueryClient()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  const { data: settings, isLoading } = useQuery<ChannelRoutingSettings>({
    queryKey: ['channel-routing'],
    queryFn:  channelRoutingApi.getSettings,
  })

  const update = useMutation({
    mutationFn: channelRoutingApi.updateSettings,
    onSuccess: (updated) => {
      qc.setQueryData<ChannelRoutingSettings>(['channel-routing'], updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const [order,       setOrder]       = useState<ChannelKey[]>(['phone', 'webchat', 'whatsapp', 'email'])
  const [fallback,    setFallback]    = useState(true)
  const [saved,       setSaved]       = useState(false)

  useEffect(() => {
    if (settings) {
      setOrder(settings.priority_order)
      setFallback(settings.fallback_to_all)
    }
  }, [settings])

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setOrder(next)
  }

  const handleSave = () => {
    update.mutate({ priority_order: order, fallback_to_all: fallback })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <Loader2 size={18} className="animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Channel Routing</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set the priority order for incoming requests and how they are distributed to agents
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {update.isPending
              ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
              : saved
                ? <><Check size={12} /> Saved</>
                : <><Save size={12} /> Save Changes</>
            }
          </button>
        )}
      </div>

      {/* Priority order editor */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-900">Channel Priority Order</h2>
          <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
            Highest priority at top
          </span>
        </div>
        <p className="text-xs text-gray-500">
          When an agent is available for multiple channels, higher-priority channels are surfaced
          first in the ticket queue. Inbound requests on each channel are only routed to agents
          who have that channel enabled in their preferences.
        </p>

        <div className="space-y-2 mt-3">
          {order.map((ch, idx) => {
            const meta = CHANNEL_META[ch]
            return (
              <div
                key={ch}
                className={`flex items-center gap-3 p-3 rounded-xl border ${meta.border} ${meta.bg} transition-all`}
              >
                {/* Rank badge */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-600">{idx + 1}</span>
                </div>

                {/* Channel icon + info */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.badge}`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
                    {idx === 0 && (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                        Highest
                      </span>
                    )}
                    {idx === order.length - 1 && (
                      <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        Lowest
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{meta.desc}</p>
                </div>

                {/* Up / Down controls */}
                {isAdmin && (
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-white/60 disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ArrowUp size={13} className="text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === order.length - 1}
                      className="p-1 rounded hover:bg-white/60 disabled:opacity-20 transition-colors"
                      title="Move down"
                    >
                      <ArrowDown size={13} className="text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Round-robin explanation */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Round-Robin Assignment</h2>
        <p className="text-xs text-gray-500">
          When a new ticket arrives on a channel, the system automatically assigns it to the
          agent with the <strong className="text-gray-700">fewest active open tickets</strong> among
          agents who are currently online and have that channel enabled in their preferences.
          This keeps workloads balanced as the day progresses.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              step: '1',
              title: 'Channel agents first',
              body: 'Only agents with the incoming channel enabled in their preferences are eligible.',
              color: 'bg-blue-50 border-blue-100 text-blue-700',
            },
            {
              step: '2',
              title: 'Fewest active tickets',
              body: 'Among eligible agents, the one with the fewest open (non-resolved) tickets is selected.',
              color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
            },
            {
              step: '3',
              title: 'Optional fallback',
              body: 'If no channel-specific agent is available, optionally fall back to any online agent.',
              color: 'bg-amber-50 border-amber-100 text-amber-700',
            },
          ].map((s) => (
            <div key={s.step} className={`rounded-lg border p-3 ${s.color}`}>
              <div className={`w-5 h-5 rounded-full bg-current opacity-20 flex items-center justify-center mb-2`} />
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold opacity-60">Step {s.step}</span>
              </div>
              <p className="text-xs font-semibold">{s.title}</p>
              <p className="text-[10px] mt-0.5 opacity-75">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Fallback toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Users size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">Fallback to all agents</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                If no agent has the channel enabled, assign to any online agent
              </p>
            </div>
          </div>
          {isAdmin
            ? <Toggle checked={fallback} onChange={setFallback} />
            : <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${fallback ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {fallback ? 'On' : 'Off'}
              </span>
          }
        </div>
      </div>

      {/* Ticket queue sort note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 space-y-1">
          <p className="font-semibold">Ticket queue ordering</p>
          <p>
            The ticket list automatically surfaces tickets from higher-priority channels first
            within each SLA urgency band — so a breached phone call will always appear above a
            breached email when both exist.
          </p>
        </div>
      </div>

      {/* Non-admin view note */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Only admins can change the routing configuration. Contact your admin to adjust the
            channel priority order or fallback behaviour.
          </p>
        </div>
      )}

      {update.isError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {(update.error as Error).message}
        </p>
      )}
    </div>
  )
}
