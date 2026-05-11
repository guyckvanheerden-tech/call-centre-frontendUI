import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn:  settingsApi.list,
    staleTime: 30_000,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ category, data }: { category: string; data: Record<string, string> }) =>
      settingsApi.update(category, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useTestEmail() {
  return useMutation({
    mutationFn: (to: string) => settingsApi.testEmail(to),
  })
}
