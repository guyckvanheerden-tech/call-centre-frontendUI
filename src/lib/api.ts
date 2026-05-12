/**
 * Thin API client — wraps all fetch calls to the Express backend.
 * Automatically attaches the Supabase JWT and handles errors.
 */
import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL as string ?? 'http://localhost:4000'

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `Request failed: ${res.status}`)
  return json as T
}

const get  = <T>(path: string)                  => request<T>('GET',    path)
const post = <T>(path: string, body: unknown)   => request<T>('POST',   path, body)
const patch = <T>(path: string, body: unknown)  => request<T>('PATCH',  path, body)
const del  = (path: string)                     => request<void>('DELETE', path)

// ── Tickets ───────────────────────────────────────────────────
export const ticketsApi = {
  list:       ()                              => get<Ticket[]>('/tickets'),
  get:        (id: string)                    => get<Ticket>(`/tickets/${id}`),
  create:     (body: CreateTicketInput)       => post<Ticket>('/tickets', body),
  update:     (id: string, body: Partial<Ticket>) => patch<Ticket>(`/tickets/${id}`, body),
  addMessage: (id: string, body: AddMessageInput) => post<TicketMessage>(`/tickets/${id}/messages`, body),
}

// ── Users ─────────────────────────────────────────────────────
export const usersApi = {
  list:   ()                               => get<User[]>('/users'),
  create: (body: CreateUserInput)          => post<User>('/users', body),
  update: (id: string, body: Partial<User> & { password?: string }) =>
    patch<User>(`/users/${id}`, body),
}

// ── Domains ───────────────────────────────────────────────────
export const domainsApi = {
  list:   ()                               => get<Domain[]>('/domains'),
  create: (body: DomainInput)              => post<Domain>('/domains', body),
  update: (id: string, body: Partial<DomainInput>) => patch<Domain>(`/domains/${id}`, body),
  delete: (id: string)                     => del(`/domains/${id}`),
}

// ── SLA Policies ──────────────────────────────────────────────
export const slaPoliciesApi = {
  list:   ()                               => get<SLAPolicy[]>('/sla-policies'),
  create: (body: SLAPolicyInput)           => post<SLAPolicy>('/sla-policies', body),
  update: (id: string, body: Partial<SLAPolicyInput>) => patch<SLAPolicy>(`/sla-policies/${id}`, body),
  delete: (id: string)                     => del(`/sla-policies/${id}`),
}

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  list:   ()                                       => get<NotificationSettings[]>('/notifications'),
  update: (policyId: string, body: Partial<NotificationSettings>) =>
    patch<{ ok: boolean }>(`/notifications/${policyId}`, body),
}

// ── AI ────────────────────────────────────────────────────────
export const aiApi = {
  grammarCheck: (text: string) =>
    post<{ corrected: string }>('/ai/grammar-check', { text }),
}

// ── Settings ──────────────────────────────────────────────────
export const settingsApi = {
  list:      ()                                         => get<SettingsCategory[]>('/settings'),
  get:       (category: string)                         => get<SettingsCategory>(`/settings/${category}`),
  update:    (category: string, data: Record<string, string>) =>
    request<{ ok: boolean }>('PUT', `/settings/${category}`, data),
  testEmail: (to: string)                               => post<{ ok: boolean }>('/settings/test-email', { to }),
}

// ── Tenants (super-admin) ─────────────────────────────────────
export const tenantsApi = {
  list:   ()                                              => get<TenantWithStats[]>('/tenants'),
  create: (body: CreateTenantInput)                       => post<TenantWithStats>('/tenants', body),
  update: (id: string, body: Partial<UpdateTenantInput>)  => patch<TenantWithStats>(`/tenants/${id}`, body),
}

// ── Ticket Statuses ───────────────────────────────────────────
export const ticketStatusesApi = {
  list:   ()                                              => get<TicketStatusDef[]>('/ticket-statuses'),
  create: (body: Omit<TicketStatusDef, 'id'>)             => post<TicketStatusDef>('/ticket-statuses', body),
  update: (id: string, body: Partial<TicketStatusDef>)    => patch<TicketStatusDef>(`/ticket-statuses/${id}`, body),
  delete: (id: string)                                    => del(`/ticket-statuses/${id}`),
}

// ── Ticket Types ──────────────────────────────────────────────
export const ticketTypesApi = {
  list:   ()                                              => get<TicketTypeDef[]>('/ticket-types'),
  create: (body: Omit<TicketTypeDef, 'id'>)               => post<TicketTypeDef>('/ticket-types', body),
  update: (id: string, body: Partial<TicketTypeDef>)      => patch<TicketTypeDef>(`/ticket-types/${id}`, body),
  delete: (id: string)                                    => del(`/ticket-types/${id}`),
}

// ── Reports ───────────────────────────────────────────────────
export const reportsApi = {
  daily: (start: string, end: string, agentId?: string) => {
    const params = new URLSearchParams({ start, end })
    if (agentId) params.set('agentId', agentId)
    return get<DailyRow[]>(`/reports/daily?${params}`)
  },
  kpi: (agentId?: string) => {
    const params = agentId ? `?agentId=${agentId}` : ''
    return get<KPIData>(`/reports/kpi${params}`)
  },
  agentHours: (start: string, end: string, agentId?: string) => {
    const params = new URLSearchParams({ start, end })
    if (agentId) params.set('agentId', agentId)
    return get<AgentHoursReport>(`/reports/agent-hours?${params}`)
  },
}

// ── Shared types (mirrors src/types/index.ts) ─────────────────
import type {
  Ticket, TicketMessage, User, Domain, SLAPolicy,
  NotificationSettings, KPIData, DailyRow, SettingsCategory, AgentHoursReport,
  TicketStatusDef, TicketTypeDef, TenantWithStats,
  Call, PhoneSettings, WidgetSettings, ChatSession, ChannelPreferences,
} from '@/types'

interface CreateTenantInput {
  name: string; slug: string; plan: string
  adminName?: string; adminEmail?: string; adminPassword?: string
}
interface UpdateTenantInput { name: string; slug: string; plan: string }
interface CreateTicketInput { subject: string; customerEmail: string; domainId: string }
interface AddMessageInput   { body: string; direction: 'inbound' | 'outbound' }
interface CreateUserInput   { name: string; email: string; role: string; password: string }
interface DomainInput       { name: string; slaPolicyId: string; priority: number }
interface SLAPolicyInput    {
  name: string; firstResponseMinutes: number;
  resolutionMinutes: number; businessHoursOnly: boolean
}

// ── Phone channel ──────────────────────────────────────────────────────────

export const phoneApi = {
  /** List calls — optionally scoped to a ticket */
  listCalls: (ticketId?: string) => {
    const qs = ticketId ? `?ticketId=${ticketId}` : ''
    return get<Call[]>(`/phone/calls${qs}`)
  },

  /** Initiate an outbound call (click-to-call) */
  dial: (payload: { ticketId: string; customerPhone: string; agentExtension?: string }) =>
    post<{ callId: string }>('/phone/dial', payload),

  /** Get phone/PBX settings for the tenant */
  getSettings: () => get<PhoneSettings>('/phone/settings'),

  /** Update phone/PBX settings */
  updateSettings: (patch: Partial<PhoneSettings> & { webhookSecret?: string; dialAuthHeader?: string }) =>
    patch_<PhoneSettings>('/phone/settings', patch),
}

// ── Webchat channel ────────────────────────────────────────────────────────

export const webchatApi = {
  /** Get widget settings */
  getSettings: () => get<WidgetSettings>('/webchat/settings'),

  /** Update widget settings (admin) */
  updateSettings: (body: Partial<WidgetSettings>) => patch_<WidgetSettings>('/webchat/settings', body),

  /** List recent chat sessions */
  listSessions: () => get<ChatSession[]>('/webchat/sessions'),

  /** Close a chat session */
  closeSession: (id: string) => patch_<{ ok: boolean }>(`/webchat/sessions/${id}/close`, {}),
}

// ── Channel preferences ──────────────────────────────────────────────────────

export const channelPrefsApi = {
  update: (userId: string, prefs: Partial<ChannelPreferences>) =>
    patch_<User>(`/users/${userId}`, { channelPreferences: prefs }),
}

// helper alias — 'patch' is already declared as a const above
function patch_<T>(path: string, body: unknown) { return patch<T>(path, body) }
