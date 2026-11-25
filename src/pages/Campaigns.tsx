import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Target,
  ChevronRight,
  Calendar,
  Layers,
  Globe,
  DollarSign,
  Award,
  Users,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  ExternalLink,
  Briefcase,
  Play,
  Pause,
  CheckCircle2,
  RotateCcw,
  BarChart2,
} from 'lucide-react'
import api from '../api/client'
import { useClient } from '../context/ClientContext'

// ─── Types ───────────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'
export type CampaignType =
  | 'guest_post'
  | 'broken_link'
  | 'resource_page'
  | 'link_insertion'
  | 'digital_pr'
  | 'other'

export interface Campaign {
  _id: string
  name: string
  client: {
    _id: string
    name: string
    domain?: string
  }
  type: CampaignType
  targetUrls: string[]
  goalLinks: number
  budget: number
  startDate?: string
  endDate?: string
  status: CampaignStatus
  prospectsCount: number
  linksWon: number
  emailsSent: number
  replies: number
  totalSpend: number
  linksProgress: number
  budgetProgress: number
  createdAt: string
  updatedAt: string
}

const statusColors: Record<CampaignStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

const typeLabels: Record<CampaignType, string> = {
  guest_post: 'Guest Post',
  broken_link: 'Broken Link',
  resource_page: 'Resource Page',
  link_insertion: 'Link Insertion',
  digital_pr: 'Digital PR',
  other: 'Other Outreach',
}

export default function Campaigns() {
  const queryClient = useQueryClient()
  const { selectedClientId, clients } = useClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')
  const [localClientFilter, setLocalClientFilter] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Determine active client filter (global takes priority if selected, else local dropdown)
  const effectiveClientFilter = selectedClientId || localClientFilter

  // Fetch campaigns
  const { data, isLoading } = useQuery<{
    campaigns: Campaign[]
    pagination: { total: number; page: number; limit: number; totalPages: number }
  }>({
    queryKey: ['campaigns', effectiveClientFilter, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (effectiveClientFilter) params.append('client', effectiveClientFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search.trim()) params.append('search', search.trim())
      params.append('limit', '100')

      const res = await api.get(`/campaigns?${params.toString()}`)
      return res.data?.data
    },
  })

  const campaigns = data?.campaigns || []

  // Create Campaign Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/campaigns', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setShowAddModal(false)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to create campaign.')
    },
  })

  // Update Campaign Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await api.put(`/campaigns/${id}`, updates)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign-detail'] })
      setCampaignToEdit(null)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to update campaign.')
    },
  })

  // Delete Campaign Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/campaigns/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setCampaignToDelete(null)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to delete campaign.')
    },
  })

  // Summary Metrics
  const totalCampaigns = campaigns.length
  const activeCount = campaigns.filter((c) => c.status === 'active').length
  const totalGoal = campaigns.reduce((acc, c) => acc + (c.goalLinks || 0), 0)
  const totalWon = campaigns.reduce((acc, c) => acc + (c.linksWon || 0), 0)
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0)
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.totalSpend || 0), 0)

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Campaigns</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Organize link-building efforts with target goals, budgets, and real-time progress tracking.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shrink-0"
        >
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Campaign Error</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Campaigns</span>
            <Target size={15} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{totalCampaigns}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{activeCount} currently active</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Links Progress</span>
            <Award size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {totalWon} <span className="text-sm font-medium text-gray-400">/ {totalGoal}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${totalGoal > 0 ? Math.min(100, (totalWon / totalGoal) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Budget Spend</span>
            <DollarSign size={15} className="text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            ${totalSpend.toLocaleString()} <span className="text-sm font-medium text-gray-400">/ ${totalBudget.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all"
              style={{ width: `${totalBudget > 0 ? Math.min(100, (totalSpend / totalBudget) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Prospects in Play</span>
            <Users size={15} className="text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {campaigns.reduce((acc, c) => acc + (c.prospectsCount || 0), 0)}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Across active pipelines</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap justify-between bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-48 max-w-md">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Client Filter (shown if global client is not already locked) */}
          {!selectedClientId && (
            <select
              value={localClientFilter}
              onChange={(e) => setLocalClientFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Campaign List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-gray-100 rounded w-1/4" />
          <div className="h-16 bg-gray-50 rounded" />
          <div className="h-16 bg-gray-50 rounded" />
          <div className="h-16 bg-gray-50 rounded" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target size={26} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {search || statusFilter !== 'all' ? 'No matching campaigns' : 'No campaigns yet'}
          </h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search query or filters to find what you are looking for.'
              : 'Create your first outreach campaign to start organizing prospects and landing backlinks.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
          >
            <Plus size={15} /> New Campaign
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 divide-y divide-gray-100 overflow-hidden shadow-xs">
          {campaigns.map((camp) => (
            <div
              key={camp._id}
              className={`p-5 hover:bg-gray-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5 group ${
                camp.status === 'completed' ? 'bg-gray-50/40' : ''
              }`}
            >
              {/* Left Column: Info & Client */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                  <Link
                    to={`/app/campaigns/${camp._id}`}
                    className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors truncate"
                  >
                    {camp.name}
                  </Link>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColors[camp.status]}`}>
                    {camp.status}
                  </span>

                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-semibold">
                    {typeLabels[camp.type] || camp.type}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                  {camp.client ? (
                    <Link
                      to={`/app/clients/${camp.client._id}`}
                      className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
                    >
                      <Briefcase size={12} />
                      <span>{camp.client.name}</span>
                    </Link>
                  ) : (
                    <span className="text-gray-400 italic">No Client</span>
                  )}

                  {camp.targetUrls && camp.targetUrls.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-gray-600">{camp.targetUrls.length} target URL(s)</span>
                    </>
                  )}

                  {camp.startDate && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <Calendar size={11} />
                        {new Date(camp.startDate).toLocaleDateString()}
                        {camp.endDate ? ` - ${new Date(camp.endDate).toLocaleDateString()}` : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Middle Column: Progress Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full lg:w-96 shrink-0 text-xs">
                {/* Links Won vs Goal */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1">
                    <span>Links Goal</span>
                    <span className="text-gray-800 font-bold">
                      {camp.linksWon} / {camp.goalLinks || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${camp.linksProgress}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">{camp.linksProgress}% achieved</div>
                </div>

                {/* Budget vs Spend */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1">
                    <span>Budget</span>
                    <span className="text-gray-800 font-bold">
                      ${camp.totalSpend.toLocaleString()} / ${camp.budget?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${camp.budgetProgress}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">{camp.budgetProgress}% used</div>
                </div>

                {/* Prospects Count */}
                <div className="hidden sm:block">
                  <div className="text-[11px] font-semibold text-gray-500 mb-1">Prospects</div>
                  <div className="text-sm font-bold text-gray-800">{camp.prospectsCount}</div>
                  <div className="text-[10px] text-gray-400 mt-1">In campaign</div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
                {/* Quick Status Toggles */}
                {camp.status === 'completed' ? (
                  <button
                    onClick={() => updateMutation.mutate({ id: camp._id, updates: { status: 'active' } })}
                    title="Re-open Campaign"
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <RotateCcw size={15} />
                  </button>
                ) : camp.status === 'active' ? (
                  <button
                    onClick={() => updateMutation.mutate({ id: camp._id, updates: { status: 'paused' } })}
                    title="Pause Campaign"
                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Pause size={15} />
                  </button>
                ) : (
                  <button
                    onClick={() => updateMutation.mutate({ id: camp._id, updates: { status: 'active' } })}
                    title="Activate Campaign"
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Play size={15} />
                  </button>
                )}

                {/* Edit Button */}
                <button
                  onClick={() => setCampaignToEdit(camp)}
                  title="Edit Campaign"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 size={15} />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => setCampaignToDelete(camp)}
                  title="Delete Campaign"
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>

                {/* View Details */}
                <Link
                  to={`/app/campaigns/${camp._id}`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ml-1"
                  title="View Campaign Details"
                >
                  <ChevronRight size={17} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAddModal && (
        <CampaignFormModal
          title="New Campaign"
          clients={clients}
          initialData={{
            client: effectiveClientFilter || (clients[0]?._id ?? ''),
            name: '',
            type: 'guest_post',
            targetUrls: [],
            goalLinks: 10,
            budget: 1000,
            status: 'active',
          }}
          onClose={() => setShowAddModal(false)}
          onSubmit={(values) => createMutation.mutate(values)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit Campaign Modal */}
      {campaignToEdit && (
        <CampaignFormModal
          title="Edit Campaign"
          clients={clients}
          initialData={{
            client: campaignToEdit.client?._id || '',
            name: campaignToEdit.name,
            type: campaignToEdit.type,
            targetUrls: campaignToEdit.targetUrls || [],
            goalLinks: campaignToEdit.goalLinks,
            budget: campaignToEdit.budget,
            startDate: campaignToEdit.startDate ? campaignToEdit.startDate.substring(0, 10) : '',
            endDate: campaignToEdit.endDate ? campaignToEdit.endDate.substring(0, 10) : '',
            status: campaignToEdit.status,
          }}
          isReadOnlyCompleted={campaignToEdit.status === 'completed'}
          onReopen={() => {
            updateMutation.mutate({ id: campaignToEdit._id, updates: { status: 'active' } })
          }}
          onClose={() => setCampaignToEdit(null)}
          onSubmit={(values) => updateMutation.mutate({ id: campaignToEdit._id, updates: values })}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setCampaignToDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Campaign?</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to permanently delete <strong>{campaignToDelete.name}</strong>?
              This will remove the campaign record.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(campaignToDelete._id)}
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

// ─── Reusable Campaign Form Modal ─────────────────────────────────────────────

function CampaignFormModal({
  title,
  clients,
  initialData,
  isReadOnlyCompleted = false,
  onReopen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  title: string
  clients: any[]
  initialData: {
    client: string
    name: string
    type: CampaignType
    targetUrls: string[]
    goalLinks: number
    budget: number
    startDate?: string
    endDate?: string
    status: CampaignStatus
  }
  isReadOnlyCompleted?: boolean
  onReopen?: () => void
  onClose: () => void
  onSubmit: (values: any) => void
  isSubmitting: boolean
}) {
  const [client, setClient] = useState(initialData.client)
  const [name, setName] = useState(initialData.name)
  const [type, setType] = useState<CampaignType>(initialData.type)
  const [targetUrlsText, setTargetUrlsText] = useState(initialData.targetUrls.join('\n'))
  const [goalLinks, setGoalLinks] = useState(initialData.goalLinks || 0)
  const [budget, setBudget] = useState(initialData.budget || 0)
  const [startDate, setStartDate] = useState(initialData.startDate || '')
  const [endDate, setEndDate] = useState(initialData.endDate || '')
  const [status, setStatus] = useState<CampaignStatus>(initialData.status)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const urls = targetUrlsText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    onSubmit({
      client,
      name: name.trim(),
      type,
      targetUrls: urls,
      goalLinks: Number(goalLinks) || 0,
      budget: Number(budget) || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      status,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Completed campaign rule banner */}
        {isReadOnlyCompleted && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <span>Completed campaigns are read-only unless re-opened.</span>
            </div>
            {onReopen && (
              <button
                type="button"
                onClick={onReopen}
                className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700"
              >
                Re-open to Active
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Client <span className="text-rose-500">*</span>
            </label>
            <select
              required
              disabled={isReadOnlyCompleted}
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100"
            >
              <option value="" disabled>Select a client...</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.domain ? `(${c.domain})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Campaign Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isReadOnlyCompleted}
              placeholder="e.g. SaaS Authority Guest Posts Q4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Outreach Type</label>
              <select
                disabled={isReadOnlyCompleted}
                value={type}
                onChange={(e) => setType(e.target.value as CampaignType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100"
              >
                <option value="guest_post">Guest Post</option>
                <option value="broken_link">Broken Link</option>
                <option value="resource_page">Resource Page</option>
                <option value="link_insertion">Link Insertion</option>
                <option value="digital_pr">Digital PR</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Goal Links & Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Goal Links</label>
              <input
                type="number"
                min="0"
                disabled={isReadOnlyCompleted}
                value={goalLinks}
                onChange={(e) => setGoalLinks(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Budget ($)</label>
              <input
                type="number"
                min="0"
                disabled={isReadOnlyCompleted}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Start and End Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                disabled={isReadOnlyCompleted}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                disabled={isReadOnlyCompleted}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Target URLs */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Target URLs (URLs you want links pointing to)
            </label>
            <textarea
              rows={3}
              disabled={isReadOnlyCompleted}
              placeholder="https://example.com/blog/best-tools&#10;https://example.com/features"
              value={targetUrlsText}
              onChange={(e) => setTargetUrlsText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 resize-none font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">One URL per line.</p>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isReadOnlyCompleted || !name.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
