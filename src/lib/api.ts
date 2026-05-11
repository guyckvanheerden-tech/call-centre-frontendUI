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
} from '@/types'

interface CreateTicketInput { subject: string; customerEmail: string; domainId: string }
interface AddMessageInput   { body: string; direction: 'inbound' | 'outbound' }
interface CreateUserInput   { name: string; email: string; role: string; password: string }
interface DomainInput       { name: string; slaPolicyId: string; priority: number }
interface SLAPolicyInput    {
  name: string; firstResponseMinutes: number;
  resolutionMinutes: number; businessHoursOnly: boolean
}
