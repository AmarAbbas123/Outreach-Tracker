import { NavLink } from 'react-router-dom'
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
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/clients',    label: 'Clients',    icon: Users },
  { to: '/campaigns',  label: 'Campaigns',  icon: Target },
  { to: '/prospects',  label: 'Prospects',  icon: Globe },
  { to: '/pipeline',   label: 'Pipeline',   icon: KanbanSquare },
  { to: '/templates',  label: 'Templates',  icon: Mail },
  { to: '/tasks',      label: 'Tasks',      icon: CheckSquare },
  { to: '/links',      label: 'Won Links',  icon: Link2 },
  { to: '/reports',    label: 'Reports',    icon: BarChart3 },
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200">
        <Link2 className="text-indigo-600 mr-2" size={22} />
        <span className="font-bold text-gray-800 text-sm tracking-wide">OutreachTracker</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
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
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
        v0.1.0 · MVP
      </div>
    </aside>
  )
}

