import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import PublicLayout from './layouts/PublicLayout'
import Home from './pages/public/Home'
import Features from './pages/public/Features'
import Pricing from './pages/public/Pricing'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Campaigns from './pages/Campaigns'
import Prospects from './pages/Prospects'
import Pipeline from './pages/Pipeline'
import Templates from './pages/Templates'
import Tasks from './pages/Tasks'
import Links from './pages/Links'
import Reports from './pages/Reports'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public marketing pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
          </Route>

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected App routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<Layout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="prospects" element={<Prospects />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="templates" element={<Templates />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="links" element={<Links />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
