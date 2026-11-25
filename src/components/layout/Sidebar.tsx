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
  type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import api from '../../api/client'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: '/app/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/app/clients',    label: 'Clients',       icon: Users },
  { to: '/app/campaigns',  label: 'Campaigns',     icon: Target },
  { to: '/app/prospects',  label: 'Prospects',     icon: Globe },
  { to: '/app/pipeline',   label: 'Pipeline',      icon: KanbanSquare },
  { to: '/app/templates',  label: 'Templates',     icon: Mail },
  { to: '/app/tasks',      label: 'Tasks',         icon: CheckSquare },
  { to: '/app/links',      label: 'Won Links',     icon: Link2 },
  { to: '/app/reports',    label: 'Reports',       icon: BarChart3 },
]

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export default function Sidebar({ isMobile, onClose }: SidebarProps) {
  const location = useLocation()

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

  return (
    <aside className={`bg-white border-r border-gray-200 flex flex-col h-full ${isMobile ? 'w-full' : 'w-60 shrink-0'}`}>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
        <Link to="/app/dashboard" className="flex items-center gap-2.5">
          <div className="bg-indigo-600 text-white p-1.5 rounded-xl shadow-xs">
            <Link2 size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-gray-900 text-sm tracking-tight leading-none">
              Outreach<span className="text-indigo-600">Tracker</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Link Acquisition CRM</span>
          </div>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-3">
          {navItems.map(({ to, label, icon: Icon }) => {
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon size={17} />
                  <span className="flex-1">{label}</span>
                  {showBadge && (
                    <span className="bg-rose-100 text-rose-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full min-w-[20px] text-center border border-rose-200">
                      {urgentTasksCount}
                    </span>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Settings */}
      <div className="p-3 border-t border-gray-100">
        <NavLink
          to="/app/settings"
          onClick={() => {
            if (isMobile && onClose) onClose()
          }}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
            }`
          }
        >
          <Settings size={17} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
