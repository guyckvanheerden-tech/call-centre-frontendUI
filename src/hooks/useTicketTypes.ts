import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketTypesApi } from '@/lib/api'
import type { TicketTypeDef } from '@/types'

export const TICKET_TYPES_KEY = ['ticket-types'] as const

export function useTicketTypes() {
  return useQuery({
    queryKey: TICKET_TYPES_KEY,
    queryFn:  ticketTypesApi.list,
  })
}

export function useCreateTicketType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ticketTypesApi.create,
    onSuccess: (t) => {
      qc.setQueryData<TicketTypeDef[]>(TICKET_TYPES_KEY, (old = []) =>
        [...old, t].sort((a, b) => a.sortOrder - b.sortOrder)
      )
    },
  })
}

export function useUpdateTicketType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TicketTypeDef> }) =>
      ticketTypesApi.update(id, patch),
    onSuccess: (t) => {
      qc.setQueryData<TicketTypeDef[]>(TICKET_TYPES_KEY, (old = []) =>
        old.map((x) => x.id === t.id ? t : x).sort((a, b) => a.sortOrder - b.sortOrder)
      )
    },
  })
}

export function useDeleteTicketType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ticketTypesApi.delete,
    onSuccess: (_void, id) => {
      qc.setQueryData<TicketTypeDef[]>(TICKET_TYPES_KEY, (old = []) =>
        old.filter((x) => x.id !== id)
      )
    },
  })
}
