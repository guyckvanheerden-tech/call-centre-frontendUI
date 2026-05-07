/**
 * Zustand store — UI state only.
 * All data (tickets, users, etc.) is now owned by React Query.
 */
import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  selectedTicketId: string | null
  setSidebarCollapsed: (v: boolean) => void
  setSelectedTicketId: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed:    false,
  selectedTicketId:    null,
  setSidebarCollapsed: (v)  => set({ sidebarCollapsed: v }),
  setSelectedTicketId: (id) => set({ selectedTicketId: id }),
}))
