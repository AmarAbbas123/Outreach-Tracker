import {
  Mail, Link2, Users, Target, TrendingUp, CheckSquare,
  type LucideIcon,
} from 'lucide-react'

interface StatCard {
  label: string
  value: string
  icon: LucideIcon
  color: string
  bg: string
}

const stats: StatCard[] = [
  { label: 'Emails Sent',      value: '0', icon: Mail,        color: 'text-blue-500',   bg: 'bg-blue-50' },
  { label: 'Links Won',        value: '0', icon: Link2,       color: 'text-green-500',  bg: 'bg-green-50' },
  { label: 'Active Prospects', value: '0', icon: Users,       color: 'text-purple-500', bg: 'bg-purple-50' },
  { label: 'Campaigns',        value: '0', icon: Target,      color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: 'Reply Rate',       value: '—', icon: TrendingUp,  color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { label: 'Tasks Due Today',  value: '0', icon: CheckSquare, color: 'text-red-500',    bg: 'bg-red-50' },
]

const quickActions = ['Add Prospect', 'New Campaign', 'Send Email', 'Log Link'] as const

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold">Welcome back 👋</h2>
        <p className="text-indigo-100 text-sm mt-1">
          Here's what's happening with your outreach today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
          >
            <div className={`${bg} ${color} p-3 rounded-lg`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
        <p className="text-sm text-gray-400 text-center py-8">
          No activity yet. Start by creating a client and campaign.
        </p>
      </div>
    </div>
  )
}

