import { Link } from 'react-router-dom'
import {
  Mail,
  Link2,
  Users,
  Target,
  TrendingUp,
  CheckSquare,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  Clock,
  Plus,
  Briefcase,
  type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useClient } from '../context/ClientContext'

export default function Dashboard() {
  const { selectedClientId, clients } = useClient()

  // Fetch live metrics from reports endpoint
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics', selectedClientId],
    queryFn: async () => {
      const url = selectedClientId ? `/reports?range=all&client=${selectedClientId}` : '/reports?range=all'
      const res = await api.get(url)
      return res.data?.data
    },
  })

  // Fetch task counts
  const { data: taskCountsData } = useQuery({
    queryKey: ['task-counts'],
    queryFn: async () => {
      const res = await api.get('/tasks/counts')
      return res.data?.data
    },
  })

  // Fetch recent campaigns
  const { data: campaignsData } = useQuery({
    queryKey: ['recent-campaigns', selectedClientId],
    queryFn: async () => {
      const url = selectedClientId
        ? `/campaigns?client=${selectedClientId}&limit=5`
        : '/campaigns?limit=5'
      const res = await api.get(url)
      return res.data?.data
    },
  })

  const kpis = reportData?.kpis || {
    totalProspects: 0,
    emailsSent: 0,
    replies: 0,
    replyRate: 0,
    linksWon: 0,
    winRate: 0,
    totalSpend: 0,
    costPerLink: 0,
  }

  const funnel = reportData?.funnel || [
    { stage: 'prospects', label: 'Prospects Discovered', count: 0, pct: 100 },
    { stage: 'contacted', label: 'Pitches Sent', count: 0, pct: 0 },
    { stage: 'replied', label: 'Replies Received', count: 0, pct: 0 },
    { stage: 'negotiating', label: 'In Negotiation', count: 0, pct: 0 },
    { stage: 'link_live', label: 'Links Won', count: 0, pct: 0 },
  ]

  const taskCounts = taskCountsData || { today: 0, overdue: 0, upcoming: 0, urgentTotal: 0 }
  const recentCampaigns = campaignsData?.campaigns || []

  const stats = [
    {
      label: 'Emails Sent',
      value: kpis.emailsSent.toString(),
      sub: 'Total pitches sent',
      icon: Mail,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Links Won',
      value: kpis.linksWon.toString(),
      sub: `${kpis.winRate}% of replies won`,
      icon: Award,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Active Prospects',
      value: kpis.totalProspects.toString(),
      sub: 'Across campaigns',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Campaigns',
      value: (recentCampaigns.length || 0).toString(),
      sub: 'In active scope',
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Live Reply Rate',
      value: `${kpis.replyRate}%`,
      sub: `${kpis.replies} replies logged`,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Tasks Due Today',
      value: taskCounts.today.toString(),
      sub: `${taskCounts.overdue} overdue`,
      icon: CheckSquare,
      color: taskCounts.urgentTotal > 0 ? 'text-rose-600' : 'text-slate-600',
      bg: taskCounts.urgentTotal > 0 ? 'bg-rose-50' : 'bg-slate-100',
    },
  ]

  const quickActions = [
    { label: 'Add Leads (Scraper / CSV)', to: '/app/prospects', icon: Users },
    { label: 'Create New Campaign', to: '/app/campaigns', icon: Target },
    { label: 'Pipeline Kanban Board', to: '/app/pipeline', icon: Briefcase },
    { label: 'Email Pitch Templates', to: '/app/templates', icon: Mail },
    { label: 'Log Live Won Link', to: '/app/links', icon: Link2 },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ─── Hero Welcome Banner ──────────────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/60 p-6 sm:p-7 shadow-xs overflow-hidden border border-indigo-100/80">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/70 border border-indigo-200/60 text-indigo-700 text-xs font-medium mb-3">
              <Sparkles size={13} className="text-indigo-600" />
              <span>Autonomous Outreach Engine Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
              Welcome back to OutreachTracker
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Your link acquisition operations are running. Monitor response rates, follow up with warm leads, and verify live backlink placements.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              to="/app/prospects"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-2xs transition-colors"
            >
              <Plus size={15} />
              <span>Find Prospects</span>
            </Link>
            <Link
              to="/app/reports"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 shadow-2xs transition-colors"
            >
              <span>View ROI Reports</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Live KPI Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-gray-500 truncate">
                {label}
              </span>
              <div className={`${bg} ${color} p-2 rounded-xl shrink-0 shadow-2xs`}>
                <Icon size={16} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-800 tracking-tight">{value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Middle Row: Outreach Funnel + Quick Actions ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Outreach Funnel (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 tracking-tight">Outreach Conversion Funnel</h3>
                <p className="text-xs text-gray-400">Prospect discovery to live verified link</p>
              </div>
              <Link
                to="/app/pipeline"
                className="text-xs text-indigo-600 font-medium hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <span>Pipeline Board</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="space-y-4">
              {funnel.map((s, idx) => {
                const colors = ['bg-indigo-600', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500']
                const barColor = colors[idx % colors.length]

                return (
                  <div key={s.stage}>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-gray-700">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-mono">0{idx + 1}</span>
                        <span>{s.label}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{s.count}</span>
                        <span className="text-[11px] font-normal text-gray-400 w-10 text-right">
                          {s.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(4, s.pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Conversion Rate:</span>
            <strong className="text-emerald-700 font-semibold">{kpis.overallConversion}%</strong>
          </div>
        </div>

        {/* Right Column: Quick Actions & Tasks (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Daily Tasks Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-800">Today's Focus Tasks</h3>
              </div>
              <Link
                to="/app/tasks"
                className="text-xs text-indigo-600 font-medium hover:underline"
              >
                View all ({taskCounts.today + taskCounts.overdue})
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 my-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-medium uppercase text-gray-400">Due Today</span>
                <p className="text-xl font-semibold text-gray-800 mt-0.5">{taskCounts.today}</p>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  taskCounts.overdue > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-slate-50 border-slate-100 text-slate-800'
                }`}
              >
                <span className="text-[10px] font-medium uppercase opacity-75">Overdue</span>
                <p className="text-xl font-semibold mt-0.5">{taskCounts.overdue}</p>
              </div>
            </div>

            <Link
              to="/app/tasks"
              className="w-full text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-medium transition-colors"
            >
              Open Daily Task Manager →
            </Link>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex-1">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              {quickActions.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-indigo-50/80 hover:text-indigo-700 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className="text-slate-400 group-hover:text-indigo-600" />
                    <span>{label}</span>
                  </div>
                  <ChevronRight size={13} className="text-slate-300 group-hover:text-indigo-600" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Active Campaigns Snapshot ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Active Outreach Campaigns</h3>
            <p className="text-xs text-gray-400">Current progress toward link acquisition goals</p>
          </div>
          <Link
            to="/app/campaigns"
            className="text-xs text-indigo-600 font-medium hover:underline inline-flex items-center gap-1"
          >
            <span>All Campaigns</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
            <Target size={28} className="text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No campaigns created yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create an outreach campaign to organize target URLs, prospects, and link targets.
            </p>
            <Link
              to="/app/campaigns"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 shadow-2xs"
            >
              <Plus size={13} />
              <span>Create First Campaign</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {recentCampaigns.map((camp: any) => (
              <Link
                key={camp._id}
                to={`/app/campaigns/${camp._id}`}
                className="p-4 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all group bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-medium text-gray-800 group-hover:text-indigo-600 transition-colors truncate">
                      {camp.name}
                    </h4>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {camp.status}
                    </span>
                  </div>

                  {camp.client && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-3">
                      <Briefcase size={11} />
                      <span className="truncate">{camp.client.name}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                    <span>Links Goal</span>
                    <span className="text-slate-700 font-semibold">
                      {camp.linksWon || 0} / {camp.goalLinks || 0}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(((camp.linksWon || 0) / (camp.goalLinks || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
