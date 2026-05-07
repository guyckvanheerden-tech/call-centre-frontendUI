import { create } from 'zustand'
import type { Ticket, User, SLAPolicy, Domain, NotificationSettings } from '@/types'
import {
  mockTickets, mockUsers, mockSLAPolicies, mockDomains, mockNotificationSettings
} from '@/data/mock'

interface UIState {
  sidebarCollapsed: boolean
  selectedTicketId: string | null
  setSidebarCollapsed: (v: boolean) => void
  setSelectedTicketId: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  selectedTicketId: null,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSelectedTicketId: (id) => set({ selectedTicketId: id }),
}))

interface DataStore {
  tickets: Ticket[]
  users: User[]
  policies: SLAPolicy[]
  domains: Domain[]
  notifications: NotificationSettings[]
  roundRobinCursor: number
  updateTicket: (id: string, patch: Partial<Ticket>) => void
  createTicket: (subject: string, customerEmail: string, domainId: string) => void
  addPolicy: (p: SLAPolicy) => void
  updatePolicy: (id: string, patch: Partial<SLAPolicy>) => void
  deletePolicy: (id: string) => void
  updateDomain: (id: string, patch: Partial<Domain>) => void
  addDomain: (d: Domain) => void
  deleteDomain: (id: string) => void
  updateUser: (id: string, patch: Partial<User>) => void
  addUser: (user: User) => void
  updateNotification: (policyId: string, patch: Partial<NotificationSettings>) => void
}

export const useDataStore = create<DataStore>((set, get) => ({
  tickets: mockTickets,
  users: mockUsers,
  policies: mockSLAPolicies,
  domains: mockDomains,
  notifications: mockNotificationSettings,
  roundRobinCursor: 0,
  updateTicket: (id, patch) =>
    set((s) => ({ tickets: s.tickets.map((t) => t.id === id ? { ...t, ...patch } : t) })),
  createTicket: (subject, customerEmail, domainId) =>
    set((s) => {
      const domain = s.domains.find((d) => d.id === domainId)
      const policy = s.policies.find((p) => p.id === domain?.slaPolicyId)
      const pool = s.users.filter(
        (u) => u.role === 'agent' && u.enabled && u.online
      )
      const assigned = pool.length > 0 ? pool[s.roundRobinCursor % pool.length] : null
      const now = new Date().toISOString()
      const newTicket: Ticket = {
        id: `TKT-${1000 + s.tickets.length + 1}`,
        subject,
        customerEmail,
        domain: domain?.name ?? domainId,
        domainId,
        status: 'open',
        slaStatus: 'on_track',
        slaPolicy: policy?.name ?? 'Standard',
        assignedAgent: assigned?.name ?? null,
        assignedAgentId: assigned?.id ?? null,
        firstResponseDue: new Date(Date.now() + (policy?.firstResponseMinutes ?? 240) * 60_000).toISOString(),
        resolutionDue: new Date(Date.now() + (policy?.resolutionMinutes ?? 1440) * 60_000).toISOString(),
        createdAt: now,
        updatedAt: now,
        messages: [],
        tags: [],
      }
      return {
        tickets: [newTicket, ...s.tickets],
        roundRobinCursor: pool.length > 0 ? s.roundRobinCursor + 1 : s.roundRobinCursor,
      }
    }),
  addPolicy: (p) =>
    set((s) => ({ policies: [...s.policies, p] })),
  updatePolicy: (id, patch) =>
    set((s) => ({ policies: s.policies.map((p) => p.id === id ? { ...p, ...patch } : p) })),
  deletePolicy: (id) =>
    set((s) => ({ policies: s.policies.filter((p) => p.id !== id) })),
  updateDomain: (id, patch) =>
    set((s) => ({ domains: s.domains.map((d) => d.id === id ? { ...d, ...patch } : d) })),
  addDomain: (d) =>
    set((s) => ({ domains: [...s.domains, d] })),
  deleteDomain: (id) =>
    set((s) => ({ domains: s.domains.filter((d) => d.id !== id) })),
  updateUser: (id, patch) =>
    set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, ...patch } : u) })),
  addUser: (user) =>
    set((s) => ({ users: [...s.users, user] })),
  updateNotification: (policyId, patch) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.policyId === policyId ? { ...n, ...patch } : n
      ),
    })),
}))
