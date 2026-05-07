import { useUsers, useUpdateUser } from '@/hooks/useUsers'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

const roleLabel: Record<string, string> = {
  admin: 'Admin', agent: 'Agent',
}

export default function OnlineAgentsPage() {
  const { data: users = [] } = useUsers()
  const updateUserMutation   = useUpdateUser()

  const agents = users.filter((u) => u.role === 'agent' || u.role === 'admin')
  const onlineCount = agents.filter((u) => u.online && u.enabled).length

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Online Agents</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {onlineCount} of {agents.filter((u) => u.enabled).length} agents currently online
          <span className="mx-2 text-gray-300">·</span>
          Online agents receive incoming tickets via round-robin
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Online — receives tickets
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          Offline — excluded from queue
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {agents.map((user) => (
          <AgentRow
            key={user.id}
            user={user}
            onToggle={() => updateUserMutation.mutate({ id: user.id, patch: { online: !user.online } })}
          />
        ))}
      </div>
    </div>
  )
}

function AgentRow({ user, onToggle }: { user: User; onToggle: () => void }) {
  const isOnline = !!user.online && user.enabled
  const isDisabled = !user.enabled

  return (
    <div className={cn(
      'flex items-center gap-4 px-5 py-4 transition-colors',
      isDisabled && 'opacity-50',
    )}>
      {/* Avatar with online dot */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-xs text-white font-semibold">
          {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <span className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
          isOnline ? 'bg-emerald-500' : 'bg-gray-300'
        )} />
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{user.name}</div>
        <div className="text-xs text-gray-400">{user.email}</div>
      </div>

      <span className="hidden sm:block text-xs text-gray-500 flex-shrink-0 w-16">
        {roleLabel[user.role]}
      </span>

      {/* Status label */}
      <span className={cn(
        'text-xs font-medium flex-shrink-0 w-16 text-right',
        isOnline ? 'text-emerald-600' : 'text-gray-400'
      )}>
        {isDisabled ? 'Disabled' : isOnline ? 'Online' : 'Offline'}
      </span>

      {/* Toggle */}
      <button
        onClick={onToggle}
        disabled={isDisabled}
        aria-label={isOnline ? 'Set offline' : 'Set online'}
        className={cn(
          'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
          isOnline ? 'bg-emerald-500' : 'bg-gray-200',
          isDisabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <span className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
          isOnline ? 'translate-x-4' : 'translate-x-0'
        )} />
      </button>
    </div>
  )
}
