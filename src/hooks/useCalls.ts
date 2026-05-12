import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { phoneApi } from '@/lib/api'
import type { PhoneSettings } from '@/types'

export const CALLS_KEY        = (ticketId: string) => ['calls', ticketId] as const
export const PHONE_SETTINGS_KEY = ['phone-settings'] as const

/** Calls for a specific ticket */
export function useCalls(ticketId: string) {
  return useQuery({
    queryKey: CALLS_KEY(ticketId),
    queryFn:  () => phoneApi.listCalls(ticketId),
    enabled:  !!ticketId,
    refetchInterval: 10_000,  // poll every 10 s to pick up new calls / recording URLs
  })
}

/** Initiate a click-to-call */
export function usePhoneDial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: phoneApi.dial,
    onSuccess: (_data, variables) => {
      // Refresh the call log for this ticket
      qc.invalidateQueries({ queryKey: CALLS_KEY(variables.ticketId) })
    },
  })
}

/** Phone / PBX settings */
export function usePhoneSettings() {
  return useQuery({
    queryKey: PHONE_SETTINGS_KEY,
    queryFn:  phoneApi.getSettings,
  })
}

export function useUpdatePhoneSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: phoneApi.updateSettings,
    onSuccess: (updated) => {
      qc.setQueryData<PhoneSettings>(PHONE_SETTINGS_KEY, updated)
    },
  })
}
