import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import {
  useTicketTypes, useCreateTicketType,
  useUpdateTicketType, useDeleteTicketType,
} from '@/hooks/useTicketTypes'
import type { TicketTypeDef } from '@/types'
import { colorToStyle } from '@/lib/utils'

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#6366F1', '#EC4899', '#F97316', '#14B8A6',
  '#6B7280', '#1D4ED8', '#065F46', '#92400E', '#7C3AED',
]

type DraftType = Omit<TicketTypeDef, 'id'>

const emptyType = (sortOrder: number): DraftType => ({
  name: '', label: '', color: '#3B82F6', sortOrder,
})

export default function TicketTypesPage() {
  const { data: types = [] }  = useTicketTypes()
  const createType = useCreateTicketType()
  const updateType = useUpdateTicketType()
  const deleteType = useDeleteTicketType()

  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft]     = useState<DraftType | null>(null)

  const startEdit = (t: TicketTypeDef) => {
    setEditing(t.id)
    setDraft({ name: t.name, label: t.label, color: t.color, sortOrder: t.sortOrder })
  }
  const startNew  = () => { setDraft(emptyType(types.length)); setEditing('__new__') }
  const cancel    = () => { setEditing(null); setDraft(null) }

  const save = () => {
    if (!draft) return
    if (!draft.name.trim() || !draft.label.trim()) return
    if (editing === '__new__') {
      createType.mutate(draft, { onSuccess: cancel })
    } else if (editing) {
      updateType.mutate({ id: editing, patch: draft }, { onSuccess: cancel })
    }
  }

  const inp = 'w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ticket Types</h1>
          <p className="text-sm text-gray-500 mt-0.5">Define the categories used to classify tickets</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={13} />
          New Type
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Preview</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name (stored value)</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Label</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Colour</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Order</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {editing === '__new__' && draft && (
              <EditRow draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} inp={inp} />
            )}

            {types.map((t) =>
              editing === t.id && draft ? (
                <EditRow key={t.id} draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} inp={inp} />
              ) : (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={colorToStyle(t.color)}
                    >
                      {t.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-600">{t.name}</td>
                  <td className="px-4 py-3.5 text-gray-900 font-medium">{t.label}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="font-mono text-xs text-gray-500">{t.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{t.sortOrder}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => startEdit(t)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteType.mutate(t.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {types.length === 0 && editing !== '__new__' && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                  No ticket types yet. Click "New Type" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EditRow({
  draft, onChange, onSave, onCancel, inp,
}: {
  draft: DraftType
  onChange: (d: DraftType) => void
  onSave: () => void
  onCancel: () => void
  inp: string
}) {
  return (
    <tr className="bg-blue-50/30">
      <td className="px-5 py-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={colorToStyle(draft.color)}
        >
          {draft.label || draft.name || 'Preview'}
        </span>
      </td>
      <td className="px-4 py-2">
        <input
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="e.g. Lead"
          className={inp}
          autoFocus
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={draft.label}
          onChange={(e) => onChange({ ...draft, label: e.target.value })}
          placeholder="e.g. Lead"
          className={inp}
        />
      </td>
      <td className="px-4 py-2">
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange({ ...draft, color: c })}
                className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: draft.color === c ? '#1e40af' : 'transparent',
                }}
              />
            ))}
          </div>
          <input
            type="text"
            value={draft.color}
            onChange={(e) => onChange({ ...draft, color: e.target.value })}
            placeholder="#3B82F6"
            className={`${inp} w-24 font-mono`}
          />
        </div>
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          value={draft.sortOrder}
          onChange={(e) => onChange({ ...draft, sortOrder: parseInt(e.target.value) || 0 })}
          className={`${inp} w-16`}
        />
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
