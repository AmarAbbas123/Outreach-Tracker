import { Bell, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients':   'Clients',
  '/campaigns': 'Campaigns',
  '/prospects': 'Prospects',
  '/pipeline':  'Pipeline',
  '/templates': 'Email Templates',
  '/tasks':     'Tasks',
  '/links':     'Won Links',
  '/reports':   'Reports',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'Outreach Tracker'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Search size={18} />
        </button>
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
          U
        </div>
      </div>
    </header>
  )
}

