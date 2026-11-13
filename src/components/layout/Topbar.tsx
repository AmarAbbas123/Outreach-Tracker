import { Bell, Search, ChevronDown, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const pageTitles: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/clients':   'Clients',
  '/app/campaigns': 'Campaigns',
  '/app/prospects': 'Prospects',
  '/app/pipeline':  'Pipeline',
  '/app/templates': 'Email Templates',
  '/app/tasks':     'Tasks',
  '/app/links':     'Won Links',
  '/app/reports':   'Reports',
  '/app/settings':  'Settings',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const title = pageTitles[pathname] ?? 'OutreachTracker'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 gap-4">
      <h1 className="text-base font-semibold text-gray-800 shrink-0">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search prospects, campaigns…"
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {initial}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">
              {user?.name || 'My Account'}
            </span>
            <ChevronDown size={14} className="text-gray-400 hidden md:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
