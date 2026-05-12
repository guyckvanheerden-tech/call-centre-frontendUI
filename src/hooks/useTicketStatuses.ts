import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketStatusesApi } from '@/lib/api'
import type { TicketStatusDef } from '@/types'

export const TICKET_STATUSES_KEY = ['ticket-statuses'] as const

export function useTicketStatuses() {
  return useQuery({
    queryKey: TICKET_STATUSES_KEY,
    queryFn:  ticketStatusesApi.list,
  })
}

export function useCreateTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ticketStatusesApi.create,
    onSuccess: (s) => {
      qc.setQueryData<TicketStatusDef[]>(TICKET_STATUSES_KEY, (old = []) =>
        [...old, s].sort((a, b) => a.sortOrder - b.sortOrder)
      )
    },
  })
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TicketStatusDef> }) =>
      ticketStatusesApi.update(id, patch),
    onSuccess: (s) => {
      qc.setQueryData<TicketStatusDef[]>(TICKET_STATUSES_KEY, (old = []) =>
        old.map((x) => x.id === s.id ? s : x).sort((a, b) => a.sortOrder - b.sortOrder)
      )
    },
  })
}

export function useDeleteTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ticketStatusesApi.delete,
    onSuccess: (_void, id) => {
      qc.setQueryData<TicketStatusDef[]>(TICKET_STATUSES_KEY, (old = []) =>
        old.filter((x) => x.id !== id)
      )
    },
  })
}
