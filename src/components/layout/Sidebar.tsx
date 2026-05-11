import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, ShieldAlert, BarChart2, Settings,
  ChevronDown, ChevronRight, Zap
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to?: string
  icon: React.ReactNode
  children?: { label: string; to: string }[]
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard',      to: '/',              icon: <LayoutDashboard size={16} /> },
  { label: 'Tickets',        to: '/tickets',        icon: <Ticket size={16} /> },
  { label: 'SLA Monitoring', to: '/sla-monitoring', icon: <ShieldAlert size={16} /> },
  { label: 'Reports',        to: '/reports',        icon: <BarChart2 size={16} /> },
  {
    label: 'Admin', adminOnly: true,
    icon: <Settings size={16} />,
    children: [
      { label: 'Users',                  to: '/admin/users' },
      { label: 'SLA Policies',           to: '/admin/sla-policies' },
      { label: 'Domain Routing',         to: '/admin/domain-routing' },
      { label: 'Notification Controls',  to: '/admin/notifications' },
      { label: 'System Settings',        to: '/admin/settings' },
    ],
  },
]

export default function Sidebar() {
  const location  = useLocation()
  const adminOpen = location.pathname.startsWith('/admin')
  const [adminExpanded, setAdminExpanded] = useState(adminOpen)
  const { profile } = useAuth()

  const isOnline = !!profile?.online
  const initials  = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  const isAdmin   = profile?.role === 'admin'

  return (
    <aside className="w-[220px] min-h-screen bg-[#0f172a] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">SupportDesk</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2 text-sm',
                    'text-slate-400 hover:text-white hover:bg-white/5 transition-colors',
                    adminExpanded && 'text-white'
                  )}>
                  <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
                  {adminExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {adminExpanded && (
                  <div className="ml-4 pl-3 border-l border-white/10">
                    {item.children.map((child) => (
                      <NavLink key={child.to} to={child.to}
                        className={({ isActive }) => cn(
                          'flex items-center px-3 py-1.5 text-sm rounded-md mx-1 mb-0.5 transition-colors',
                          isActive ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        )}>
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink key={item.to} to={item.to!} end={item.to === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 px-4 py-2 text-sm mx-2 rounded-md mb-0.5 transition-colors',
                isActive ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}>
              {item.icon}
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User card */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium">
              {initials}
            </div>
            <span className={cn(
              'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0f172a]',
              isOnline ? 'bg-emerald-500' : 'bg-gray-500'
            )} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-white truncate">{profile?.name ?? '…'}</div>
            <div className={cn('text-xs truncate', isOnline ? 'text-emerald-400' : 'text-slate-500')}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
