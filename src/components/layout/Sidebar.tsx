import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Target,
  Globe,
  KanbanSquare,
  Mail,
  CheckSquare,
  Link2,
  BarChart3,
  Settings,
  X,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/app/clients', label: 'Clients', icon: Users },
      { to: '/app/campaigns', label: 'Campaigns', icon: Target },
    ],
  },
  {
    title: 'Outreach & Pipeline',
    items: [
      { to: '/app/prospects', label: 'Prospects', icon: Globe },
      { to: '/app/pipeline', label: 'Pipeline Board', icon: KanbanSquare },
      { to: '/app/templates', label: 'Email Templates', icon: Mail },
      { to: '/app/tasks', label: 'Tasks & Follow-ups', icon: CheckSquare },
      { to: '/app/links', label: 'Won Backlinks', icon: Link2 },
    ],
  },
  {
    title: 'Analytics',
    items: [{ to: '/app/reports', label: 'ROI Reports', icon: BarChart3 }],
  },
]

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export default function Sidebar({ isMobile, onClose }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (isMobile && onClose) {
      onClose()
    }
  }, [location.pathname])

  // Fetch live task counts for the sidebar badge
  const { data: taskCountsData } = useQuery({
    queryKey: ['task-counts'],
    queryFn: async () => {
      const res = await api.get('/tasks/counts')
      return res.data?.data
    },
    refetchInterval: 20000,
  })

  const urgentTasksCount = taskCountsData?.urgentTotal || 0
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <aside
      className={`bg-white border-r border-slate-200/80 flex flex-col h-full shadow-[1px_0_4px_rgba(0,0,0,0.02)] ${
        isMobile ? 'w-full' : 'w-64 shrink-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
        <Link to="/app/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Link2 size={18} className="transition-transform group-hover:rotate-12" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border-2 border-white ring-1 ring-emerald-500/20" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight leading-none">
                Outreach<span className="text-indigo-600">Tracker</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                2.0
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
              Autonomous Link Engine
            </span>
          </div>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => {
                const isTasks = to === '/app/tasks'
                const showBadge = isTasks && urgentTasksCount > 0

                return (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={() => {
                        if (isMobile && onClose) onClose()
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                          isActive
                            ? 'bg-indigo-50/90 text-indigo-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon
                        size={16}
                        className="transition-colors group-hover:text-indigo-600"
                      />
                      <span className="flex-1 truncate">{label}</span>
                      {showBadge && (
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center border border-rose-200">
                          {urgentTasksCount}
                        </span>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User & Workspace Profile Card Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.name || 'My Workspace'}
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active Workspace</span>
              </p>
            </div>
          </div>

          <Link
            to="/app/settings"
            onClick={() => {
              if (isMobile && onClose) onClose()
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={15} />
          </Link>
        </div>
      </div>
    </aside>
  )
}
