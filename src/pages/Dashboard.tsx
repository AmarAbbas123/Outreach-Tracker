import { useState } from 'react'
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
  Check,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useClient } from '../context/ClientContext'

export default function Dashboard() {
  const queryClient = useQueryClient()
  const { selectedClientId, clients } = useClient()

  const [taskTab, setTaskTab] = useState<'today' | 'overdue'>('today')
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)

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
    refetchInterval: 15000,
  })

  // Fetch today's focus tasks
  const { data: todayTasksData } = useQuery({
    queryKey: ['dashboard-tasks-today'],
    queryFn: async () => {
      const res = await api.get('/tasks?filter=today&limit=5')
      return res.data?.data?.tasks || []
    },
    refetchInterval: 15000,
  })

  // Fetch overdue tasks
  const { data: overdueTasksData } = useQuery({
    queryKey: ['dashboard-tasks-overdue'],
    queryFn: async () => {
      const res = await api.get('/tasks?filter=overdue&limit=5')
      return res.data?.data?.tasks || []
    },
    refetchInterval: 15000,
  })

  // Complete Task Mutation
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      setCompletingTaskId(id)
      const res = await api.patch(`/tasks/${id}/complete`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks-today'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks-overdue'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      setCompletingTaskId(null)
    },
    onError: () => {
      setCompletingTaskId(null)
    },
  })

  // Snooze Task Mutation (+3 days)
  const snoozeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/tasks/${id}/snooze`, { days: 3 })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks-today'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks-overdue'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Quick Create Task Mutation
  const createQuickTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post('/tasks', {
        title: title.trim(),
        dueAt: new Date().toISOString(),
        type: 'manual',
      })
      return res.data
    },
    onSuccess: () => {
      setQuickTaskTitle('')
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks-today'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks-overdue'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTaskTitle.trim()) return
    createQuickTaskMutation.mutate(quickTaskTitle)
  }

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
          {/* Daily Tasks Interactive Center */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Daily Focus Tasks</h3>
                </div>
                <Link
                  to="/app/tasks"
                  className="text-xs text-indigo-600 font-medium hover:underline inline-flex items-center gap-1"
                >
                  <span>All Tasks ({taskCounts.urgentTotal})</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

              {/* Task Tab Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200/70 rounded-xl mb-3">
                <button
                  type="button"
                  onClick={() => setTaskTab('today')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                    taskTab === 'today'
                      ? 'bg-white text-gray-800 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>Due Today</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 font-mono">
                    {taskCounts.today}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskTab('overdue')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 ${
                    taskTab === 'overdue'
                      ? 'bg-white text-rose-700 shadow-2xs'
                      : 'text-gray-500 hover:text-rose-600'
                  }`}
                >
                  <span>Overdue</span>
                  {taskCounts.overdue > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                      {taskCounts.overdue}
                    </span>
                  )}
                </button>
              </div>

              {/* Quick Add Inline Form */}
              <form onSubmit={handleQuickAdd} className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="+ Add quick follow-up task..."
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                />
                <button
                  type="submit"
                  disabled={!quickTaskTitle.trim() || createQuickTaskMutation.isPending}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium disabled:opacity-50 shadow-2xs transition-colors shrink-0"
                >
                  {createQuickTaskMutation.isPending ? 'Adding...' : 'Add'}
                </button>
              </form>

              {/* Active Task List */}
              <div className="space-y-2 mb-3 min-h-[120px]">
                {((taskTab === 'today' ? todayTasksData : overdueTasksData) || []).length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <CheckCircle2 size={22} className="text-emerald-500 mx-auto mb-1.5" />
                    <p className="text-xs font-medium text-gray-700">
                      {taskTab === 'today'
                        ? 'No tasks due today'
                        : 'No overdue follow-up tasks'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      You are all caught up on your outreach queue.
                    </p>
                  </div>
                ) : (
                  ((taskTab === 'today' ? todayTasksData : overdueTasksData) || []).map((t: any) => (
                    <div
                      key={t._id}
                      className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex items-start justify-between gap-2.5 group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* One-click complete checkbox */}
                        <button
                          type="button"
                          onClick={() => completeMutation.mutate(t._id)}
                          disabled={completingTaskId === t._id}
                          className="mt-0.5 w-4 h-4 rounded-md border border-slate-300 hover:border-indigo-600 flex items-center justify-center transition-colors text-white hover:bg-indigo-50 group/check shrink-0"
                          title="Mark complete"
                        >
                          {completingTaskId === t._id ? (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                          ) : (
                            <Check
                              size={11}
                              className="opacity-0 group-hover/check:opacity-100 text-indigo-600 transition-opacity"
                            />
                          )}
                        </button>

                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {t.title}
                          </p>
                          {t.prospect && (
                            <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                              {t.prospect.domain}{' '}
                              {t.prospect.contactName && `• ${t.prospect.contactName}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Snooze +3d button */}
                      <button
                        type="button"
                        onClick={() => snoozeMutation.mutate(t._id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors text-[10px] shrink-0 font-mono"
                        title="Snooze 3 days"
                      >
                        +3d
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              to="/app/tasks"
              className="w-full text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-medium transition-colors"
            >
              Open Full Task Manager →
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
