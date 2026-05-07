import { useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { NotificationSettings, AlertRecipient, NotificationThreshold } from '@/types'
import { cn } from '@/lib/utils'

const RECIPIENTS: { value: AlertRecipient; label: string }[] = [
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' },
]

interface Props {
  settings: NotificationSettings
  onChange: (patch: Partial<NotificationSettings>) => void
}

export default function NotificationPanel({ settings, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* At-Risk Alerts */}
      <AlertSection
        title="At-Risk Alerts"
        description="Notify when a ticket is approaching its SLA deadline."
        enabled={settings.atRisk.enabled}
        onToggle={(v) => onChange({ atRisk: { ...settings.atRisk, enabled: v } })}
      >
        <div className="space-y-2">
          {settings.atRisk.thresholds.map((threshold, idx) => (
            <ThresholdRow
              key={threshold.id}
              threshold={threshold}
              onChange={(patch) => {
                const updated = settings.atRisk.thresholds.map((t, i) =>
                  i === idx ? { ...t, ...patch } : t
                )
                onChange({ atRisk: { ...settings.atRisk, thresholds: updated } })
              }}
              onDelete={() => {
                const updated = settings.atRisk.thresholds.filter((_, i) => i !== idx)
                onChange({ atRisk: { ...settings.atRisk, thresholds: updated } })
              }}
            />
          ))}
          <button
            onClick={() => {
              const newThreshold: NotificationThreshold = {
                id: `t${Date.now()}`, percentage: 80, recipients: ['agent'], enabled: true,
              }
              onChange({ atRisk: { ...settings.atRisk, thresholds: [...settings.atRisk.thresholds, newThreshold] } })
            }}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mt-2"
          >
            <Plus size={12} />
            Add threshold
          </button>
        </div>
      </AlertSection>

      {/* Breach Alerts */}
      <AlertSection
        title="Breach Alerts"
        description="Notify immediately when an SLA is breached."
        enabled={settings.breach.enabled}
        onToggle={(v) => onChange({ breach: { ...settings.breach, enabled: v } })}
      >
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Notify</label>
          <RecipientCheckboxes
            selected={settings.breach.recipients}
            onChange={(r) => onChange({ breach: { ...settings.breach, recipients: r } })}
          />
        </div>
      </AlertSection>

      {/* Reminder Alerts */}
      <AlertSection
        title="Post-Breach Reminders"
        description="Send repeated reminders after a breach until resolved."
        enabled={settings.reminder.enabled}
        onToggle={(v) => onChange({ reminder: { ...settings.reminder, enabled: v } })}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Interval</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={settings.reminder.intervalMinutes}
                  onChange={(e) => onChange({ reminder: { ...settings.reminder, intervalMinutes: +e.target.value } })}
                  className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 text-center"
                />
                <span className="text-xs text-gray-500">mins</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max reminders</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.reminder.maxCount ?? ''}
                  placeholder="∞"
                  onChange={(e) => onChange({ reminder: { ...settings.reminder, maxCount: e.target.value ? +e.target.value : null } })}
                  className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 text-center"
                />
                <button
                  onClick={() => onChange({ reminder: { ...settings.reminder, maxCount: null } })}
                  className={cn(
                    'text-xs px-2 py-1 rounded-lg border transition-colors',
                    settings.reminder.maxCount === null
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  Until resolved
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Notify</label>
            <RecipientCheckboxes
              selected={settings.reminder.recipients}
              onChange={(r) => onChange({ reminder: { ...settings.reminder, recipients: r } })}
            />
          </div>
        </div>
      </AlertSection>
    </div>
  )
}

function AlertSection({
  title, description, enabled, onToggle, children,
}: {
  title: string; description: string; enabled: boolean
  onToggle: (v: boolean) => void; children: React.ReactNode
}) {
  return (
    <div className={cn(
      'border rounded-xl transition-all',
      enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50'
    )}>
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <button onClick={() => onToggle(!enabled)} className="flex-shrink-0 ml-4 mt-0.5">
          {enabled
            ? <ToggleRight size={24} className="text-blue-600" />
            : <ToggleLeft size={24} className="text-gray-300" />
          }
        </button>
      </div>
      {enabled && <div className="p-4">{children}</div>}
    </div>
  )
}

function ThresholdRow({
  threshold, onChange, onDelete,
}: {
  threshold: NotificationThreshold
  onChange: (patch: Partial<NotificationThreshold>) => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="number"
          min={1}
          max={99}
          value={threshold.percentage}
          onChange={(e) => onChange({ percentage: +e.target.value })}
          className="w-12 text-xs border border-gray-200 bg-white rounded-lg px-2 py-1 outline-none focus:border-blue-400 text-center font-semibold"
        />
        <span className="text-xs text-gray-500">%</span>
      </div>

      <div className="flex items-center gap-2 flex-1">
        {RECIPIENTS.map((r) => (
          <label key={r.value} className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={threshold.recipients.includes(r.value)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...threshold.recipients, r.value]
                  : threshold.recipients.filter((x) => x !== r.value)
                onChange({ recipients: next })
              }}
              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 accent-blue-600"
            />
            <span className="text-xs text-gray-700">{r.label}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onChange({ enabled: !threshold.enabled })}>
          {threshold.enabled
            ? <ToggleRight size={18} className="text-blue-600" />
            : <ToggleLeft size={18} className="text-gray-300" />
          }
        </button>
        <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function RecipientCheckboxes({
  selected, onChange,
}: {
  selected: AlertRecipient[]
  onChange: (r: AlertRecipient[]) => void
}) {
  return (
    <div className="flex items-center gap-4">
      {RECIPIENTS.map((r) => (
        <label key={r.value} className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(r.value)}
            onChange={(e) => {
              const next = e.target.checked
                ? [...selected, r.value]
                : selected.filter((x) => x !== r.value)
              onChange(next)
            }}
            className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600"
          />
          <span className="text-xs text-gray-700 font-medium">{r.label}</span>
        </label>
      ))}
    </div>
  )
}
