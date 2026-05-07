import { useState, useEffect } from 'react'
import { useSLAPolicies } from '@/hooks/useSLAPolicies'
import { useNotifications, useUpdateNotification } from '@/hooks/useNotifications'
import NotificationPanel from '@/components/notifications/NotificationPanel'
import type { NotificationSettings } from '@/types'

export default function NotificationControlsPage() {
  const { data: policies = [] } = useSLAPolicies()
  const { data: notifications = [] } = useNotifications()
  const updateNotification = useUpdateNotification()

  const [selected, setSelected] = useState<string>('')

  // Auto-select first policy once loaded
  useEffect(() => {
    if (!selected && policies.length > 0) {
      setSelected(policies[0].id)
    }
  }, [policies, selected])

  const settings = notifications.find((n) => n.policyId === selected)
  const policy = policies.find((p) => p.id === selected)

  const handleChange = (patch: Partial<NotificationSettings>) => {
    if (!selected) return
    updateNotification.mutate({ policyId: selected, patch })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notification Controls</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure SLA alert rules per policy</p>
      </div>

      {/* Policy selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="text-xs font-medium text-gray-500 mb-2 block">Configure for policy</label>
        <div className="flex flex-wrap gap-2">
          {policies.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selected === p.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.name}
            </button>
          ))}
          {policies.length === 0 && (
            <p className="text-xs text-gray-400">No SLA policies found. Create one in SLA Policies first.</p>
          )}
        </div>
      </div>

      {policy && settings ? (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{policy.name}</span>
            <span className="text-gray-400">·</span>
            <span>First response: {policy.firstResponseMinutes}min · Resolution: {policy.resolutionMinutes}min</span>
          </div>
          <NotificationPanel settings={settings} onChange={handleChange} />
        </>
      ) : (
        <div className="text-sm text-gray-400 py-12 text-center">
          {policies.length > 0 ? 'Select a policy to configure notifications.' : 'No policies available.'}
        </div>
      )}
    </div>
  )
}
