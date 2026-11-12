import { NavLink, Link } from 'react-router-dom'
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
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
}

const navItems: NavItem[] = [
  { to: '/app/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/app/clients',    label: 'Clients',       icon: Users },
  { to: '/app/campaigns',  label: 'Campaigns',     icon: Target },
  { to: '/app/prospects',  label: 'Prospects',     icon: Globe },
  { to: '/app/pipeline',   label: 'Pipeline',      icon: KanbanSquare },
  { to: '/app/templates',  label: 'Templates',     icon: Mail },
  { to: '/app/tasks',      label: 'Tasks',         icon: CheckSquare, badge: 3 },
  { to: '/app/links',      label: 'Won Links',     icon: Link2 },
  { to: '/app/reports',    label: 'Reports',       icon: BarChart3 },
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <Link to="/app/dashboard" className="h-16 flex items-center px-5 border-b border-gray-200 gap-2">
        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
          <Link2 size={16} />
        </div>
        <span className="font-bold text-gray-800 text-sm tracking-wide">OutreachTracker</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-3">
          {navItems.map(({ to, label, icon: Icon, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {badge !== undefined && (
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors ${
              isActive ? 'text-indigo-700' : 'text-gray-500 hover:text-gray-900'
            }`
          }
        >
          <Settings size={16} />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
