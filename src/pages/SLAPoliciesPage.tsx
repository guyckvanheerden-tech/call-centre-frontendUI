import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Clock } from 'lucide-react'
import { useDataStore } from '@/store'
import type { SLAPolicy } from '@/types'
import { minutesToHuman } from '@/lib/utils'

const emptyPolicy = (): SLAPolicy => ({
  id: `p${Date.now()}`, name: '', firstResponseMinutes: 240, resolutionMinutes: 1440, businessHoursOnly: true,
})

export default function SLAPoliciesPage() {
  const { policies, addPolicy, updatePolicy, deletePolicy } = useDataStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<SLAPolicy | null>(null)

  const startEdit = (policy: SLAPolicy) => { setEditing(policy.id); setDraft({ ...policy }) }
  const startNew = () => { const p = emptyPolicy(); setDraft(p); setEditing('__new__') }
  const cancel = () => { setEditing(null); setDraft(null) }

  const save = () => {
    if (!draft) return
    if (editing === '__new__') addPolicy(draft)
    else updatePolicy(draft.id, draft)
    cancel()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">SLA Policies</h1>
          <p className="text-sm text-gray-500 mt-0.5">Define response and resolution targets</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={13} />
          New Policy
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Policy Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">First Response</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Resolution</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Business Hours</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* New row */}
            {editing === '__new__' && draft && (
              <PolicyEditRow draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} />
            )}

            {policies.map((policy) =>
              editing === policy.id && draft ? (
                <PolicyEditRow key={policy.id} draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} />
              ) : (
                <tr key={policy.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{policy.name}</td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 text-gray-700">
                      <Clock size={12} className="text-gray-400" />
                      {minutesToHuman(policy.firstResponseMinutes)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 text-gray-700">
                      <Clock size={12} className="text-gray-400" />
                      {minutesToHuman(policy.resolutionMinutes)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${policy.businessHoursOnly ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {policy.businessHoursOnly ? 'Business hours' : '24 / 7'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => startEdit(policy)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deletePolicy(policy.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PolicyEditRow({
  draft, onChange, onSave, onCancel,
}: {
  draft: SLAPolicy
  onChange: (p: SLAPolicy) => void
  onSave: () => void
  onCancel: () => void
}) {
  const inp = 'w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
  return (
    <tr className="bg-blue-50/30">
      <td className="px-5 py-2">
        <input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="Policy name" className={inp} autoFocus />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <input type="number" value={draft.firstResponseMinutes}
            onChange={(e) => onChange({ ...draft, firstResponseMinutes: +e.target.value })}
            className={`${inp} w-20`} />
          <span className="text-xs text-gray-500">min</span>
        </div>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <input type="number" value={draft.resolutionMinutes}
            onChange={(e) => onChange({ ...draft, resolutionMinutes: +e.target.value })}
            className={`${inp} w-20`} />
          <span className="text-xs text-gray-500">min</span>
        </div>
      </td>
      <td className="px-4 py-2">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={draft.businessHoursOnly}
            onChange={(e) => onChange({ ...draft, businessHoursOnly: e.target.checked })}
            className="accent-blue-600" />
          <span className="text-xs text-gray-700">Business hours</span>
        </label>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1 justify-end">
          <button onClick={onSave} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600">
            <Check size={13} />
          </button>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}
