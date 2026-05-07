import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketsApi } from '@/lib/api'
import type { Ticket } from '@/types'

export const TICKETS_KEY = ['tickets'] as const

// ── Queries ───────────────────────────────────────────────────
export function useTickets() {
  return useQuery({
    queryKey: TICKETS_KEY,
    queryFn:  ticketsApi.list,
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: [...TICKETS_KEY, id],
    queryFn:  () => ticketsApi.get(id),
    enabled:  !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────
export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: (newTicket) => {
      qc.setQueryData<Ticket[]>(TICKETS_KEY, (old = []) => [newTicket, ...old])
    },
  })
}

export function useUpdateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Ticket> }) =>
      ticketsApi.update(id, patch),
    onSuccess: (updated) => {
      // Update in list cache
      qc.setQueryData<Ticket[]>(TICKETS_KEY, (old = []) =>
        old.map((t) => t.id === updated.id ? updated : t)
      )
      // Update individual ticket cache
      qc.setQueryData([...TICKETS_KEY, updated.id], updated)
    },
  })
}

export function useAddMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, body, direction }: {
      ticketId: string; body: string; direction: 'inbound' | 'outbound'
    }) => ticketsApi.addMessage(ticketId, { body, direction }),
    onSuccess: (_msg, { ticketId }) => {
      // Refetch the ticket so we get the updated messages + status
      qc.invalidateQueries({ queryKey: [...TICKETS_KEY, ticketId] })
      qc.invalidateQueries({ queryKey: TICKETS_KEY })
    },
  })
}
