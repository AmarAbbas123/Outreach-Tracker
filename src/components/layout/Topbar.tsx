import { Bell, Search, ChevronDown, LogOut, Briefcase, Check, Plus, Menu, Globe, Sparkles } from 'lucide-react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useClient } from '../../context/ClientContext'

const pageTitles: Record<string, string> = {
  '/app/dashboard': 'Executive Dashboard',
  '/app/clients': 'Clients Directory',
  '/app/campaigns': 'Outreach Campaigns',
  '/app/prospects': 'Prospects Database',
  '/app/pipeline': 'Pipeline Kanban Board',
  '/app/templates': 'Email Sequence Templates',
  '/app/tasks': 'Daily Tasks & Follow-ups',
  '/app/links': 'Won Backlinks Inventory',
  '/app/reports': 'ROI & Performance Reports',
  '/app/settings': 'Settings & Workspace',
}

interface TopbarProps {
  onToggleMobileMenu?: () => void
}

export default function Topbar({ onToggleMobileMenu }: TopbarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { selectedClientId, setSelectedClientId, selectedClient, clients } = useClient()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')

  const profileRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<HTMLDivElement>(null)

  const title =
    pageTitles[pathname] ??
    (pathname.startsWith('/app/clients/')
      ? 'Client Details'
      : pathname.startsWith('/app/campaigns/')
      ? 'Campaign Details'
      : 'OutreachTracker')

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

  const initial = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U'

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.domain && c.domain.toLowerCase().includes(clientSearch.toLowerCase()))
  )

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-3 sm:px-6 shrink-0 gap-2 sm:gap-4 z-20">
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Current Module Title */}
        <div className="hidden xs:flex flex-col min-w-0">
          <h1 className="text-sm sm:text-base font-semibold text-gray-800 tracking-tight shrink-0 truncate">
            {title}
          </h1>
        </div>

        <span className="hidden sm:inline-block text-slate-300 font-light">/</span>

        {/* Global Client Filter Dropdown */}
        <div className="relative shrink-0" ref={clientRef}>
          <button
            type="button"
            onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              selectedClient
                ? 'bg-indigo-50/90 border-indigo-200 text-indigo-700 hover:bg-indigo-100/70 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Global Client Scope"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedClient ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="max-w-[85px] sm:max-w-[130px] truncate">
                {selectedClient ? selectedClient.name : 'All Clients'}
              </span>
            </div>
            <ChevronDown size={11} className="text-slate-400 shrink-0" />
          </button>

          {clientDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 pb-2 border-b border-slate-100">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Filter by Client Scope
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search clients…"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
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
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    !selectedClientId
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                      *
                    </div>
                    <span>All Clients (Global Scope)</span>
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
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{c.name}</p>
                          {c.domain && <p className="text-[10px] text-slate-400 truncate">{c.domain}</p>}
                        </div>
                      </div>
                      {isSelected && <Check size={13} className="text-indigo-600 shrink-0" />}
                    </button>
                  )
                })}

                {filteredClients.length === 0 && (
                  <div className="px-3 py-3 text-center text-xs text-slate-400">
                    No clients match search
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 px-3 flex items-center justify-between text-xs">
                <Link
                  to="/app/clients"
                  onClick={() => setClientDropdownOpen(false)}
                  className="text-indigo-600 hover:text-indigo-700 font-bold"
                >
                  Manage All Clients
                </Link>
                <Link
                  to="/app/clients"
                  onClick={() => setClientDropdownOpen(false)}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-[11px]"
                >
                  <Plus size={11} /> Add New
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Add Action Button */}
        <Link
          to="/app/prospects"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-2xs transition-colors"
        >
          <Plus size={13} />
          <span>Add Leads</span>
        </Link>

        {/* Notifications */}
        <button
          type="button"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
          title="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
        </button>

        {/* Profile menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white text-xs font-medium flex items-center justify-center shrink-0 shadow-2xs">
              {initial}
            </div>
            <span className="text-xs font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
              {user?.name || 'Account'}
            </span>
            <ChevronDown size={12} className="text-slate-400 hidden sm:block shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-medium text-gray-800 truncate">{user?.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                <span className="mt-1 inline-block text-[9px] font-medium uppercase px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Workspace Owner
                </span>
              </div>
              <Link
                to="/app/settings"
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                Profile & Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
              >
                <LogOut size={13} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
