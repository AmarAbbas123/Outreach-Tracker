import { Bell, Search, ChevronDown, LogOut, Briefcase, Check, Plus, Globe } from 'lucide-react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useClient } from '../../context/ClientContext'

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
  const { selectedClientId, setSelectedClientId, selectedClient, clients } = useClient()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')

  const profileRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<HTMLDivElement>(null)

  const title = pageTitles[pathname] ?? (pathname.startsWith('/app/clients/') ? 'Client Details' : 'OutreachTracker')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.domain && c.domain.toLowerCase().includes(clientSearch.toLowerCase()))
  )

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 gap-4 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-gray-800 shrink-0">{title}</h1>

        {/* Global Client Filter Dropdown */}
        <div className="relative" ref={clientRef}>
          <button
            type="button"
            onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              selectedClient
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/70 shadow-xs'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Global Client Scope"
          >
            <Briefcase size={13} className={selectedClient ? 'text-indigo-600' : 'text-gray-500'} />
            <span className="max-w-[140px] truncate font-semibold">
              {selectedClient ? selectedClient.name : 'All Clients'}
            </span>
            <ChevronDown size={12} className="text-gray-400 shrink-0" />
          </button>

          {clientDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in">
              <div className="px-3 pb-2 border-b border-gray-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Global Client Filter
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clients…"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto py-1">
                {/* Option: All Clients */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId('')
                    setClientDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                    !selectedClientId ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold">
                      *
                    </div>
                    <span>All Clients (Global)</span>
                  </div>
                  {!selectedClientId && <Check size={13} className="text-indigo-600 shrink-0" />}
                </button>

                {/* List of clients */}
                {filteredClients.map((c) => {
                  const isSelected = selectedClientId === c._id
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(c._id)
                        setClientDropdownOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                        isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.name}</p>
                          {c.domain && <p className="text-[10px] text-gray-400 truncate">{c.domain}</p>}
                        </div>
                      </div>
                      {isSelected && <Check size={13} className="text-indigo-600 shrink-0" />}
                    </button>
                  )
                })}

                {filteredClients.length === 0 && (
                  <div className="px-3 py-3 text-center text-xs text-gray-400">
                    No clients match search
                  </div>
                )}
              </div>

              <div className="pt-1.5 border-t border-gray-100 px-2 flex items-center justify-between text-xs">
                <Link
                  to="/app/clients"
                  onClick={() => setClientDropdownOpen(false)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50"
                >
                  Manage Clients
                </Link>
                <Link
                  to="/app/clients"
                  onClick={() => setClientDropdownOpen(false)}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
                >
                  <Plus size={12} /> Add New
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Search */}
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
        <div className="relative" ref={profileRef}>
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
