import { useState, useEffect } from 'react'
import { Phone, Save, Loader2, Check, Eye, EyeOff, ExternalLink, Info } from 'lucide-react'
import { usePhoneSettings, useUpdatePhoneSettings } from '@/hooks/useCalls'
import { useAuth } from '@/lib/auth'

const inp = 'w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 font-mono'
const inpPlain = 'w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'

// ─── Simple toggle ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200
        ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
          ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}

// ─── Secret field (shows masked value, allows overwrite) ──────────────────────
function SecretField({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string
}) {
  const [show, setShow] = useState(false)
  const isMasked = value === '••••••••'

  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inp} pr-8`}
          onFocus={() => { if (isMasked) onChange('') }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
      {isMasked && (
        <p className="text-[10px] text-gray-400 mt-0.5">Click to replace the existing value</p>
      )}
    </div>
  )
}

export default function PhoneSettingsPage() {
  const { data: settings, isLoading } = usePhoneSettings()
  const update = useUpdatePhoneSettings()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  const [form, setForm] = useState({
    enabled:         false,
    pbxLabel:        'PBX / Phone System',
    dialUrl:         '',
    dialAuthHeader:  '',
    webhookSecret:   '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!settings) return
    setForm({
      enabled:        settings.enabled,
      pbxLabel:       settings.pbxLabel || 'PBX / Phone System',
      dialUrl:        settings.dialUrl || '',
      dialAuthHeader: settings.dialAuthHeader || '',
      webhookSecret:  settings.webhookSecret || '',
    })
  }, [settings])

  const handleSave = () => {
    update.mutate(form, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      },
    })
  }

  // Derive the tenant slug for the webhook URL hint
  const tenantSlug = profile?.tenant?.slug ?? '<your-tenant-slug>'
  const apiBase    = import.meta.env.VITE_API_URL ?? 'https://your-api-domain.com'
  const webhookUrl = `${apiBase}/phone/webhook/${tenantSlug}`

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
          <h1 className="text-xl font-bold text-gray-900">Phone Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect any PBX or telephony platform via standard webhooks
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

      {/* Enable toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <Phone size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Phone Channel</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Enable inbound call ticket creation and click-to-call
              </p>
            </div>
          </div>
          {isAdmin
            ? <Toggle checked={form.enabled} onChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
            : <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${form.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {form.enabled ? 'Enabled' : 'Disabled'}
              </span>
          }
        </div>
      </div>

      {/* PBX identity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">PBX / System Label</h2>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Display name for your phone system
          </label>
          <input
            value={form.pbxLabel}
            onChange={(e) => setForm((f) => ({ ...f, pbxLabel: e.target.value }))}
            placeholder="e.g. 3CX, Asterisk, Twilio, Avaya"
            className={inpPlain}
            disabled={!isAdmin}
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Shown in the settings UI and call log. No functional effect.
          </p>
        </div>
      </div>

      {/* Inbound webhook */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Inbound Webhook</h2>
        <p className="text-xs text-gray-500">
          Configure your PBX to send call events (ringing, answered, ended, recording) to this URL.
        </p>

        {/* Webhook URL (read-only, copy-friendly) */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Your webhook URL</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={webhookUrl}
              className={`${inp} bg-gray-50 text-gray-600 cursor-text select-all`}
            />
            <a
              href={`${webhookUrl}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-700 flex-shrink-0"
            >
              <ExternalLink size={13} />
            </a>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            POST call events to this URL. Expected method: <code className="bg-gray-100 px-1 rounded">POST</code>, Content-Type: <code className="bg-gray-100 px-1 rounded">application/json</code>
          </p>
        </div>

        {isAdmin && (
          <SecretField
            label="Webhook secret (HMAC-SHA256)"
            value={form.webhookSecret}
            onChange={(v) => setForm((f) => ({ ...f, webhookSecret: v }))}
            placeholder="Leave blank to skip signature verification"
          />
        )}

        {/* Payload reference */}
        <details className="group">
          <summary className="flex items-center gap-1.5 text-xs text-blue-600 cursor-pointer list-none hover:text-blue-700">
            <Info size={12} />
            View expected webhook payload format
          </summary>
          <pre className="mt-2 text-[10px] bg-gray-900 text-green-300 rounded-lg p-3 overflow-x-auto leading-relaxed">{`{
  "event":           "call.ringing" | "call.answered" | "call.ended" | "call.recording_ready",
  "pbxCallId":       "string",      // unique call ID from your PBX
  "direction":       "inbound" | "outbound",
  "callerNumber":    "+27821234567", // E.164 format
  "calleeNumber":    "+27111234567",
  "agentExtension":  "101",         // optional
  "durationSeconds": 120,           // for call.ended
  "recordingUrl":    "https://...", // for call.recording_ready
  "timestamp":       "2026-05-12T10:00:00Z"
}

// Signature header (if webhook_secret is set):
// X-SupportDesk-Signature: sha256=<HMAC-SHA256 of raw body>`}</pre>
        </details>
      </div>

      {/* Click-to-call */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Click-to-Call (Outbound)</h2>
          {!form.dialUrl && (
            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
              Not configured
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          When an agent clicks "Call" on a ticket, SupportDesk will POST a dial request to your PBX at this URL.
        </p>

        {isAdmin ? (
          <>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Dial URL</label>
              <input
                value={form.dialUrl}
                onChange={(e) => setForm((f) => ({ ...f, dialUrl: e.target.value }))}
                placeholder="https://pbx.example.com/api/dial"
                className={inp}
              />
            </div>

            <SecretField
              label="Authorization header"
              value={form.dialAuthHeader}
              onChange={(v) => setForm((f) => ({ ...f, dialAuthHeader: v }))}
              placeholder="Bearer <token>  or  Basic <base64>"
            />
          </>
        ) : (
          <p className="text-xs text-gray-500 italic">
            {form.dialUrl ? `Configured — ${form.dialUrl}` : 'Not configured. Contact your admin.'}
          </p>
        )}

        {/* Dial payload reference */}
        <details className="group">
          <summary className="flex items-center gap-1.5 text-xs text-blue-600 cursor-pointer list-none hover:text-blue-700">
            <Info size={12} />
            View dial request payload
          </summary>
          <pre className="mt-2 text-[10px] bg-gray-900 text-green-300 rounded-lg p-3 overflow-x-auto leading-relaxed">{`// SupportDesk POSTs this JSON to your Dial URL:
{
  "action":          "dial",
  "callId":          "uuid",          // SupportDesk call record ID
  "callerExtension": "101",           // agent's extension (if configured)
  "calleeNumber":    "+27821234567",  // customer's phone number
  "metadata": {
    "ticketId": "uuid",
    "tenantId": "uuid"
  }
}

// Your PBX should:
//  1. Initiate the call between callerExtension and calleeNumber
//  2. Send call event webhooks back to the inbound webhook URL above`}</pre>
        </details>
      </div>

      {/* Agent extension hint */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-semibold">Agent extensions</p>
          <p>
            For click-to-call to work, each agent must have their PBX extension set on their user profile.
            Admins can set this in <strong>Admin &gt; Users</strong> by editing a user's profile.
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
