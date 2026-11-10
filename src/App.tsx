import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
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
      </Routes>
    </BrowserRouter>
  )
}

