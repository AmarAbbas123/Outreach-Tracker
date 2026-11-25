import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  TrendingUp,
  Mail,
  Link2,
  Users,
  Target,
  DollarSign,
  Download,
  Printer,
  Calendar,
  Award,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Percent,
  Sparkles,
  HelpCircle,
  Briefcase,
  Search,
} from 'lucide-react'
import api from '../api/client'
import { useClient } from '../context/ClientContext'

// ─── Types ───────────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | 'month' | 'all'

interface ReportKPIs {
  totalProspects: number
  emailsSent: number
  replies: number
  replyRate: number
  linksWon: number
  winRate: number
  overallConversion: number
  totalSpend: number
  costPerLink: number
  avgDr: number
}

interface FunnelStep {
  stage: string
  label: string
  count: number
  pct: number
}

interface StageCount {
  key: string
  label: string
  count: number
}

interface ActivityPoint {
  date: string
  label: string
  sent: number
  replies: number
  won: number
}

interface LinkBreakdown {
  byRel: { rel: string; count: number; pct: number; totalCost: number }[]
  paidCount: number
  freeCount: number
  totalSpend: number
  avgCost: number
}

interface CampaignPerf {
  _id: string
  name: string
  type: string
  status: string
  client: { _id: string; name: string; domain?: string } | null
  prospects: number
  emailsSent: number
  replies: number
  replyRate: number
  linksWon: number
  goalLinks: number
  linksProgress: number
  spend: number
  budget: number
  costPerLink: number
}

interface ReportData {
  kpis: ReportKPIs
  funnel: FunnelStep[]
  stages: StageCount[]
  activityTimeline: ActivityPoint[]
  linkBreakdown: LinkBreakdown
  campaignPerformance: CampaignPerf[]
}

const ranges: { key: DateRange; label: string }[] = [
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
]

export default function Reports() {
  const { selectedClientId, clients } = useClient()

  const [range, setRange] = useState<DateRange>('30d')
  const [localClientFilter, setLocalClientFilter] = useState<string>('')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [campaignSearch, setCampaignSearch] = useState('')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<ActivityPoint | null>(null)

  // Active client filter
  const effectiveClientFilter = selectedClientId || localClientFilter

  // Fetch campaigns for dropdown filter
  const { data: campaignsData } = useQuery<{ campaigns: { _id: string; name: string }[] }>({
    queryKey: ['campaigns-for-reports', effectiveClientFilter],
    queryFn: async () => {
      const url = effectiveClientFilter
        ? `/campaigns?client=${effectiveClientFilter}&limit=100`
        : '/campaigns?limit=100'
      const res = await api.get(url)
      return res.data?.data
    },
  })

  const availableCampaigns = campaignsData?.campaigns || []

  // Fetch report data
  const { data: reportResponse, isLoading } = useQuery<{ data: ReportData }>({
    queryKey: ['reports-data', range, effectiveClientFilter, campaignFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('range', range)
      if (effectiveClientFilter) params.append('client', effectiveClientFilter)
      if (campaignFilter && campaignFilter !== 'all') params.append('campaign', campaignFilter)

      const res = await api.get(`/reports?${params.toString()}`)
      return res.data
    },
  })

  const reportData = reportResponse?.data

  const kpis: ReportKPIs = reportData?.kpis || {
    totalProspects: 0,
    emailsSent: 0,
    replies: 0,
    replyRate: 0,
    linksWon: 0,
    winRate: 0,
    overallConversion: 0,
    totalSpend: 0,
    costPerLink: 0,
    avgDr: 0,
  }

  const funnel: FunnelStep[] = reportData?.funnel || []
  const stages: StageCount[] = reportData?.stages || []
  const timeline: ActivityPoint[] = reportData?.activityTimeline || []
  const linkBreakdown: LinkBreakdown = reportData?.linkBreakdown || {
    byRel: [],
    paidCount: 0,
    freeCount: 0,
    totalSpend: 0,
    avgCost: 0,
  }
  const campaigns: CampaignPerf[] = reportData?.campaignPerformance || []

  // Filter campaigns list by search
  const filteredCampaigns = useMemo(() => {
    if (!campaignSearch.trim()) return campaigns
    const q = campaignSearch.toLowerCase()
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.client?.name && c.client.name.toLowerCase().includes(q))
    )
  }, [campaigns, campaignSearch])

  // CSV Export Trigger
  const handleExportCsv = (type: 'campaigns' | 'prospects' | 'links') => {
    const params = new URLSearchParams()
    params.append('range', range)
    params.append('type', type)
    if (effectiveClientFilter) params.append('client', effectiveClientFilter)
    if (campaignFilter && campaignFilter !== 'all') params.append('campaign', campaignFilter)

    const token = localStorage.getItem('token')
    const baseURL = api.defaults.baseURL || '/api'
    const downloadUrl = `${baseURL}/reports/export?${params.toString()}`

    // Trigger download with auth token
    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `outreach-report-${type}-${new Date().toISOString().substring(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        setExportMenuOpen(false)
      })
      .catch((err) => {
        console.error('Export failed', err)
      })
  }

  // Calculate timeline max for SVG chart scaling
  const maxTimelineVal = useMemo(() => {
    if (!timeline.length) return 5
    const max = Math.max(...timeline.map((t) => Math.max(t.sent, t.replies, t.won)))
    return max > 0 ? max : 5
  }, [timeline])

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ─── Header & Global Filter Bar ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 tracking-tight flex items-center gap-2">
            <span>Outreach & ROI Reports</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
              Live Analytics
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor response funnels, live backlink throughput, and cost-per-link metrics.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Client Filter (if not locked in topbar) */}
          {!selectedClientId && (
            <select
              value={localClientFilter}
              onChange={(e) => {
                setLocalClientFilter(e.target.value)
                setCampaignFilter('all')
              }}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Campaign Selector */}
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-indigo-500 shadow-2xs max-w-[170px] truncate"
          >
            <option value="all">All Campaigns</option>
            {availableCampaigns.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Date Range Selector */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200/80 overflow-x-auto no-scrollbar shrink-0">
            {ranges.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  range === key
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Export CSV Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 shadow-2xs transition-colors shrink-0"
            >
              <Download size={13} className="text-indigo-600" />
              <span>Export CSV</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Download Datasets
                </div>
                <button
                  onClick={() => handleExportCsv('campaigns')}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                >
                  <span>Campaign Performance</span>
                  <span className="text-[10px] text-gray-400 font-mono">.csv</span>
                </button>
                <button
                  onClick={() => handleExportCsv('prospects')}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                >
                  <span>Prospect Pipeline</span>
                  <span className="text-[10px] text-gray-400 font-mono">.csv</span>
                </button>
                <button
                  onClick={() => handleExportCsv('links')}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                >
                  <span>Won Backlinks Log</span>
                  <span className="text-[10px] text-gray-400 font-mono">.csv</span>
                </button>
              </div>
            )}
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="p-1.5 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-gray-800 shadow-2xs transition-colors"
            title="Print or Save PDF"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* ─── Executive KPI Strip ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Prospects */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Prospects</span>
            <Users size={15} className="text-blue-600" />
          </div>
          <div className="text-2xl font-semibold text-gray-800">{kpis.totalProspects}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">In active scope</div>
        </div>

        {/* Emails Sent */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Emails Sent</span>
            <Mail size={15} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-semibold text-gray-800">{kpis.emailsSent}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Pitches delivered</div>
        </div>

        {/* Replies & Reply Rate */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Reply Rate</span>
            <TrendingUp size={15} className="text-violet-600" />
          </div>
          <div className="text-2xl font-semibold text-violet-700">{kpis.replyRate}%</div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            <span className="font-medium text-gray-700">{kpis.replies}</span> positive replies
          </div>
        </div>

        {/* Links Won */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Links Won</span>
            <Award size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-semibold text-emerald-700">{kpis.linksWon}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {kpis.winRate}% of replies won
          </div>
        </div>

        {/* Cost Per Link */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Cost / Link</span>
            <DollarSign size={15} className="text-amber-600" />
          </div>
          <div className="text-2xl font-semibold text-gray-800">
            ${kpis.costPerLink.toFixed(0)}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            ${kpis.totalSpend.toLocaleString()} total spend
          </div>
        </div>

        {/* Average DR */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-medium text-gray-500">Average DR</span>
            <ShieldCheck size={15} className="text-purple-600" />
          </div>
          <div className="text-2xl font-semibold text-purple-700">
            {kpis.avgDr > 0 ? kpis.avgDr : '—'}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Authority score</div>
        </div>
      </div>

      {/* ─── Funnel + Activity Chart Row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Outreach Funnel (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Outreach Funnel</h3>
                <p className="text-xs text-gray-400">Step-by-step conversion drop-off</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {kpis.overallConversion}% Win Rate
              </span>
            </div>

            <div className="space-y-3.5">
              {funnel.map((step, idx) => {
                const colors = [
                  'bg-indigo-600',
                  'bg-blue-500',
                  'bg-violet-500',
                  'bg-amber-500',
                  'bg-emerald-500',
                ]
                const barColor = colors[idx % colors.length]

                return (
                  <div key={step.stage}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-mono">0{idx + 1}</span>
                        <span>{step.label}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{step.count}</span>
                        <span className="text-[10px] font-semibold text-gray-400 w-9 text-right">
                          {step.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.max(3, step.pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Overall Conversion from discovery to won link:</span>
            <strong className="text-gray-900 font-bold">{kpis.overallConversion}%</strong>
          </div>
        </div>

        {/* Daily Outreach Activity Timeline SVG Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Activity Timeline</h3>
                <p className="text-xs text-gray-400">Daily emails sent, replies, and won links</p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  <span className="text-gray-600 font-medium">Sent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
                  <span className="text-gray-600 font-medium">Replies</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-gray-600 font-medium">Won</span>
                </div>
              </div>
            </div>

            {/* SVG Interactive Chart */}
            <div className="relative pt-2 pb-4">
              {activeTooltip && (
                <div className="absolute top-0 right-4 bg-white border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-[10px] font-mono shadow-md z-10 animate-in fade-in">
                  <span className="text-gray-900 font-medium">{activeTooltip.label}:</span>{' '}
                  <span className="text-indigo-600 font-medium">{activeTooltip.sent} sent</span> •{' '}
                  <span className="text-violet-600 font-medium">{activeTooltip.replies} replies</span> •{' '}
                  <span className="text-emerald-600 font-medium">{activeTooltip.won} won</span>
                </div>
              )}

              <div className="h-44 w-full flex items-end justify-between gap-1 sm:gap-2 px-1">
                {timeline.map((point) => {
                  const sentHeight = (point.sent / maxTimelineVal) * 100
                  const replyHeight = (point.replies / maxTimelineVal) * 100
                  const wonHeight = (point.won / maxTimelineVal) * 100

                  return (
                    <div
                      key={point.date}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      onMouseEnter={() => setActiveTooltip(point)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <div className="w-full flex items-end justify-center gap-0.5 h-36">
                        {/* Sent Bar */}
                        <div
                          className="w-1.5 sm:w-2 bg-indigo-500 rounded-t-sm transition-all group-hover:bg-indigo-600"
                          style={{ height: `${Math.max(point.sent > 0 ? 6 : 2, sentHeight)}%` }}
                        />
                        {/* Reply Bar */}
                        <div
                          className="w-1.5 sm:w-2 bg-violet-400 rounded-t-sm transition-all group-hover:bg-violet-500"
                          style={{ height: `${Math.max(point.replies > 0 ? 6 : 2, replyHeight)}%` }}
                        />
                        {/* Won Bar */}
                        <div
                          className="w-1.5 sm:w-2 bg-emerald-400 rounded-t-sm transition-all group-hover:bg-emerald-500"
                          style={{ height: `${Math.max(point.won > 0 ? 6 : 2, wonHeight)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 mt-2 truncate max-w-full group-hover:text-gray-900 group-hover:font-bold">
                        {point.label.split(' ')[1] || point.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Data updated in real time via workspace webhooks</span>
            <span className="text-gray-600 font-semibold">{timeline.length} days plotted</span>
          </div>
        </div>
      </div>

      {/* ─── Stage Distribution + Link Quality Breakdown ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pipeline Stage Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Pipeline Inventory</h3>
              <p className="text-xs text-gray-400">Prospect counts across all 9 pipeline stages</p>
            </div>
            <Link
              to="/app/pipeline"
              className="text-xs text-indigo-600 font-bold hover:text-indigo-800 inline-flex items-center gap-1"
            >
              <span>Open Board</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {stages.map((st) => (
              <div
                key={st.key}
                className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-indigo-100 hover:shadow-2xs transition-all"
              >
                <div className="text-[11px] font-bold text-gray-500 truncate mb-1">{st.label}</div>
                <div className="text-lg font-black text-gray-900">{st.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Won Link Quality & Rel Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Link Quality Breakdown</h3>
                <p className="text-xs text-gray-400">Rel attributes & acquisition spend</p>
              </div>
              <Link
                to="/app/links"
                className="text-xs text-indigo-600 font-bold hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <span>All Links</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            {/* Rel Breakdown Bars */}
            <div className="space-y-3 mb-5">
              {linkBreakdown.byRel.length > 0 ? (
                linkBreakdown.byRel.map((relItem) => (
                  <div key={relItem.rel}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700 capitalize">{relItem.rel}</span>
                      <span className="text-gray-500">
                        <strong>{relItem.count}</strong> links ({relItem.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-indigo-600"
                        style={{ width: `${relItem.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-gray-400 italic">
                  No won links recorded yet. Log live links to view rel metrics.
                </div>
              )}
            </div>

            {/* Paid vs Free stats */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Organic (Free)</span>
                <p className="text-base font-extrabold text-emerald-950 mt-0.5">
                  {linkBreakdown.freeCount} links
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100">
                <span className="text-[10px] font-bold uppercase text-purple-800">Paid Sponsorships</span>
                <p className="text-base font-extrabold text-purple-950 mt-0.5">
                  {linkBreakdown.paidCount} links
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>Average acquisition cost:</span>
            <strong className="text-gray-900 font-bold">${linkBreakdown.avgCost.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* ─── Campaign Performance Ranking Table ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Campaign Performance Ranking</h3>
            <p className="text-xs text-gray-400">Response rates, won targets, and budgets</p>
          </div>

          {/* Quick search input */}
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={campaignSearch}
              onChange={(e) => setCampaignSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-10 bg-gray-50 rounded" />
            <div className="h-10 bg-gray-50 rounded" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Target size={28} className="text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-800">No campaigns found</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Create an outreach campaign and log email replies or links to view performance metrics.
            </p>
            <Link
              to="/app/campaigns"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-2xs"
            >
              <span>Go to Campaigns</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Campaign & Client</th>
                  <th className="py-3 px-4">Prospects</th>
                  <th className="py-3 px-4">Emails Sent</th>
                  <th className="py-3 px-4">Replies & Rate</th>
                  <th className="py-3 px-4">Links Goal</th>
                  <th className="py-3 px-4">Spend vs Budget</th>
                  <th className="py-3 px-4 text-right">Cost / Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCampaigns.map((camp) => (
                  <tr key={camp._id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Name & Client */}
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div>
                        <Link
                          to={`/app/campaigns/${camp._id}`}
                          className="font-bold text-gray-900 hover:text-indigo-600 transition-colors truncate block max-w-[200px]"
                        >
                          {camp.name}
                        </Link>
                        {camp.client ? (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Briefcase size={10} />
                            <span>{camp.client.name}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">No client</span>
                        )}
                      </div>
                    </td>

                    {/* Prospects */}
                    <td className="py-3.5 px-4 text-gray-700 font-bold">{camp.prospects}</td>

                    {/* Emails Sent */}
                    <td className="py-3.5 px-4 text-gray-700 font-medium">{camp.emailsSent}</td>

                    {/* Replies & Rate */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-gray-900">{camp.replies}</span>
                        <span className="text-[10px] text-violet-700 bg-violet-50 font-bold px-1.5 py-0.5 rounded ml-1.5 border border-violet-100">
                          {camp.replyRate}%
                        </span>
                      </div>
                    </td>

                    {/* Links Goal with Progress Bar */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                          <span>
                            {camp.linksWon} / {camp.goalLinks || 0}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">
                            {camp.linksProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${camp.linksProgress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Spend vs Budget */}
                    <td className="py-3.5 px-4">
                      <div className="text-gray-800 font-semibold">
                        ${camp.spend.toLocaleString()}
                        <span className="text-gray-400 text-[10px] font-normal">
                          {' '}
                          / ${camp.budget ? camp.budget.toLocaleString() : '0'}
                        </span>
                      </div>
                    </td>

                    {/* Cost Per Link */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-gray-900">
                        ${camp.costPerLink.toFixed(0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
