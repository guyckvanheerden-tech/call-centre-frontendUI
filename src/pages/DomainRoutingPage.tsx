import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Globe } from 'lucide-react'
import { useDataStore } from '@/store'
import type { Domain } from '@/types'

const emptyDomain = (): Domain => ({
  id: `d${Date.now()}`, name: '', slaPolicyId: '', priority: 99,
})

export default function DomainRoutingPage() {
  const { domains, policies, addDomain, updateDomain, deleteDomain } = useDataStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Domain | null>(null)

  const startEdit = (d: Domain) => { setEditing(d.id); setDraft({ ...d }) }
  const startNew = () => { const d = emptyDomain(); setDraft(d); setEditing('__new__') }
  const cancel = () => { setEditing(null); setDraft(null) }

  const save = () => {
    if (!draft) return
    if (editing === '__new__') addDomain(draft)
    else updateDomain(draft.id, draft)
    cancel()
  }

  const sorted = [...domains].sort((a, b) => a.priority - b.priority)
  const inp = 'w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Domain Routing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Map email domains to SLA policies</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Plus size={13} />
          Add Domain
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Domain</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">SLA Policy</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Priority</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {editing === '__new__' && draft && (
              <DomainEditRow draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} policies={policies} />
            )}
            {sorted.map((domain) =>
              editing === domain.id && draft ? (
                <DomainEditRow key={domain.id} draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} policies={policies} />
              ) : (
                <tr key={domain.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900">{domain.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {policies.find((p) => p.id === domain.slaPolicyId)?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                      P{domain.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => startEdit(domain)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteDomain(domain.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
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

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
        <strong>How routing works:</strong> Incoming emails are matched to domains by priority order. The first match determines which SLA policy applies to the ticket.
      </div>
    </div>
  )
}

function DomainEditRow({
  draft, onChange, onSave, onCancel, policies,
}: {
  draft: Domain
  onChange: (d: Domain) => void
  onSave: () => void
  onCancel: () => void
  policies: { id: string; name: string }[]
}) {
  const inp = 'w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white'
  return (
    <tr className="bg-blue-50/30">
      <td className="px-5 py-2">
        <input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="Domain (e.g. company.com)" className={inp} autoFocus />
      </td>
      <td className="px-4 py-2">
        <select value={draft.slaPolicyId} onChange={(e) => onChange({ ...draft, slaPolicyId: e.target.value })} className={inp}>
          <option value="">Select policy…</option>
          {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2">
        <input type="number" value={draft.priority} min={1}
          onChange={(e) => onChange({ ...draft, priority: +e.target.value })}
          className={`${inp} w-16`} />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1 justify-end">
          <button onClick={onSave} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"><Check size={13} /></button>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><X size={13} /></button>
        </div>
      </td>
    </tr>
  )
}
