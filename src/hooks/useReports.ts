import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'

export function useReportDaily(start: string, end: string, agentId?: string) {
  return useQuery({
    queryKey: ['reports', 'daily', start, end, agentId ?? 'all'],
    queryFn:  () => reportsApi.daily(start, end, agentId),
    enabled:  !!start && !!end,
    staleTime: 60_000,
  })
}

export function useReportKPI(agentId?: string) {
  return useQuery({
    queryKey: ['reports', 'kpi', agentId ?? 'all'],
    queryFn:  () => reportsApi.kpi(agentId),
    staleTime: 30_000,
  })
}

export function useAgentHours(start: string, end: string, agentId?: string) {
  return useQuery({
    queryKey: ['reports', 'agent-hours', start, end, agentId ?? 'all'],
    queryFn:  () => reportsApi.agentHours(start, end, agentId),
    enabled:  !!start && !!end,
    staleTime: 60_000,
  })
}
