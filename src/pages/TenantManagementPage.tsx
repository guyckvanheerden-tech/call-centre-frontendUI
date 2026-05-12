import { useState } from 'react'
import { Plus, Pencil, Check, X, Building2, Users, Ticket, ChevronDown } from 'lucide-react'
import { useTenants, useCreateTenant, useUpdateTenant } from '@/hooks/useTenants'
import type { TenantWithStats } from '@/types'
import { cn, formatRelative } from '@/lib/utils'

const PLANS = ['standard', 'pro', 'enterprise'] as const
type Plan = typeof PLANS[number]

const planConfig: Record<Plan, { label: string; color: string; bg: string }> = {
  standard:   { label: 'Standard',   color: 'text-gray-600',   bg: 'bg-gray-100'   },
  pro:        { label: 'Pro',        color: 'text-blue-700',   bg: 'bg-blue-50'    },
  enterprise: { label: 'Enterprise', color: 'text-purple-700', bg: 'bg-purple-50'  },
}

interface DraftTenant {
  name: string; slug: string; plan: Plan
  adminName: string; adminEmail: string; adminPassword: string
}

const emptyDraft = (): DraftTenant => ({
  name: '', slug: '', plan: 'standard',
  adminName: '', adminEmail: '', adminPassword: '',
})

export default function TenantManagementPage() {
  const { data: tenants = [], isLoading } = useTenants()
  const createTenant = useCreateTenant()
  const updateTenant = useUpdateTenant()

  const [showCreate,  setShowCreate]  = useState(false)
  const [draft,       setDraft]       = useState<DraftTenant>(emptyDraft())
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editDraft,   setEditDraft]   = useState<{ name: string; slug: string; plan: Plan } | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
    setDraft((d) => ({ ...d, name, slug }))
  }

  const submitCreate = () => {
    if (!draft.name.trim() || !draft.slug.trim()) return
    setCreateError(null)
    const body: Parameters<typeof createTenant.mutate>[0] = {
      name: draft.name, slug: draft.slug, plan: draft.plan,
    }
    if (draft.adminEmail && draft.adminPassword && draft.adminName) {
      body.adminName     = draft.adminName
      body.adminEmail    = draft.adminEmail
      body.adminPassword = draft.adminPassword
    }
    createTenant.mutate(body, {
      onSuccess: () => { setShowCreate(false); setDraft(emptyDraft()) },
      onError:   (e) => setCreateError((e as Error).message),
    })
  }

  const startEdit = (t: TenantWithStats) => {
    setEditingId(t.id)
    setEditDraft({ name: t.name, slug: t.slug, plan: (t.plan as Plan) ?? 'standard' })
  }
  const saveEdit = (id: string) => {
    if (!editDraft) return
    updateTenant.mutate({ id, patch: editDraft }, { onSuccess: () => setEditingId(null) })
  }

  const inp = 'w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} across the platform
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus size={13} />
          New Tenant
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Building2 size={16} className="text-blue-500" />} label="Total Tenants" value={tenants.length} />
        <StatCard icon={<Users size={16} className="text-emerald-500" />}  label="Total Users"   value={tenants.reduce((s, t) => s + t.userCount, 0)} />
        <StatCard icon={<Ticket size={16} className="text-purple-500" />}  label="Total Tickets" value={tenants.reduce((s, t) => s + t.ticketCount, 0)} />
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">New Tenant</h2>
            <button onClick={() => { setShowCreate(false); setDraft(emptyDraft()); setCreateError(null) }}
              className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={14} /></button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Company Name *</label>
              <input value={draft.name} onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Corp" className={inp} autoFocus />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Slug *</label>
              <input value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                placeholder="acme-corp" className={`${inp} font-mono`} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Plan</label>
              <select value={draft.plan} onChange={(e) => setDraft((d) => ({ ...d, plan: e.target.value as Plan }))}
                className={inp}>
                {PLANS.map((p) => <option key={p} value={p}>{planConfig[p].label}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Initial Admin User <span className="font-normal text-gray-400">(optional)</span></p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name</label>
                <input value={draft.adminName} onChange={(e) => setDraft((d) => ({ ...d, adminName: e.target.value }))}
                  placeholder="Jane Smith" className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input type="email" value={draft.adminEmail} onChange={(e) => setDraft((d) => ({ ...d, adminEmail: e.target.value }))}
                  placeholder="jane@acme.com" className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Password</label>
                <input type="password" value={draft.adminPassword} onChange={(e) => setDraft((d) => ({ ...d, adminPassword: e.target.value }))}
                  placeholder="Min 8 characters" className={inp} />
              </div>
            </div>
          </div>

          {createError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{createError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowCreate(false); setDraft(emptyDraft()); setCreateError(null) }}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={submitCreate}
              disabled={createTenant.isPending || !draft.name.trim() || !draft.slug.trim()}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {createTenant.isPending ? 'Creating…' : 'Create Tenant'}
            </button>
          </div>
        </div>
      )}

      {/* Tenant table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Tenant</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Slug</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Users</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tickets</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tenants.map((t) => {
              const pc = planConfig[(t.plan as Plan) ?? 'standard']
              if (editingId === t.id && editDraft) {
                return (
                  <tr key={t.id} className="bg-blue-50/30">
                    <td className="px-5 py-2">
                      <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                        className={`${inp} w-40`} autoFocus />
                    </td>
                    <td className="px-4 py-2">
                      <input value={editDraft.slug}
                        onChange={(e) => setEditDraft({ ...editDraft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        className={`${inp} w-32 font-mono`} />
                    </td>
                    <td className="px-4 py-2">
                      <select value={editDraft.plan} onChange={(e) => setEditDraft({ ...editDraft, plan: e.target.value as Plan })}
                        className={`${inp} w-28`}>
                        {PLANS.map((p) => <option key={p} value={p}>{planConfig[p].label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500" colSpan={3}></td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => saveEdit(t.id)} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"><Check size={13} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><X size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {t.name[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium text-gray-900">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{t.slug}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', pc.color, pc.bg)}>
                      {pc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs text-gray-700">
                      <Users size={12} className="text-gray-400" />
                      {t.userCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs text-gray-700">
                      <Ticket size={12} className="text-gray-400" />
                      {t.ticketCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400">{formatRelative(t.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => startEdit(t)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}

            {tenants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                  No tenants yet. Click "New Tenant" to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-gray-900">{value.toLocaleString()}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}
