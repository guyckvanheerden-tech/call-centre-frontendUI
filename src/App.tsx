import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import { useAuth } from '@/lib/auth'

const DashboardPage            = lazy(() => import('@/pages/DashboardPage'))
const TicketsPage              = lazy(() => import('@/pages/TicketsPage'))
const TicketDetailPage         = lazy(() => import('@/pages/TicketDetailPage'))
const SLAMonitoringPage        = lazy(() => import('@/pages/SLAMonitoringPage'))
const ReportsPage              = lazy(() => import('@/pages/ReportsPage'))
const UserManagementPage       = lazy(() => import('@/pages/UserManagementPage'))
const SLAPoliciesPage          = lazy(() => import('@/pages/SLAPoliciesPage'))
const DomainRoutingPage        = lazy(() => import('@/pages/DomainRoutingPage'))
const NotificationControlsPage = lazy(() => import('@/pages/NotificationControlsPage'))
const OnlineAgentsPage         = lazy(() => import('@/pages/OnlineAgentsPage'))
const AdminSettingsPage        = lazy(() => import('@/pages/AdminSettingsPage'))

function Loader() {
  return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}

/** Redirect to /login if not authenticated */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading)   return <Loader />
  if (!session)  return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Redirect to / if already authenticated */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading)   return <Loader />
  if (session)   return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={
          <GuestRoute><LoginPage /></GuestRoute>
        } />

        {/* Protected — all wrapped in the main layout */}
        <Route element={
          <ProtectedRoute><AppLayout /></ProtectedRoute>
        }>
          <Route path="/"                       element={<DashboardPage />} />
          <Route path="/tickets"                element={<TicketsPage />} />
          <Route path="/tickets/:id"            element={<TicketDetailPage />} />
          <Route path="/sla-monitoring"         element={<SLAMonitoringPage />} />
          <Route path="/reports"                element={<ReportsPage />} />
          <Route path="/admin/users"            element={<UserManagementPage />} />
          <Route path="/admin/sla-policies"     element={<SLAPoliciesPage />} />
          <Route path="/admin/domain-routing"   element={<DomainRoutingPage />} />
          <Route path="/admin/notifications"    element={<NotificationControlsPage />} />
          <Route path="/admin/online-agents"    element={<OnlineAgentsPage />} />
          <Route path="/admin/settings"         element={<AdminSettingsPage />} />
          <Route path="*"                       element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
