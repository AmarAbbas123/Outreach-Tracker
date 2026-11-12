import { Link } from 'react-router-dom'
import {
  Mail, Link2, Users, Target, TrendingUp, CheckSquare,
  ArrowRight, type LucideIcon,
} from 'lucide-react'

// ─── Stat cards ───────────────────────────────────────────────────────────────

interface StatCard {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  color: string
  bg: string
}

const stats: StatCard[] = [
  { label: 'Emails Sent',      value: '0',  sub: 'this month',     icon: Mail,        color: 'text-blue-600',   bg: 'bg-blue-50' },
  { label: 'Links Won',        value: '0',  sub: 'all time',       icon: Link2,       color: 'text-green-600',  bg: 'bg-green-50' },
  { label: 'Active Prospects', value: '0',  sub: 'across campaigns', icon: Users,     color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Campaigns',        value: '0',  sub: 'active',         icon: Target,      color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Reply Rate',       value: '—',  sub: 'last 30 days',   icon: TrendingUp,  color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Tasks Due Today',  value: '0',  sub: '0 overdue',      icon: CheckSquare, color: 'text-red-600',    bg: 'bg-red-50' },
]

// ─── Quick actions ────────────────────────────────────────────────────────────

const quickActions = [
  { label: 'Add Prospect',  to: '/app/prospects' },
  { label: 'New Campaign',  to: '/app/campaigns' },
  { label: 'New Template',  to: '/app/templates' },
  { label: 'Log a Link',    to: '/app/links' },
] as const

// ─── Funnel rows ──────────────────────────────────────────────────────────────

const funnelStages = [
  { label: 'Prospects',   count: 0, pct: 100, color: 'bg-indigo-500' },
  { label: 'Contacted',   count: 0, pct: 0,   color: 'bg-blue-500' },
  { label: 'Replied',     count: 0, pct: 0,   color: 'bg-violet-500' },
  { label: 'Negotiating', count: 0, pct: 0,   color: 'bg-orange-500' },
  { label: 'Link Live',   count: 0, pct: 0,   color: 'bg-green-500' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Welcome back 👋</h2>
          <p className="text-indigo-100 text-sm mt-1">
            Here's what's happening with your outreach today.
          </p>
        </div>
        <Link
          to="/app/prospects"
          className="hidden sm:flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Add prospects <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
          >
            <div className={`${bg} ${color} p-3 rounded-xl`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row: Funnel + Quick actions + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">Outreach Funnel</h3>
          <div className="space-y-3">
            {funnelStages.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>{s.label}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full transition-all`}
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-5 text-center">
            Start by adding a client and campaign, then import prospects.
          </p>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              {quickActions.map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-sm font-medium text-gray-700 transition-colors group"
                >
                  {label}
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-indigo-500" />
                </Link>
              ))}
            </div>
          </div>

          {/* Today's tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tasks Due Today</h3>
            <p className="text-xs text-gray-400 text-center py-4">
              No tasks due today.
            </p>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">No activity yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Start by{' '}
            <Link to="/app/clients" className="text-indigo-600 hover:underline">
              creating a client
            </Link>{' '}
            and campaign.
          </p>
        </div>
      </div>
    </div>
  )
}
