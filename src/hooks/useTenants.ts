import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantsApi } from '@/lib/api'
import type { TenantWithStats } from '@/types'

export const TENANTS_KEY = ['tenants'] as const

export function useTenants() {
  return useQuery({
    queryKey: TENANTS_KEY,
    queryFn:  tenantsApi.list,
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tenantsApi.create,
    onSuccess: (t) => {
      qc.setQueryData<TenantWithStats[]>(TENANTS_KEY, (old = []) => [...old, t])
    },
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof tenantsApi.update>[1] }) =>
      tenantsApi.update(id, patch),
    onSuccess: (t) => {
      qc.setQueryData<TenantWithStats[]>(TENANTS_KEY, (old = []) =>
        old.map((x) => x.id === t.id ? { ...x, ...t } : x)
      )
    },
  })
}
