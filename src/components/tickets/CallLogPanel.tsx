import { useState, useRef } from 'react'
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Play, Pause, Loader2, PhoneCall,
} from 'lucide-react'
import { useCalls, usePhoneDial, usePhoneSettings } from '@/hooks/useCalls'
import { useAuth } from '@/lib/auth'
import type { Call, CallStatus } from '@/types'
import { cn, formatRelative } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function statusConfig(status: CallStatus, direction: 'inbound' | 'outbound') {
  if (status === 'missed')      return { label: 'Missed',      color: 'text-red-600',    bg: 'bg-red-50',    icon: PhoneMissed }
  if (status === 'in_progress') return { label: 'Live',        color: 'text-emerald-700',bg: 'bg-emerald-50',icon: PhoneCall }
  if (status === 'ringing')     return { label: 'Ringing',     color: 'text-amber-700',  bg: 'bg-amber-50',  icon: Phone }
  if (status === 'failed')      return { label: 'Failed',      color: 'text-red-600',    bg: 'bg-red-50',    icon: PhoneMissed }
  // completed
  return direction === 'inbound'
    ? { label: 'Inbound',  color: 'text-blue-700',   bg: 'bg-blue-50',   icon: PhoneIncoming }
    : { label: 'Outbound', color: 'text-purple-700', bg: 'bg-purple-50', icon: PhoneOutgoing }
}

// ─── Audio player ──────────────────────────────────────────────────────────────

function RecordingPlayer({ url }: { url: string }) {
  const audioRef   = useRef<HTMLAudioElement>(null)
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause(); setPlaying(false) }
    else         { el.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  const handleTimeUpdate = () => {
    const el = audioRef.current
    if (!el || !el.duration) return
    setProgress((el.currentTime / el.duration) * 100)
  }

  const handleLoaded = () => {
    setDuration(audioRef.current?.duration ?? 0)
  }

  const handleEnded = () => setPlaying(false)

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    el.currentTime = ratio * el.duration
  }

  return (
    <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoaded}
        onEnded={handleEnded}
        preload="metadata"
      />
      <button
        onClick={toggle}
        className="w-7 h-7 flex-shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors"
      >
        {playing ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" />}
      </button>

      {/* Progress bar */}
      <div
        className="flex-1 h-1.5 bg-gray-200 rounded-full cursor-pointer relative"
        onClick={seek}
      >
        <div
          className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="text-[10px] font-mono text-gray-400 flex-shrink-0 w-10 text-right">
        {duration ? formatDuration(Math.round(duration)) : '—'}
      </span>
    </div>
  )
}

// ─── Single call row ───────────────────────────────────────────────────────────

function CallRow({ call }: { call: Call }) {
  const [expanded, setExpanded] = useState(false)
  const cfg  = statusConfig(call.status, call.direction)
  const Icon = cfg.icon

  const displayNumber = call.direction === 'inbound'
    ? call.callerNumber
    : call.calleeNumber

  const agentName = call.users?.name ?? (call.agentExtension ? `Ext. ${call.agentExtension}` : null)

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 text-left hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 transition-colors"
      >
        {/* Direction / status icon */}
        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', cfg.bg)}>
          <Icon size={13} className={cfg.color} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', cfg.color, cfg.bg)}>
              {cfg.label}
            </span>
            <span className="text-xs font-medium text-gray-700 truncate">
              {displayNumber ?? 'Unknown number'}
            </span>
            {call.status === 'in_progress' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400">{formatRelative(call.startedAt)}</span>
            {call.durationSeconds != null && call.durationSeconds > 0 && (
              <>
                <span className="text-gray-200">·</span>
                <span className="text-[10px] text-gray-400">{formatDuration(call.durationSeconds)}</span>
              </>
            )}
            {agentName && (
              <>
                <span className="text-gray-200">·</span>
                <span className="text-[10px] text-gray-400">{agentName}</span>
              </>
            )}
          </div>
        </div>

        {/* Recording indicator */}
        {call.recordingUrl && (
          <div className="flex-shrink-0 text-[10px] text-blue-500 font-medium flex items-center gap-1">
            <Play size={9} />
            Rec
          </div>
        )}
      </button>

      {/* Expanded: recording player */}
      {expanded && call.recordingUrl && (
        <div className="px-2">
          <RecordingPlayer url={call.recordingUrl} />
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface CallLogPanelProps {
  ticketId:      string
  customerPhone: string | null
}

export default function CallLogPanel({ ticketId, customerPhone }: CallLogPanelProps) {
  const { data: calls = [], isLoading } = useCalls(ticketId)
  const { data: phoneSettings }         = usePhoneSettings()
  const dial                            = usePhoneDial()
  const { profile }                     = useAuth()

  const phoneEnabled   = phoneSettings?.enabled ?? false
  const canDial        = phoneEnabled && !!customerPhone && !!phoneSettings?.dialUrl

  const handleDial = () => {
    if (!customerPhone) return
    dial.mutate({
      ticketId,
      customerPhone,
      agentExtension: profile?.extension ?? undefined,
    })
  }

  if (!phoneEnabled && calls.length === 0) return null

  return (
    <div className="border-t border-gray-100 pt-4 mt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <Phone size={13} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-700">
            Call Log
            {calls.length > 0 && (
              <span className="ml-1.5 text-gray-400 font-normal">{calls.length}</span>
            )}
          </span>
        </div>

        {canDial && (
          <button
            onClick={handleDial}
            disabled={dial.isPending}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
              'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50',
            )}
          >
            {dial.isPending
              ? <><Loader2 size={11} className="animate-spin" /> Calling…</>
              : <><PhoneCall size={11} /> Call</>
            }
          </button>
        )}
      </div>

      {/* Dial success/error */}
      {dial.isSuccess && (
        <p className="text-[10px] text-emerald-600 bg-emerald-50 rounded-lg px-2.5 py-1.5 mb-2">
          Call initiated — your phone should ring shortly.
        </p>
      )}
      {dial.isError && (
        <p className="text-[10px] text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5 mb-2">
          {(dial.error as Error).message}
        </p>
      )}

      {/* Call list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={14} className="animate-spin text-gray-300" />
        </div>
      ) : calls.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No calls yet for this ticket</p>
      ) : (
        <div>
          {calls.map((call) => (
            <CallRow key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  )
}
