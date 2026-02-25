import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import DocumentSettings from './pages/DocumentSettings'
import Analytics from './pages/Analytics'
import Workspaces from './pages/Workspaces'
import WorkspaceNew from './pages/WorkspaceNew'
import WorkspaceDetail from './pages/WorkspaceDetail'
import Billing from './pages/Billing'
import Leads from './pages/Leads'
import LiveDashboard from './pages/LiveDashboard'
import NotificationSettings from './pages/NotificationSettings'
import Deals from './pages/Deals'
import DealNew from './pages/DealNew'
import DealDetail from './pages/DealDetail'
import Sessions from './pages/Sessions'
import SessionNew from './pages/SessionNew'
import SessionRoom from './pages/SessionRoom'
import ShareViewer from './pages/ShareViewer'
import ShareWorkspace from './pages/ShareWorkspace'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public share routes - no layout */}
          <Route path="/s/:slug" element={<ShareViewer />} />
          <Route path="/w/:slug" element={<ShareWorkspace />} />

          {/* Session room — no layout (full-screen experience) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/sessions/:id" element={<SessionRoom />} />
          </Route>

          {/* Routes with layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/documents/upload" element={<Upload />} />
              <Route path="/documents/:id/settings" element={<DocumentSettings />} />
              <Route path="/documents/:id/analytics" element={<Analytics />} />
              <Route path="/workspaces" element={<Workspaces />} />
              <Route path="/workspaces/new" element={<WorkspaceNew />} />
              <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/deals/new" element={<DealNew />} />
              <Route path="/deals/:id" element={<DealDetail />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/sessions/new" element={<SessionNew />} />
              <Route path="/live" element={<LiveDashboard />} />
              <Route path="/notifications/settings" element={<NotificationSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
