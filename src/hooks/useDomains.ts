import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { domainsApi } from '@/lib/api'
import type { Domain } from '@/types'

export const DOMAINS_KEY = ['domains'] as const

export function useDomains() {
  return useQuery({ queryKey: DOMAINS_KEY, queryFn: domainsApi.list })
}

export function useCreateDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: domainsApi.create,
    onSuccess: (d) => {
      qc.setQueryData<Domain[]>(DOMAINS_KEY, (old = []) => [...old, d])
    },
  })
}

export function useUpdateDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Domain> }) =>
      domainsApi.update(id, patch),
    onSuccess: (d) => {
      qc.setQueryData<Domain[]>(DOMAINS_KEY, (old = []) =>
        old.map((x) => x.id === d.id ? d : x)
      )
    },
  })
}

export function useDeleteDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: domainsApi.delete,
    onSuccess: (_void, id) => {
      qc.setQueryData<Domain[]>(DOMAINS_KEY, (old = []) => old.filter((x) => x.id !== id))
    },
  })
}
