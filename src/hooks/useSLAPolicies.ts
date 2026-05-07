import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { slaPoliciesApi } from '@/lib/api'
import type { SLAPolicy } from '@/types'

export const POLICIES_KEY = ['sla-policies'] as const

export function useSLAPolicies() {
  return useQuery({ queryKey: POLICIES_KEY, queryFn: slaPoliciesApi.list })
}

export function useCreateSLAPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: slaPoliciesApi.create,
    onSuccess: (p) => {
      qc.setQueryData<SLAPolicy[]>(POLICIES_KEY, (old = []) => [...old, p])
    },
  })
}

export function useUpdateSLAPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SLAPolicy> }) =>
      slaPoliciesApi.update(id, patch),
    onSuccess: (p) => {
      qc.setQueryData<SLAPolicy[]>(POLICIES_KEY, (old = []) =>
        old.map((x) => x.id === p.id ? p : x)
      )
    },
  })
}

export function useDeleteSLAPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: slaPoliciesApi.delete,
    onSuccess: (_void, id) => {
      qc.setQueryData<SLAPolicy[]>(POLICIES_KEY, (old = []) => old.filter((x) => x.id !== id))
    },
  })
}
