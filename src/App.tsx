import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { useDataStore } from '@/store'

const LOGGED_IN_USER_ID = 'u1'

const DashboardPage          = lazy(() => import('@/pages/DashboardPage'))
const TicketsPage            = lazy(() => import('@/pages/TicketsPage'))
const TicketDetailPage       = lazy(() => import('@/pages/TicketDetailPage'))
const SLAMonitoringPage      = lazy(() => import('@/pages/SLAMonitoringPage'))
const ReportsPage            = lazy(() => import('@/pages/ReportsPage'))
const UserManagementPage     = lazy(() => import('@/pages/UserManagementPage'))
const SLAPoliciesPage        = lazy(() => import('@/pages/SLAPoliciesPage'))
const DomainRoutingPage      = lazy(() => import('@/pages/DomainRoutingPage'))
const NotificationControlsPage = lazy(() => import('@/pages/NotificationControlsPage'))
const OnlineAgentsPage       = lazy(() => import('@/pages/OnlineAgentsPage'))

function Loader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}

// Marks the logged-in user online on mount and offline on unmount (logout/tab close)
function SessionGuard({ children }: { children: React.ReactNode }) {
  const updateUser = useDataStore((s) => s.updateUser)
  useEffect(() => {
    updateUser(LOGGED_IN_USER_ID, { online: true })
    return () => updateUser(LOGGED_IN_USER_ID, { online: false })
  }, [updateUser])
  return <>{children}</>
}

export default function App() {
  return (
    <SessionGuard>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/"                         element={<DashboardPage />} />
            <Route path="/tickets"                  element={<TicketsPage />} />
            <Route path="/tickets/:id"              element={<TicketDetailPage />} />
            <Route path="/sla-monitoring"           element={<SLAMonitoringPage />} />
            <Route path="/reports"                  element={<ReportsPage />} />
            <Route path="/admin/users"              element={<UserManagementPage />} />
            <Route path="/admin/sla-policies"       element={<SLAPoliciesPage />} />
            <Route path="/admin/domain-routing"     element={<DomainRoutingPage />} />
            <Route path="/admin/notifications"      element={<NotificationControlsPage />} />
            <Route path="/admin/online-agents"      element={<OnlineAgentsPage />} />
            <Route path="*"                         element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </SessionGuard>
  )
}
