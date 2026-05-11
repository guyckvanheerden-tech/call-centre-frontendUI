import { useState, useEffect } from 'react'
import {
  Mail, MessageCircle, Globe, Save, FlaskConical,
  CheckCircle2, XCircle, Loader2, Eye, EyeOff, Info,
} from 'lucide-react'
import { useSettings, useUpdateSettings, useTestEmail } from '@/hooks/useSettings'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { EmailSettings, WhatsAppSettings, GeneralSettings } from '@/types'

const SENTINEL = '••••••••'

// ── Small reusable field components ──────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-gray-600 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function Input({
  value, onChange, type = 'text', placeholder, disabled, secret, monospace,
}: {
  value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; disabled?: boolean
  secret?: boolean; monospace?: boolean
}) {
  const [show, setShow] = useState(false)
  const inputType = secret ? (show ? 'text' : 'password') : type

  return (
    <div className="relative">
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none',
          'focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800',
          'placeholder-gray-300 disabled:bg-gray-50 disabled:text-gray-400',
          monospace && 'font-mono text-xs',
          secret && 'pr-9',
        )}
      />
      {secret && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
  )
}

function Select({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-700 bg-white"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <span className="text-gray-500">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  )
}

function SaveBar({ onSave, isSaving, saved, error }: {
  onSave: () => void; isSaving: boolean; saved: boolean; error: string | null
}) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
      <span className="text-xs">
        {error ? (
          <span className="text-red-500 flex items-center gap-1"><XCircle size={12} />{error}</span>
        ) : saved ? (
          <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} />Saved</span>
        ) : null}
      </span>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        {isSaving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

// ── Email Settings Section ────────────────────────────────────
function EmailSection({ initial }: { initial: EmailSettings }) {
  const [form, setForm]     = useState<EmailSettings>(initial)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [testTo, setTestTo] = useState('')
  const [testMsg, setTestMsg] = useState<{ ok: boolean; msg: string } | null>(null)

  const update     = useUpdateSettings()
  const testEmail  = useTestEmail()

  useEffect(() => { setForm(initial) }, [initial.provider, initial.fromEmail])

  const set = (k: keyof EmailSettings) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError(null); setSaved(false)
    try {
      await update.mutateAsync({
        category: 'email',
        data: form as unknown as Record<string, string>,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const handleTest = async () => {
    if (!testTo) return
    setTestMsg(null)
    try {
      await testEmail.mutateAsync(testTo)
      setTestMsg({ ok: true, msg: `Test email sent to ${testTo}` })
    } catch (e) {
      setTestMsg({ ok: false, msg: (e as Error).message })
    }
  }

  return (
    <SectionCard title="Email Configuration" icon={<Mail size={16} />}>
      {/* Provider */}
      <div>
        <FieldLabel>Email Provider</FieldLabel>
        <Select
          value={form.provider}
          onChange={set('provider')}
          options={[
            { value: 'graph',  label: 'Microsoft 365 / Graph API (recommended)' },
            { value: 'resend', label: 'Resend (fallback)' },
          ]}
        />
      </div>

      {/* Sender details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>From Email</FieldLabel>
          <Input value={form.fromEmail} onChange={set('fromEmail')}
            placeholder="support@company.com" />
        </div>
        <div>
          <FieldLabel required>From Name</FieldLabel>
          <Input value={form.fromName} onChange={set('fromName')}
            placeholder="SupportDesk" />
        </div>
      </div>

      <div>
        <FieldLabel>Reply-To Domain</FieldLabel>
        <Input value={form.replyToDomain} onChange={set('replyToDomain')}
          placeholder="tickets.company.com" />
        <p className="text-[11px] text-gray-400 mt-1">
          Customer replies go to <code>tickets+TICKET-ID@this-domain.com</code>.
          Leave blank to use the From address.
        </p>
      </div>

      {/* Microsoft Graph credentials — only shown when provider = graph */}
      {form.provider === 'graph' && (
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2 text-xs text-blue-700 mb-1">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            <span>
              Register an app in <strong>Azure AD → App Registrations</strong>, grant{' '}
              <strong>Mail.Send</strong> (Application permission), then add the credentials below.
            </span>
          </div>

          <div>
            <FieldLabel required>Tenant ID</FieldLabel>
            <Input value={form.msTenantId} onChange={set('msTenantId')}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" monospace />
          </div>
          <div>
            <FieldLabel required>Client (Application) ID</FieldLabel>
            <Input value={form.msClientId} onChange={set('msClientId')}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" monospace />
          </div>
          <div>
            <FieldLabel required>Client Secret</FieldLabel>
            <Input value={form.msClientSecret} onChange={set('msClientSecret')}
              placeholder={form.msClientSecret === SENTINEL ? 'Secret saved — enter new value to replace' : 'Paste client secret'}
              secret monospace />
            {form.msClientSecret === SENTINEL && (
              <p className="text-[11px] text-gray-400 mt-1">
                A secret is stored. Leave unchanged to keep it, or paste a new value to replace it.
              </p>
            )}
          </div>
        </div>
      )}

      <SaveBar onSave={handleSave} isSaving={update.isPending} saved={saved} error={error} />

      {/* Test email */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-600 mb-2">Send a test email</p>
        <div className="flex gap-2">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-800 placeholder-gray-300"
          />
          <button
            onClick={handleTest}
            disabled={!testTo || testEmail.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors"
          >
            {testEmail.isPending
              ? <><Loader2 size={12} className="animate-spin" />Sending…</>
              : <><FlaskConical size={12} />Test</>}
          </button>
        </div>
        {testMsg && (
          <p className={cn('text-xs mt-2 flex items-center gap-1', testMsg.ok ? 'text-emerald-600' : 'text-red-500')}>
            {testMsg.ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
            {testMsg.msg}
          </p>
        )}
      </div>
    </SectionCard>
  )
}

// ── WhatsApp Settings Section ─────────────────────────────────
function WhatsAppSection({ initial }: { initial: WhatsAppSettings }) {
  const [form, setForm]   = useState<WhatsAppSettings>(initial)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const update = useUpdateSettings()

  useEffect(() => { setForm(initial) }, [initial.accountSid])

  const set = (k: keyof WhatsAppSettings) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError(null); setSaved(false)
    try {
      await update.mutateAsync({
        category: 'whatsapp',
        data: form as unknown as Record<string, string>,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <SectionCard title="WhatsApp / Twilio" icon={<MessageCircle size={16} />}>
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <Info size={12} className="mt-0.5 flex-shrink-0 text-gray-400" />
        <span>
          Create a Twilio account and activate a WhatsApp sender at{' '}
          <a href="https://console.twilio.com" target="_blank" rel="noreferrer"
            className="text-blue-500 hover:underline">console.twilio.com</a>.
          Set the webhook URL to{' '}
          <code className="bg-white border border-gray-200 px-1 rounded text-[10px]">
            POST https://your-api/webhooks/whatsapp/inbound
          </code>
        </span>
      </div>

      <div>
        <FieldLabel>Account SID</FieldLabel>
        <Input value={form.accountSid} onChange={set('accountSid')}
          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" monospace />
      </div>
      <div>
        <FieldLabel>Auth Token</FieldLabel>
        <Input value={form.authToken} onChange={set('authToken')}
          placeholder={form.authToken === SENTINEL ? 'Token saved' : 'Paste auth token'}
          secret monospace />
      </div>
      <div>
        <FieldLabel>From Number</FieldLabel>
        <Input value={form.fromNumber} onChange={set('fromNumber')}
          placeholder="+14155238886" />
        <p className="text-[11px] text-gray-400 mt-1">
          The Twilio WhatsApp number (without the whatsapp: prefix).
        </p>
      </div>

      <SaveBar onSave={handleSave} isSaving={update.isPending} saved={saved} error={error} />
    </SectionCard>
  )
}

// ── General Settings Section ──────────────────────────────────
function GeneralSection({ initial }: { initial: GeneralSettings }) {
  const [form, setForm]   = useState<GeneralSettings>(initial)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const update = useUpdateSettings()

  useEffect(() => { setForm(initial) }, [initial.companyName])

  const set = (k: keyof GeneralSettings) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError(null); setSaved(false)
    try {
      await update.mutateAsync({
        category: 'general',
        data: form as unknown as Record<string, string>,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <SectionCard title="General" icon={<Globe size={16} />}>
      <div>
        <FieldLabel>Company / Brand Name</FieldLabel>
        <Input value={form.companyName} onChange={set('companyName')}
          placeholder="SupportDesk" />
        <p className="text-[11px] text-gray-400 mt-1">
          Appears in outgoing email footers and the sidebar logo.
        </p>
      </div>
      <div>
        <FieldLabel>Support Portal URL</FieldLabel>
        <Input value={form.supportUrl} onChange={set('supportUrl')}
          placeholder="https://support.company.com" />
        <p className="text-[11px] text-gray-400 mt-1">
          Used in SLA alert emails as the "View Ticket" link base URL.
        </p>
      </div>
      <SaveBar onSave={handleSave} isSaving={update.isPending} saved={saved} error={error} />
    </SectionCard>
  )
}

// ── Page ──────────────────────────────────────────────────────

const EMPTY_EMAIL: EmailSettings = {
  provider: 'graph', fromEmail: '', fromName: 'SupportDesk',
  replyToDomain: '', msTenantId: '', msClientId: '', msClientSecret: '',
}
const EMPTY_WA: WhatsAppSettings = { accountSid: '', authToken: '', fromNumber: '' }
const EMPTY_GEN: GeneralSettings = { companyName: 'SupportDesk', supportUrl: '' }

export default function AdminSettingsPage() {
  const { profile } = useAuth()
  const { data: rows = [], isLoading } = useSettings()

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Admin access required.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-400" />
      </div>
    )
  }

  const byCategory = Object.fromEntries(rows.map((r) => [r.category, r.data]))

  const emailData   = { ...EMPTY_EMAIL,   ...(byCategory.email    ?? {}) } as EmailSettings
  const waData      = { ...EMPTY_WA,      ...(byCategory.whatsapp ?? {}) } as WhatsAppSettings
  const generalData = { ...EMPTY_GEN,     ...(byCategory.general  ?? {}) } as GeneralSettings

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-900">System Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Configure email, messaging channels, and general system options.
          Changes take effect immediately — no restart needed.
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5 bg-gray-50">
        <GeneralSection    initial={generalData} />
        <EmailSection      initial={emailData} />
        <WhatsAppSection   initial={waData} />
      </div>
    </div>
  )
}
