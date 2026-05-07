import { Search, Bell, ChevronDown, LogOut, Wifi, WifiOff } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useUpdateUser } from '@/hooks/useUsers'
import { useTickets } from '@/hooks/useTickets'
import { cn } from '@/lib/utils'

export default function TopBar({ title }: { title?: string }) {
  const [search,       setSearch]       = useState('')
  const [focused,      setFocused]      = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef    = useRef<HTMLDivElement>(null)
  const navigate   = useNavigate()
  const { profile, signOut } = useAuth()
  const updateUser = useUpdateUser()
  const { data: tickets = [] } = useTickets()

  const isOnline = !!profile?.online
  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const results = search.length > 1
    ? tickets.filter((t) =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.customerEmail.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6)
    : []

  const breachedCount = tickets.filter((t) => t.slaStatus === 'breached').length

  const toggleOnline = () => {
    if (!profile) return
    updateUser.mutate({ id: profile.id, patch: { online: !isOnline } })
    setUserMenuOpen(false)
  }

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-4 flex-shrink-0 z-10">
      {title && (
        <h1 className="text-sm font-semibold text-gray-900 mr-2 whitespace-nowrap">{title}</h1>
      )}

      {/* Search */}
      <div className="flex-1 max-w-lg relative">
        <div className={cn(
          'flex items-center h-8 rounded-lg border bg-gray-50 px-3 gap-2 transition-all',
          focused ? 'border-blue-400 bg-white shadow-sm ring-2 ring-blue-50' : 'border-gray-200'
        )}>
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input
            type="text" placeholder="Search tickets…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400"
          />
          {search && (
            <kbd className="hidden sm:inline-flex text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">ESC</kbd>
          )}
        </div>
        {focused && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
            {results.map((t) => (
              <button key={t.id}
                onMouseDown={() => { navigate(`/tickets/${t.id}`); setSearch('') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left">
                <span className="text-xs font-mono text-gray-400 flex-shrink-0">{t.id}</span>
                <span className="text-sm text-gray-800 truncate">{t.subject}</span>
                <span className={cn(
                  'ml-auto text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
                  t.slaStatus === 'breached' ? 'bg-red-100 text-red-700' :
                  t.slaStatus === 'at_risk'  ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                )}>
                  {t.slaStatus === 'breached' ? 'Breached' : t.slaStatus === 'at_risk' ? 'At Risk' : 'On Track'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button className="relative w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
          <Bell size={15} />
          {breachedCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-medium">
              {breachedCount}
            </span>
          )}
        </button>

        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-semibold">
                {initials}
              </div>
              <span className={cn(
                'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white',
                isOnline ? 'bg-emerald-500' : 'bg-gray-400'
              )} />
            </div>
            <span className="text-sm text-gray-700 hidden sm:block">{profile?.name ?? '…'}</span>
            <ChevronDown size={12} className={cn('text-gray-400 hidden sm:block transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-800">{profile?.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{profile?.email}</div>
                <div className={cn(
                  'flex items-center gap-1.5 mt-2 text-xs font-medium',
                  isOnline ? 'text-emerald-600' : 'text-gray-400'
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-gray-300')} />
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
              <button onClick={toggleOnline}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors text-left">
                {isOnline
                  ? <><WifiOff size={13} className="text-amber-500" /><span className="text-gray-700">Go Offline</span></>
                  : <><Wifi size={13} className="text-emerald-500" /><span className="text-gray-700">Go Online</span></>
                }
              </button>
              <div className="border-t border-gray-100">
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors text-left text-red-500">
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
