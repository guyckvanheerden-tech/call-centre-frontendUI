import { useState } from 'react'
import { Mail, Phone, MessageSquare, Loader2, Check, Save } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { channelPrefsApi } from '@/lib/api'
import type { ChannelPreferences } from '@/types'

// ── WhatsApp icon (lucide doesn't include it) ─────────────────────────────────
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

const CHANNELS: {
  key:   keyof ChannelPreferences
  label: string
  description: string
  icon:  React.ReactNode
  color: string
}[] = [
  {
    key: 'email',
    label: 'Email',
    description: 'Receive and reply to email tickets',
    icon:  <Mail size={18} />,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    key: 'phone',
    label: 'Phone',
    description: 'Handle inbound calls and click-to-call',
    icon:  <Phone size={18} />,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    key: 'webchat',
    label: 'Webchat',
    description: 'Accept live chat sessions from the website widget',
    icon:  <MessageSquare size={18} />,
    color: 'bg-sky-50 text-sky-600',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    description: 'Handle WhatsApp messages',
    icon:  <WhatsAppIcon size={18} />,
    color: 'bg-emerald-50 text-emerald-600',
  },
]

export default function MyPreferencesPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()

  const defaultPrefs: ChannelPreferences = {
    email:    true,
    phone:    true,
    webchat:  true,
    whatsapp: true,
    ...(profile?.channelPreferences ?? {}),
  }

  const [prefs, setPrefs] = useState<ChannelPreferences>(defaultPrefs)
  const [saved, setSaved] = useState(false)

  const save = useMutation({
    mutationFn: () => channelPrefsApi.update(profile!.id, prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const toggle = (key: keyof ChannelPreferences) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }))

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Channel Preferences</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Choose which channels you want to focus on. Others will still be visible but this
            signals your availability to team leads.
          </p>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
        >
          {save.isPending
            ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
            : saved
              ? <><Check size={12} /> Saved</>
              : <><Save size={12} /> Save</>
          }
        </button>
      </div>

      {/* Channel toggles */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {CHANNELS.map((ch) => (
          <div key={ch.key} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${ch.color}`}>
                {ch.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{ch.label}</p>
                <p className="text-xs text-gray-500">{ch.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle(ch.key)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200
                ${prefs[ch.key] ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
                ${prefs[ch.key] ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">Note</p>
        <p>
          Disabling a channel here does not prevent tickets from that channel being assigned to you —
          it signals your preferred focus to admins and future smart-routing logic.
          Admins can also set these preferences in <strong>Admin → Users</strong>.
        </p>
      </div>

      {save.isError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {(save.error as Error).message}
        </p>
      )}
    </div>
  )
}
