import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import type { NotificationSettings } from '@/types'

export const NOTIFICATIONS_KEY = ['notifications'] as const

export function useNotifications() {
  return useQuery({ queryKey: NOTIFICATIONS_KEY, queryFn: notificationsApi.list })
}

export function useUpdateNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ policyId, patch }: { policyId: string; patch: Partial<NotificationSettings> }) =>
      notificationsApi.update(policyId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
    },
  })
}
