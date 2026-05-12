import { useState, useEffect } from 'react'
import { MessageSquare, Save, Loader2, Check, Copy, ExternalLink, Info } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { webchatApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { WidgetSettings } from '@/types'

const inp     = 'w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
const inpMono = `${inp} font-mono`

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

// ─── Colour swatch picker ──────────────────────────────────────────────────────
const PRESETS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#0EA5E9', '#EC4899', '#1D4ED8']

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 transition-transform ${value === c ? 'border-gray-700 scale-110' : 'border-transparent hover:scale-105'}`}
          style={{ background: c }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded-full cursor-pointer border border-gray-200"
        title="Custom colour"
      />
    </div>
  )
}

export default function WebchatSettingsPage() {
  const qc = useQueryClient()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  const { data: settings, isLoading } = useQuery<WidgetSettings>({
    queryKey: ['webchat-settings'],
    queryFn:  webchatApi.getSettings,
  })

  const update = useMutation({
    mutationFn: webchatApi.updateSettings,
    onSuccess: (updated) => {
      qc.setQueryData<WidgetSettings>(['webchat-settings'], updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const [form, setForm] = useState<WidgetSettings>({
    enabled:      false,
    widget_color: '#3B82F6',
    greeting:     'Hi! How can we help you today?',
    agent_label:  'Support Team',
    offline_msg:  "We're offline right now. Leave a message and we'll be in touch shortly.",
  })
  const [saved, setSaved]     = useState(false)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const f = <K extends keyof WidgetSettings>(key: K, val: WidgetSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const apiBase    = import.meta.env.VITE_API_URL ?? 'https://your-api-domain.com'
  const tenantSlug = profile?.tenant?.slug ?? '<your-tenant-slug>'
  const embedCode  = `<script src="${apiBase}/webchat/widget.js?tenant=${tenantSlug}" async></script>`

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <h1 className="text-xl font-bold text-gray-900">Webchat Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Embed a live chat widget on any website — chats open as tickets automatically
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => update.mutate(form)}
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

      {/* Enable toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageSquare size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Webchat Widget</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Allow visitors to start a chat from your website
              </p>
            </div>
          </div>
          {isAdmin
            ? <Toggle checked={form.enabled} onChange={(v) => f('enabled', v)} />
            : <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${form.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {form.enabled ? 'Enabled' : 'Disabled'}
              </span>
          }
        </div>
      </div>

      {/* Widget appearance */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Widget colour</label>
          {isAdmin
            ? <ColorPicker value={form.widget_color} onChange={(v) => f('widget_color', v)} />
            : <div className="w-6 h-6 rounded-full border border-gray-200" style={{ background: form.widget_color }} />
          }
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Team / agent label</label>
          <input
            value={form.agent_label}
            onChange={(e) => f('agent_label', e.target.value)}
            placeholder="Support Team"
            className={inp}
            disabled={!isAdmin}
          />
          <p className="text-[10px] text-gray-400 mt-1">Displayed in the chat header.</p>
        </div>

        {/* Live preview badge */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Preview</label>
          <div className="flex items-end gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: form.widget_color }}
            >
              <MessageSquare size={20} className="text-white" />
            </div>
            <div
              className="rounded-2xl px-4 py-3 text-sm text-white shadow max-w-[200px]"
              style={{ background: form.widget_color }}
            >
              <p className="font-semibold text-xs mb-0.5">{form.agent_label || 'Support'}</p>
              <p className="text-xs opacity-80">We usually reply in minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messaging */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Messaging</h2>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Greeting message</label>
          <input
            value={form.greeting}
            onChange={(e) => f('greeting', e.target.value)}
            placeholder="Hi! How can we help you today?"
            className={inp}
            disabled={!isAdmin}
            maxLength={300}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Offline message</label>
          <textarea
            value={form.offline_msg}
            onChange={(e) => f('offline_msg', e.target.value)}
            placeholder="We are offline right now. Leave a message and we'll get back to you."
            className={`${inp} resize-none`}
            rows={2}
            disabled={!isAdmin}
            maxLength={300}
          />
          <p className="text-[10px] text-gray-400 mt-1">Shown when no agents are online.</p>
        </div>
      </div>

      {/* Embed code */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Embed Code</h2>
        <p className="text-xs text-gray-500">
          Paste this snippet just before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag on any page where you want the chat widget to appear.
        </p>

        <div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={embedCode}
              className={`${inpMono} bg-gray-50 text-gray-600 cursor-text select-all`}
            />
            <button
              onClick={copyEmbed}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-700 flex-shrink-0 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            </button>
            <a
              href={`${apiBase}/webchat/widget-config/${tenantSlug}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-700 flex-shrink-0"
              title="Test widget config endpoint"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
          <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            The widget loads asynchronously and won't affect your page load speed. It automatically
            matches the colour and messaging you configure above — no code changes needed after
            the initial embed.
          </p>
        </div>
      </div>

      {update.isError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {(update.error as Error).message}
        </p>
      )}
    </div>
  )
}
