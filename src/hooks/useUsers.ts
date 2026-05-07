import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import type { User } from '@/types'

export const USERS_KEY = ['users'] as const

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn:  usersApi.list,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: (user) => {
      qc.setQueryData<User[]>(USERS_KEY, (old = []) => [...old, user])
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<User> }) =>
      usersApi.update(id, patch),
    onSuccess: (updated) => {
      qc.setQueryData<User[]>(USERS_KEY, (old = []) =>
        old.map((u) => u.id === updated.id ? updated : u)
      )
    },
  })
}
