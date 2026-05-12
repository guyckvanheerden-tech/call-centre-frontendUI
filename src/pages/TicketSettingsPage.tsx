import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, CheckCircle2, Circle, Sparkles, Tag } from 'lucide-react'
import {
  useTicketStatuses, useCreateTicketStatus,
  useUpdateTicketStatus, useDeleteTicketStatus,
} from '@/hooks/useTicketStatuses'
import {
  useTicketTypes, useCreateTicketType,
  useUpdateTicketType, useDeleteTicketType,
} from '@/hooks/useTicketTypes'
import type { TicketStatusDef, TicketTypeDef } from '@/types'
import { colorToStyle, cn } from '@/lib/utils'

// ─── Shared ───────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#6366F1', '#EC4899', '#F97316', '#14B8A6',
  '#6B7280', '#1D4ED8', '#065F46', '#92400E', '#7C3AED',
]

const inp = 'w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'

// ─── Suggested status presets ─────────────────────────────────────────────────

interface SuggestedStatus {
  name: string; label: string; color: string
  isDefault: boolean; isResolved: boolean; sortOrder: number
}

const SUGGESTED_STATUSES: SuggestedStatus[] = [
  { name: 'open',              label: 'Open',               color: '#10B981', isDefault: true,  isResolved: false, sortOrder: 0 },
  { name: 'pending',           label: 'Pending',            color: '#F59E0B', isDefault: false, isResolved: false, sortOrder: 1 },
  { name: 'in_progress',       label: 'In Progress',        color: '#3B82F6', isDefault: false, isResolved: false, sortOrder: 2 },
  { name: 'waiting_3rd_party', label: 'Waiting on 3rd Party', color: '#06B6D4', isDefault: false, isResolved: false, sortOrder: 3 },
  { name: 'on_hold',           label: 'On Hold',            color: '#F97316', isDefault: false, isResolved: false, sortOrder: 4 },
  { name: 'resolved',          label: 'Resolved',           color: '#6B7280', isDefault: false, isResolved: true,  sortOrder: 5 },
]

// ─── Suggested type presets ───────────────────────────────────────────────────

interface SuggestedType {
  name: string; label: string; color: string; sortOrder: number
}

const SUGGESTED_TYPES: SuggestedType[] = [
  { name: 'sales_query',   label: 'Sales Query',   color: '#3B82F6', sortOrder: 0 },
  { name: 'quote',         label: 'Quote',          color: '#10B981', sortOrder: 1 },
  { name: 'service_query', label: 'Service Query',  color: '#F59E0B', sortOrder: 2 },
  { name: 'account_query', label: 'Account Query',  color: '#8B5CF6', sortOrder: 3 },
]

// ═══════════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════════

type Tab = 'statuses' | 'types'

export default function TicketSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('statuses')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ticket Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure the statuses and types used across your support workflow
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <TabButton active={activeTab === 'statuses'} onClick={() => setActiveTab('statuses')}>
          <CheckCircle2 size={13} />
          Ticket Statuses
        </TabButton>
        <TabButton active={activeTab === 'types'} onClick={() => setActiveTab('types')}>
          <Tag size={13} />
          Ticket Types
        </TabButton>
      </div>

      {/* Tab panels */}
      {activeTab === 'statuses' ? <StatusesPanel /> : <TypesPanel />}
    </div>
  )
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all',
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700',
      )}
    >
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Statuses Panel
// ═══════════════════════════════════════════════════════════════════════════════

type StatusDraft = Omit<TicketStatusDef, 'id'>

const emptyStatus = (sortOrder: number): StatusDraft => ({
  name: '', label: '', color: '#3B82F6', sortOrder, isDefault: false, isResolved: false,
})

function StatusesPanel() {
  const { data: statuses = [] } = useTicketStatuses()
  const createStatus = useCreateTicketStatus()
  const updateStatus = useUpdateTicketStatus()
  const deleteStatus = useDeleteTicketStatus()

  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft]     = useState<StatusDraft | null>(null)

  const startEdit = (s: TicketStatusDef) => {
    setEditing(s.id)
    setDraft({ name: s.name, label: s.label, color: s.color, sortOrder: s.sortOrder, isDefault: s.isDefault, isResolved: s.isResolved })
  }
  const startNew = () => { setDraft(emptyStatus(statuses.length)); setEditing('__new__') }
  const cancel   = () => { setEditing(null); setDraft(null) }

  const save = () => {
    if (!draft || !draft.name.trim() || !draft.label.trim()) return
    if (editing === '__new__') {
      createStatus.mutate(draft, { onSuccess: cancel })
    } else if (editing) {
      updateStatus.mutate({ id: editing, patch: draft }, { onSuccess: cancel })
    }
  }

  // Suggestions not yet in the list
  const existingNames = new Set(statuses.map((s) => s.name))
  const suggestions   = SUGGESTED_STATUSES.filter((s) => !existingNames.has(s.name))

  const addSuggestion = (s: SuggestedStatus) => {
    createStatus.mutate({ ...s, sortOrder: statuses.length + s.sortOrder })
  }

  return (
    <div className="space-y-5">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-blue-500" />
            <span className="text-sm font-semibold text-blue-900">Suggested Statuses</span>
            <span className="text-xs text-blue-500">— click any to add it instantly</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.name}
                onClick={() => addSuggestion(s)}
                disabled={createStatus.isPending}
                className="group flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full border border-blue-200 bg-white hover:border-blue-400 hover:shadow-sm transition-all text-xs font-medium text-gray-700 disabled:opacity-50"
              >
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  style={colorToStyle(s.color)}
                >
                  {s.label}
                </span>
                {s.isDefault  && <span className="text-[10px] text-blue-400 font-normal">default</span>}
                {s.isResolved && <span className="text-[10px] text-emerald-500 font-normal">resolves</span>}
                <Plus size={11} className="text-blue-400 group-hover:text-blue-600 ml-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Your Statuses
            <span className="ml-2 text-xs font-normal text-gray-400">{statuses.length} configured</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Set one as <span className="font-medium text-blue-600">default</span> (applied to new tickets) and one as <span className="font-medium text-emerald-600">resolved</span> (closes the ticket)
          </p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={13} />
          Add Status
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Preview</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Label</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Colour</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Order</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-blue-600">Default</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-emerald-600">Resolved</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {editing === '__new__' && draft && (
              <StatusEditRow draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} />
            )}

            {statuses.map((s) =>
              editing === s.id && draft ? (
                <StatusEditRow key={s.id} draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} />
              ) : (
                <tr key={s.id} className="hover:bg-gray-50 group">
                  <td className="px-5 py-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={colorToStyle(s.color)}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{s.label}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="font-mono text-xs text-gray-400">{s.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.sortOrder}</td>
                  <td className="px-3 py-3 text-center">
                    {s.isDefault
                      ? <CheckCircle2 size={15} className="text-blue-500 mx-auto" />
                      : <Circle size={15} className="text-gray-200 mx-auto" />}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {s.isResolved
                      ? <CheckCircle2 size={15} className="text-emerald-500 mx-auto" />
                      : <Circle size={15} className="text-gray-200 mx-auto" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(s)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteStatus.mutate(s.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {statuses.length === 0 && editing !== '__new__' && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <p className="text-sm text-gray-400">No statuses configured yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Use the suggestions above or click "Add Status" to create a custom one.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusEditRow({
  draft, onChange, onSave, onCancel,
}: {
  draft: StatusDraft
  onChange: (d: StatusDraft) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <tr className="bg-blue-50/40">
      <td className="px-5 py-2.5">
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={colorToStyle(draft.color)}>
          {draft.label || draft.name || 'Preview'}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <input
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })}
          placeholder="e.g. in_progress"
          className={inp}
          autoFocus
        />
      </td>
      <td className="px-4 py-2.5">
        <input
          value={draft.label}
          onChange={(e) => onChange({ ...draft, label: e.target.value })}
          placeholder="e.g. In Progress"
          className={inp}
        />
      </td>
      <td className="px-4 py-2.5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange({ ...draft, color: c })}
                className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: draft.color === c ? '#1e40af' : 'transparent' }}
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
      <td className="px-4 py-2.5">
        <input
          type="number"
          value={draft.sortOrder}
          onChange={(e) => onChange({ ...draft, sortOrder: parseInt(e.target.value) || 0 })}
          className={`${inp} w-14`}
        />
      </td>
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={draft.isDefault}
          onChange={(e) => onChange({ ...draft, isDefault: e.target.checked })}
          className="accent-blue-600 w-3.5 h-3.5"
        />
      </td>
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={draft.isResolved}
          onChange={(e) => onChange({ ...draft, isResolved: e.target.checked })}
          className="accent-emerald-600 w-3.5 h-3.5"
        />
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1 justify-end">
          <button onClick={onSave} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"><Check size={13} /></button>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><X size={13} /></button>
        </div>
      </td>
    </tr>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Types Panel
// ═══════════════════════════════════════════════════════════════════════════════

type TypeDraft = Omit<TicketTypeDef, 'id'>

const emptyType = (sortOrder: number): TypeDraft => ({
  name: '', label: '', color: '#3B82F6', sortOrder,
})

function TypesPanel() {
  const { data: types = [] }   = useTicketTypes()
  const createType = useCreateTicketType()
  const updateType = useUpdateTicketType()
  const deleteType = useDeleteTicketType()

  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft]     = useState<TypeDraft | null>(null)

  const startEdit = (t: TicketTypeDef) => {
    setEditing(t.id)
    setDraft({ name: t.name, label: t.label, color: t.color, sortOrder: t.sortOrder })
  }
  const startNew = () => { setDraft(emptyType(types.length)); setEditing('__new__') }
  const cancel   = () => { setEditing(null); setDraft(null) }

  const save = () => {
    if (!draft || !draft.name.trim() || !draft.label.trim()) return
    if (editing === '__new__') {
      createType.mutate(draft, { onSuccess: cancel })
    } else if (editing) {
      updateType.mutate({ id: editing, patch: draft }, { onSuccess: cancel })
    }
  }

  // Suggestions not yet in the list
  const existingNames = new Set(types.map((t) => t.name))
  const suggestions   = SUGGESTED_TYPES.filter((t) => !existingNames.has(t.name))

  const addSuggestion = (t: SuggestedType) => {
    createType.mutate({ ...t, sortOrder: types.length + t.sortOrder })
  }

  return (
    <div className="space-y-5">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-violet-500" />
            <span className="text-sm font-semibold text-violet-900">Suggested Types</span>
            <span className="text-xs text-violet-500">— click any to add it instantly</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((t) => (
              <button
                key={t.name}
                onClick={() => addSuggestion(t)}
                disabled={createType.isPending}
                className="group flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full border border-violet-200 bg-white hover:border-violet-400 hover:shadow-sm transition-all text-xs font-medium text-gray-700 disabled:opacity-50"
              >
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  style={colorToStyle(t.color)}
                >
                  {t.label}
                </span>
                <Plus size={11} className="text-violet-400 group-hover:text-violet-600 ml-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Your Types
            <span className="ml-2 text-xs font-normal text-gray-400">{types.length} configured</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            A ticket type must be set before an agent can send a reply
          </p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={13} />
          Add Type
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Preview</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Label</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Colour</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Order</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {editing === '__new__' && draft && (
              <TypeEditRow draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} />
            )}

            {types.map((t) =>
              editing === t.id && draft ? (
                <TypeEditRow key={t.id} draft={draft} onChange={setDraft} onSave={save} onCancel={cancel} />
              ) : (
                <tr key={t.id} className="hover:bg-gray-50 group">
                  <td className="px-5 py-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={colorToStyle(t.color)}>
                      {t.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{t.label}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="font-mono text-xs text-gray-400">{t.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(t)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteType.mutate(t.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
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
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-sm text-gray-400">No ticket types configured yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Use the suggestions above or click "Add Type" to create a custom one.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TypeEditRow({
  draft, onChange, onSave, onCancel,
}: {
  draft: TypeDraft
  onChange: (d: TypeDraft) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <tr className="bg-blue-50/40">
      <td className="px-5 py-2.5">
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={colorToStyle(draft.color)}>
          {draft.label || draft.name || 'Preview'}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <input
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })}
          placeholder="e.g. sales_query"
          className={inp}
          autoFocus
        />
      </td>
      <td className="px-4 py-2.5">
        <input
          value={draft.label}
          onChange={(e) => onChange({ ...draft, label: e.target.value })}
          placeholder="e.g. Sales Query"
          className={inp}
        />
      </td>
      <td className="px-4 py-2.5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange({ ...draft, color: c })}
                className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: draft.color === c ? '#1e40af' : 'transparent' }}
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
      <td className="px-4 py-2.5">
        <input
          type="number"
          value={draft.sortOrder}
          onChange={(e) => onChange({ ...draft, sortOrder: parseInt(e.target.value) || 0 })}
          className={`${inp} w-14`}
        />
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1 justify-end">
          <button onClick={onSave} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"><Check size={13} /></button>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><X size={13} /></button>
        </div>
      </td>
    </tr>
  )
}
