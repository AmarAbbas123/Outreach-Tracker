import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Target,
  ExternalLink,
  Award,
  Users,
  DollarSign,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Plus,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Mail,
  MessageSquare,
  Percent,
  Briefcase,
  Link2,
  ArrowRight,
  Send,
} from 'lucide-react'
import api from '../api/client'
import { useClient } from '../context/ClientContext'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Campaign {
  _id: string
  name: string
  client: {
    _id: string
    name: string
    domain?: string
  }
  type: string
  targetUrls: string[]
  goalLinks: number
  budget: number
  startDate?: string
  endDate?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  createdAt: string
  updatedAt: string
}

interface CampaignStats {
  prospectsCount: number
  emailsSent: number
  replies: number
  replyRate: number
  linksWon: number
  goalLinks: number
  goalProgress: number
  budget: number
  totalSpend: number
  budgetProgress: number
  costPerLink: number
  statusBreakdown: Record<string, number>
}

interface Prospect {
  _id: string
  domain: string
  contactName?: string
  contactEmail?: string
  metrics?: { dr: number; traffic: number }
  status: string
  nextFollowUpAt?: string
}

interface LinkRecord {
  _id: string
  sourceUrl: string
  targetUrl?: string
  anchorText?: string
  rel: string
  cost: number
  liveDate: string
  status: string
  notes?: string
  prospect?: {
    _id: string
    domain: string
    contactName?: string
    contactEmail?: string
  }
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

const typeLabels: Record<string, string> = {
  guest_post: 'Guest Post',
  broken_link: 'Broken Link',
  resource_page: 'Resource Page',
  link_insertion: 'Link Insertion',
  digital_pr: 'Digital PR',
  other: 'Other Outreach',
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { clients } = useClient()

  const [activeTab, setActiveTab] = useState<'overview' | 'prospects' | 'links'>('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAddLinkModal, setShowAddLinkModal] = useState(false)
  const [showAddProspectModal, setShowAddProspectModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch campaign overview & stats
  const { data, isLoading, error } = useQuery<{
    campaign: Campaign
    stats: CampaignStats
  }>({
    queryKey: ['campaign-detail', id],
    queryFn: async () => {
      const res = await api.get(`/campaigns/${id}/stats`)
      return res.data?.data
    },
    enabled: !!id,
  })

  // Fetch campaign prospects
  const { data: prospectsData, isLoading: prospectsLoading } = useQuery<{
    prospects: Prospect[]
  }>({
    queryKey: ['campaign-prospects', id],
    queryFn: async () => {
      const res = await api.get(`/prospects?campaign=${id}&limit=100`)
      return res.data?.data
    },
    enabled: activeTab === 'prospects' && !!id,
  })

  // Fetch campaign won links
  const { data: linksData, isLoading: linksLoading } = useQuery<{
    links: LinkRecord[]
  }>({
    queryKey: ['campaign-links', id],
    queryFn: async () => {
      const res = await api.get(`/campaigns/${id}/links`)
      return res.data?.data
    },
    enabled: (activeTab === 'links' || activeTab === 'overview') && !!id,
  })

  // Update campaign mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await api.put(`/campaigns/${id}`, updates)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setShowEditModal(false)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to update campaign.')
    },
  })

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/campaigns/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      navigate('/app/campaigns')
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to delete campaign.')
    },
  })

  // Add Link mutation
  const addLinkMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/campaigns/${id}/links`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-links', id] })
      queryClient.invalidateQueries({ queryKey: ['campaign-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setShowAddLinkModal(false)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to record won link.')
    },
  })

  // Add Prospect mutation
  const addProspectMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/prospects', { ...payload, campaign: id })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-prospects', id] })
      queryClient.invalidateQueries({ queryKey: ['campaign-detail', id] })
      setShowAddProspectModal(false)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to add prospect.')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !data?.campaign) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">Campaign Not Found</h3>
        <p className="text-sm text-gray-500 mb-6">
          The requested campaign does not exist or has been removed.
        </p>
        <Link
          to="/app/campaigns"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <ArrowLeft size={16} /> Back to Campaigns
        </Link>
      </div>
    )
  }

  const { campaign, stats } = data
  const prospectsList = prospectsData?.prospects || []
  const linksList = linksData?.links || []
  const isCompleted = campaign.status === 'completed'

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Breadcrumb & Status Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/app/campaigns"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={14} /> Back to All Campaigns
        </Link>

        <div className="flex items-center gap-2">
          {/* Quick status toggle */}
          {isCompleted ? (
            <button
              onClick={() => updateMutation.mutate({ status: 'active' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <RotateCcw size={13} /> Re-open Campaign
            </button>
          ) : campaign.status === 'active' ? (
            <button
              onClick={() => updateMutation.mutate({ status: 'paused' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Pause size={13} /> Pause
            </button>
          ) : (
            <button
              onClick={() => updateMutation.mutate({ status: 'active' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Play size={13} /> Activate
            </button>
          )}

          {!isCompleted && (
            <button
              onClick={() => updateMutation.mutate({ status: 'completed' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <CheckCircle2 size={13} /> Mark Completed
            </button>
          )}

          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 shadow-xs transition-colors"
          >
            <Edit2 size={13} /> Edit
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Campaign Notice</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Read-only banner if completed */}
      {isCompleted && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <span>This campaign is marked as completed and is currently in read-only mode.</span>
          </div>
          <button
            onClick={() => updateMutation.mutate({ status: 'active' })}
            className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 text-xs"
          >
            Re-open Campaign
          </button>
        </div>
      )}

      {/* Campaign Header Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
            <Target size={26} />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{campaign.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${statusColors[campaign.status]}`}>
                {campaign.status}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold">
                {typeLabels[campaign.type] || campaign.type}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 flex-wrap">
              {campaign.client ? (
                <Link
                  to={`/app/clients/${campaign.client._id}`}
                  className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold hover:underline"
                >
                  <Briefcase size={13} />
                  <span>{campaign.client.name}</span>
                  {campaign.client.domain && <span>({campaign.client.domain})</span>}
                </Link>
              ) : (
                <span className="text-gray-400 italic">No Client Attached</span>
              )}

              {campaign.startDate && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <Calendar size={13} />
                    {new Date(campaign.startDate).toLocaleDateString()}
                    {campaign.endDate ? ` - ${new Date(campaign.endDate).toLocaleDateString()}` : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddProspectModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            <Plus size={14} /> Add Prospect
          </button>
          <button
            onClick={() => setShowAddLinkModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Award size={14} /> Log Won Link
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('prospects')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'prospects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>Prospects</span>
          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">
            {stats.prospectsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('links')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'links'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span>Won Links</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            {stats.linksWon}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: OVERVIEW ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress Bars (Links Won vs Goal & Spend vs Budget) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Links Progress */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Award size={14} className="text-emerald-600" /> Links Goal Progress
                </span>
                <span className="text-xs font-bold text-gray-800">
                  {stats.linksWon} / {stats.goalLinks} links ({stats.goalProgress}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.goalProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 mt-2">
                <span>Remaining: {Math.max(0, stats.goalLinks - stats.linksWon)} links</span>
                <span className="text-emerald-600 font-semibold">{stats.linksWon} live links verified</span>
              </div>
            </div>

            {/* Budget Progress */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-purple-600" /> Budget Spend Progress
                </span>
                <span className="text-xs font-bold text-gray-800">
                  ${stats.totalSpend.toLocaleString()} / ${stats.budget.toLocaleString()} ({stats.budgetProgress}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.budgetProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 mt-2">
                <span>Remaining: ${Math.max(0, stats.budget - stats.totalSpend).toLocaleString()}</span>
                <span className="text-purple-600 font-semibold">Cost / link: ${stats.costPerLink}</span>
              </div>
            </div>
          </div>

          {/* 4-Stat Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Prospects
              </div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.prospectsCount}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Identified targets</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Emails Sent
              </div>
              <div className="text-2xl font-extrabold text-indigo-600">{stats.emailsSent}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Pitched prospects</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Replies Received
              </div>
              <div className="text-2xl font-extrabold text-emerald-600">{stats.replies}</div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">{stats.replyRate}% reply rate</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Links Won
              </div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.linksWon}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Average ${stats.costPerLink}/link</div>
            </div>
          </div>

          {/* Pipeline Stage Breakdown Strip */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Pipeline Status Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-xs">
              {[
                { label: 'New', count: stats.statusBreakdown?.new || 0, color: 'bg-gray-50 text-gray-700' },
                { label: 'Contact Found', count: stats.statusBreakdown?.contact_found || 0, color: 'bg-blue-50 text-blue-700' },
                { label: 'Email Sent', count: stats.statusBreakdown?.email_sent || 0, color: 'bg-indigo-50 text-indigo-700' },
                { label: 'Follow-up Sent', count: stats.statusBreakdown?.followup_sent || 0, color: 'bg-indigo-50 text-indigo-800' },
                { label: 'Replied', count: stats.statusBreakdown?.replied || 0, color: 'bg-amber-50 text-amber-700' },
                { label: 'Negotiating', count: stats.statusBreakdown?.negotiating || 0, color: 'bg-purple-50 text-purple-700' },
                { label: 'Link Live', count: stats.statusBreakdown?.link_live || 0, color: 'bg-emerald-50 text-emerald-700 font-bold' },
                { label: 'Lost', count: stats.statusBreakdown?.lost || 0, color: 'bg-rose-50 text-rose-700' },
              ].map((stage) => (
                <div key={stage.label} className={`p-2.5 rounded-xl border border-gray-100 ${stage.color}`}>
                  <div className="text-base font-extrabold mb-0.5">{stage.count}</div>
                  <div className="text-[10px] leading-tight font-medium">{stage.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Target URLs & Meta Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Target URLs Being Promoted ({campaign.targetUrls?.length || 0})
            </h3>
            {campaign.targetUrls && campaign.targetUrls.length > 0 ? (
              <div className="space-y-2">
                {campaign.targetUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs font-mono text-gray-700 border border-gray-100">
                    <span className="truncate mr-3">{url}</span>
                    <a
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 shrink-0"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No target URLs configured for this campaign.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: PROSPECTS ───────────────────────────────────────────────── */}
      {activeTab === 'prospects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Campaign Prospects ({prospectsList.length})
            </h3>
            <div className="flex items-center gap-2">
              <Link
                to={`/app/prospects?campaign=${campaign._id}`}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>Open in Outreach Database</span>
                <ArrowRight size={13} />
              </Link>
              <button
                onClick={() => setShowAddProspectModal(true)}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"
              >
                <Plus size={13} /> Add Prospect
              </button>
            </div>
          </div>

          {prospectsLoading ? (
            <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
              Loading campaign prospects...
            </div>
          ) : prospectsList.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <Users size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-semibold text-gray-800">No prospects added to this campaign yet</p>
              <p className="text-xs text-gray-400 mb-4">
                Import from Data Cleaning, run the AI Scraper, or add manually.
              </p>
              <button
                onClick={() => setShowAddProspectModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
              >
                Add First Prospect
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs divide-y divide-gray-100">
              {prospectsList.map((p) => (
                <div key={p._id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{p.domain}</p>
                    <p className="text-gray-500 text-[11px] truncate">
                      {p.contactName || 'No contact'} {p.contactEmail ? `• ${p.contactEmail}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {p.metrics?.dr ? (
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold text-[11px]">
                        DR {p.metrics.dr}
                      </span>
                    ) : null}

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: WON LINKS ───────────────────────────────────────────────── */}
      {activeTab === 'links' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Live Won Backlinks ({linksList.length})
              </h3>
              <p className="text-xs text-gray-400">Backlinks secured and live for this campaign</p>
            </div>
            <button
              onClick={() => setShowAddLinkModal(true)}
              className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
            >
              <Award size={14} /> Log Won Link
            </button>
          </div>

          {linksLoading ? (
            <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
              Loading won backlinks...
            </div>
          ) : linksList.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <Award size={26} className="mx-auto text-emerald-600 mb-2" />
              <p className="text-sm font-bold text-gray-800">No won links logged yet</p>
              <p className="text-xs text-gray-400 mb-4">
                When a publication publishes your guest post or link insertion, log it here.
              </p>
              <button
                onClick={() => setShowAddLinkModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
              >
                Log First Link
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs divide-y divide-gray-100">
              {linksList.map((l) => (
                <div key={l._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <a
                        href={l.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-gray-900 hover:text-indigo-600 hover:underline flex items-center gap-1 truncate"
                      >
                        <span>{l.sourceUrl}</span>
                        <ExternalLink size={11} />
                      </a>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {l.rel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                      {l.anchorText && <span>Anchor: <strong>"{l.anchorText}"</strong></span>}
                      {l.targetUrl && <span>Target: {l.targetUrl}</span>}
                      <span>•</span>
                      <span>Live date: {new Date(l.liveDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <span className="font-extrabold text-gray-900 text-sm">
                        ${l.cost || 0}
                      </span>
                      <div className="text-[10px] text-gray-400">Cost</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Log Won Link Modal ─────────────────────────────────────────────── */}
      {showAddLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddLinkModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Award size={18} className="text-emerald-600" />
                <span>Log Won Link</span>
              </h3>
              <button onClick={() => setShowAddLinkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as any
                addLinkMutation.mutate({
                  sourceUrl: form.sourceUrl.value.trim(),
                  targetUrl: form.targetUrl.value.trim(),
                  anchorText: form.anchorText.value.trim(),
                  rel: form.rel.value,
                  cost: parseFloat(form.cost.value) || 0,
                  liveDate: form.liveDate.value || new Date().toISOString(),
                  notes: form.notes.value.trim(),
                })
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Source URL (where link is published) <span className="text-rose-500">*</span>
                </label>
                <input
                  name="sourceUrl"
                  type="url"
                  required
                  placeholder="https://forbes.com/blog/best-saas-guide"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target URL</label>
                <input
                  name="targetUrl"
                  type="url"
                  placeholder="https://myclient.com/product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Anchor Text</label>
                  <input
                    name="anchorText"
                    type="text"
                    placeholder="e.g. outreach software"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Link Rel</label>
                  <select
                    name="rel"
                    defaultValue="dofollow"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="dofollow">DoFollow</option>
                    <option value="nofollow">NoFollow</option>
                    <option value="sponsored">Sponsored</option>
                    <option value="ugc">UGC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cost ($)</label>
                  <input
                    name="cost"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Live Date</label>
                  <input
                    name="liveDate"
                    type="date"
                    defaultValue={new Date().toISOString().substring(0, 10)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Notes, publisher contact, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLinkModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLinkMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {addLinkMutation.isPending ? 'Logging...' : 'Save Won Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Prospect Modal ─────────────────────────────────────────────── */}
      {showAddProspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddProspectModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Add Prospect to Campaign</h3>
              <button onClick={() => setShowAddProspectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as any
                addProspectMutation.mutate({
                  domain: form.domain.value.trim(),
                  contactName: form.contactName.value.trim(),
                  contactEmail: form.contactEmail.value.trim(),
                  metrics: { dr: parseInt(form.dr.value, 10) || 0, traffic: 0 },
                })
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Domain <span className="text-rose-500">*</span>
                </label>
                <input
                  name="domain"
                  type="text"
                  required
                  placeholder="e.g. techradar.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Name</label>
                  <input
                    name="contactName"
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Domain Rating (DR)</label>
                  <input
                    name="dr"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contact Email</label>
                <input
                  name="contactEmail"
                  type="email"
                  placeholder="editor@techradar.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProspectModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addProspectMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addProspectMutation.isPending ? 'Adding...' : 'Add Prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ──────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Campaign?</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to permanently delete <strong>{campaign.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
