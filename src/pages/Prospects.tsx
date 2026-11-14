import { useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import {
  Plus,
  Search,
  Globe,
  Upload,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  Loader2,
  Download,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProspectStatus =
  | 'new'
  | 'contact_found'
  | 'email_sent'
  | 'followup_sent'
  | 'replied'
  | 'negotiating'
  | 'agreed'
  | 'link_live'
  | 'lost'

export interface Prospect {
  _id: string
  domain: string
  pageUrl?: string
  contactName?: string
  contactEmail?: string
  niche?: string
  country?: string
  metrics: {
    dr: number
    traffic: number
  }
  tags: string[]
  notes?: string
  status: ProspectStatus
  campaign?: {
    _id: string
    name: string
  }
  lastContactedAt?: string | null
  createdAt: string
}

export interface CampaignOption {
  _id: string
  name: string
  client?: {
    _id: string
    name: string
  }
}

export const statusColors: Record<ProspectStatus, string> = {
  new: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  contact_found: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  email_sent: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
  followup_sent: 'bg-violet-100 text-violet-700 hover:bg-violet-200',
  replied: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  negotiating: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  agreed: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  link_live: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
  lost: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
}

export const statusLabels: Record<ProspectStatus, string> = {
  new: 'New',
  contact_found: 'Contact Found',
  email_sent: 'Email Sent',
  followup_sent: 'Follow-up Sent',
  replied: 'Replied',
  negotiating: 'Negotiating',
  agreed: 'Agreed',
  link_live: 'Link Live',
  lost: 'Lost',
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Prospects() {
  const queryClient = useQueryClient()

  // Filter & Pagination States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | 'all'>('all')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 25

  // UI States
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [bulkTagInput, setBulkTagInput] = useState('')
  const [showBulkTagModal, setShowBulkTagModal] = useState(false)

  // 1. Fetch Prospects
  const { data: prospectsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['prospects', { page, limit, statusFilter, campaignFilter, search }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit }
      if (search.trim()) params.q = search.trim()
      if (statusFilter !== 'all') params.status = statusFilter
      if (campaignFilter !== 'all') params.campaign = campaignFilter

      const res = await api.get('/prospects', { params })
      return res.data.data
    },
  })

  // 2. Fetch Campaigns for dropdowns
  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: async () => {
      const res = await api.get('/campaigns?limit=100')
      return res.data.data.campaigns as CampaignOption[]
    },
  })

  const prospects: Prospect[] = prospectsData?.prospects || []
  const total = prospectsData?.pagination?.total || 0
  const totalPages = prospectsData?.pagination?.totalPages || 1
  const campaigns: CampaignOption[] = campaignsData || []

  // 3. Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProspectStatus }) => {
      await api.patch(`/prospects/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
    },
  })

  // 4. Delete Single Prospect Mutation
  const deleteProspectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/prospects/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
      setSelected((prev) => prev.filter((id) => id !== deleteProspectMutation.variables))
    },
  })

  // 5. Bulk Actions Mutation
  const bulkActionMutation = useMutation({
    mutationFn: async (payload: { action: 'status' | 'tag' | 'delete'; ids: string[]; status?: ProspectStatus; tag?: string }) => {
      const res = await api.post('/prospects/bulk', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
      setSelected([])
      setShowBulkTagModal(false)
      setBulkTagInput('')
    },
  })

  // Selection handlers
  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(prospects.map((p) => p._id))
    } else {
      setSelected([])
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDeleteSingle = (id: string, domain: string) => {
    if (window.confirm(`Are you sure you want to delete ${domain}?`)) {
      deleteProspectMutation.mutate(id)
    }
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selected.length} selected prospect(s)?`)) {
      bulkActionMutation.mutate({ action: 'delete', ids: selected })
    }
  }

  const handleBulkStatus = (status: ProspectStatus) => {
    bulkActionMutation.mutate({ action: 'status', ids: selected, status })
  }

  const handleBulkAddTag = () => {
    if (!bulkTagInput.trim()) return
    bulkActionMutation.mutate({ action: 'tag', ids: selected, tag: bulkTagInput.trim() })
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Prospects</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Your link-building outreach database — websites, metrics, and contacts you want links from.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload size={15} /> Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Prospect
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search domain, contact name, email, or niche…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        {/* Campaign Filter */}
        <select
          value={campaignFilter}
          onChange={(e) => {
            setCampaignFilter(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All Campaigns</option>
          {campaigns.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ProspectStatus | 'all')
            setPage(1)
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All Statuses</option>
          {(Object.keys(statusLabels) as ProspectStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Action Bar (Floating when items selected) */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold px-2 py-0.5 bg-indigo-200/80 rounded-md text-xs">
              {selected.length} selected
            </span>
            <span>of {total}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bulk Status Select */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleBulkStatus(e.target.value as ProspectStatus)
              }}
              className="px-2.5 py-1.5 text-xs font-medium border border-indigo-200 rounded-lg bg-white text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Move to Status…
              </option>
              {(Object.keys(statusLabels) as ProspectStatus[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>

            {/* Bulk Tag Button */}
            <button
              onClick={() => setShowBulkTagModal(true)}
              className="px-2.5 py-1.5 text-xs font-medium border border-indigo-200 rounded-lg bg-white text-indigo-900 hover:bg-indigo-100 transition-colors"
            >
              Add Tag…
            </button>

            {/* Bulk Delete Button */}
            <button
              onClick={handleBulkDelete}
              disabled={bulkActionMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={13} /> Delete
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelected([])}
              className="p-1 text-gray-500 hover:text-gray-700 ml-1 cursor-pointer"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-3" size={28} />
          <p className="text-sm text-gray-500">Loading prospects…</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
          <p className="font-semibold text-sm">Failed to load prospects</p>
          <p className="text-xs text-red-600 mt-1">{(error as any)?.message || 'Something went wrong.'}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : prospects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-14 text-center shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe className="text-indigo-600" size={26} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No prospects found</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || campaignFilter !== 'all'
              ? 'No prospects match your current search and filter criteria.'
              : 'Start your link-building workflow by adding target domains manually or importing a CSV file.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              <Upload size={15} /> Import CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={15} /> Add Prospect
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === prospects.length && prospects.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 hidden md:table-cell">Campaign</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Metrics</th>
                  <th className="px-4 py-3 hidden xl:table-cell">Tags</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prospects.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/70 transition-colors group">
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(p._id)}
                        onChange={() => toggleSelect(p._id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Domain */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{p.domain}</span>
                        <a
                          href={`https://${p.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Open website"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                      {p.pageUrl && (
                        <p className="text-xs text-gray-400 truncate max-w-xs" title={p.pageUrl}>
                          {p.pageUrl}
                        </p>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      {p.contactEmail ? (
                        <div className="flex items-center gap-1.5">
                          <div>
                            {p.contactName && <p className="text-gray-900 font-medium text-xs">{p.contactName}</p>}
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{p.contactEmail}</p>
                          </div>
                          <button
                            onClick={() => handleCopyEmail(p.contactEmail!, p._id)}
                            className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Copy email address"
                          >
                            {copiedId === p._id ? (
                              <Check size={14} className="text-green-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      ) : p.contactName ? (
                        <span className="text-xs text-gray-700">{p.contactName}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Campaign */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                        {p.campaign?.name || 'Unassigned'}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            id: p._id,
                            status: e.target.value as ProspectStatus,
                          })
                        }
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                          statusColors[p.status]
                        }`}
                      >
                        {(Object.keys(statusLabels) as ProspectStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Metrics */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div>
                          <span className="text-gray-400">DR:</span>{' '}
                          <span className="font-semibold">{p.metrics?.dr ?? 0}</span>
                        </div>
                        {p.metrics?.traffic ? (
                          <div className="text-gray-400">
                            Traffic: {p.metrics.traffic.toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {p.tags && p.tags.length > 0 ? (
                          p.tags.map((t) => (
                            <span
                              key={t}
                              className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteSingle(p._id, p.domain)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete prospect"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            <div>
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-medium">{total}</span> prospects
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prospect Modal */}
      {showAddModal && (
        <AddProspectModal
          campaigns={campaigns}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            queryClient.invalidateQueries({ queryKey: ['prospects'] })
          }}
        />
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <ImportCSVModal
          campaigns={campaigns}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['prospects'] })
          }}
        />
      )}

      {/* Bulk Add Tag Modal */}
      {showBulkTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Add Tag to Selected</h3>
            <p className="text-xs text-gray-500 mb-4">
              Apply a new tag to {selected.length} selected prospect(s).
            </p>
            <input
              type="text"
              placeholder="e.g. guest-post, finance, high-priority"
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulkTagModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkAddTag}
                disabled={!bulkTagInput.trim() || bulkActionMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {bulkActionMutation.isPending ? 'Adding…' : 'Apply Tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add Prospect Modal ──────────────────────────────────────────────────────

function AddProspectModal({
  campaigns,
  onClose,
  onSuccess,
}: {
  campaigns: CampaignOption[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [campaign, setCampaign] = useState(campaigns[0]?._id || '')
  const [newCampaignName, setNewCampaignName] = useState('')
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [domain, setDomain] = useState('')
  const [pageUrl, setPageUrl] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [niche, setNiche] = useState('')
  const [country, setCountry] = useState('')
  const [dr, setDr] = useState<number | ''>('')
  const [traffic, setTraffic] = useState<number | ''>('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleQuickCreateCampaign = async () => {
    if (!newCampaignName.trim()) return
    setCreatingCampaign(true)
    setError(null)
    try {
      const res = await api.post('/campaigns', {
        name: newCampaignName.trim(),
        type: 'guest_post',
      })
      if (res.data.success && res.data.data.campaign) {
        const created = res.data.data.campaign
        campaigns.push(created)
        setCampaign(created._id)
        setNewCampaignName('')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create campaign.')
    } finally {
      setCreatingCampaign(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!domain.trim()) {
      setError('Domain is required.')
      return
    }
    if (!campaign) {
      setError('Please select or create a campaign first.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const tagList = tags
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean)

      const res = await api.post('/prospects', {
        campaign,
        domain: domain.trim(),
        pageUrl: pageUrl.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        niche: niche.trim(),
        country: country.trim(),
        dr: dr !== '' ? Number(dr) : 0,
        traffic: traffic !== '' ? Number(traffic) : 0,
        tags: tagList,
        notes: notes.trim(),
      })

      if (res.data.success) {
        if (res.data.data.warning) {
          alert(`Prospect saved with warning:\n${res.data.data.warning}`)
        }
        onSuccess()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save prospect.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add Target Prospect</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Campaign selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Campaign *
              </label>
            </div>
            {campaigns.length === 0 ? (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-2">
                <p className="font-medium">No campaigns found. Create one now to organize your prospects:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Q1 Link Outreach"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-indigo-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleQuickCreateCampaign}
                    disabled={creatingCampaign || !newCampaignName.trim()}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {creatingCampaign ? 'Creating…' : '+ Create'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <select
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {campaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Or type new campaign name…"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    className="flex-1 px-2.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleQuickCreateCampaign}
                    disabled={creatingCampaign || !newCampaignName.trim()}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium disabled:opacity-50 transition-colors"
                  >
                    {creatingCampaign ? 'Adding…' : '+ Add'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Domain */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Website Domain or URL *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. techcrunch.com or https://techcrunch.com/article"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Domain is automatically normalised (e.g. https://www.Example.com/blog becomes example.com).
            </p>
          </div>

          {/* Specific Target Page URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Specific Page URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/resources/best-tools"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Contact info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                placeholder="Sarah Connor"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                placeholder="editor@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Domain Rating (DR)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="55"
                value={dr}
                onChange={(e) => setDr(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Monthly Traffic
              </label>
              <input
                type="number"
                min={0}
                placeholder="25000"
                value={traffic}
                onChange={(e) => setTraffic(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Niche & Country */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Niche / Category
              </label>
              <input
                type="text"
                placeholder="SaaS / FinTech"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Country
              </label>
              <input
                type="text"
                placeholder="US / UK"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. guest-post, tech, verified-contact"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Any outreach context, pitching angle, or past history…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || campaigns.length === 0}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {loading ? 'Saving…' : 'Save Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Import CSV Modal ────────────────────────────────────────────────────────

function ImportCSVModal({
  campaigns,
  onClose,
  onSuccess,
}: {
  campaigns: CampaignOption[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [campaign, setCampaign] = useState(campaigns[0]?._id || '')
  const [newCampaignName, setNewCampaignName] = useState('')
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<any | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleQuickCreateCampaign = async () => {
    if (!newCampaignName.trim()) return
    setCreatingCampaign(true)
    setError(null)
    try {
      const res = await api.post('/campaigns', {
        name: newCampaignName.trim(),
        type: 'guest_post',
      })
      if (res.data.success && res.data.data.campaign) {
        const created = res.data.data.campaign
        campaigns.push(created)
        setCampaign(created._id)
        setNewCampaignName('')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create campaign.')
    } finally {
      setCreatingCampaign(false)
    }
  }

  const handleDownloadSample = () => {
    const csvContent =
      'domain,page_url,contact_name,contact_email,niche,country,dr,traffic,tags\n' +
      'hubspot.com,https://blog.hubspot.com/marketing/seo,Dharmesh Shah,editor@hubspot.com,Marketing,US,92,500000,"seo, inbound"\n' +
      'searchenginejournal.com,,Roger Montti,roger@searchenginejournal.com,SEO,US,89,320000,"seo, tech"\n'

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'prospects_sample_import.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a .csv file.')
      return
    }
    if (!campaign) {
      setError('Please select a campaign for this import.')
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('campaign', campaign)

    try {
      const res = await api.post('/prospects/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (res.data.success) {
        setSummary(res.data.data.summary)
        onSuccess()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'CSV Import failed. Check file structure.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Import Prospects from CSV</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {summary ? (
          // Result Summary Screen
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Import Completed Successfully!</p>
                <p className="text-xs text-emerald-700">
                  Your prospect list was processed according to MVP business rules.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xl font-bold text-indigo-600">{summary.imported}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Imported</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xl font-bold text-amber-600">{summary.duplicatesSkipped}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Duplicates</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xl font-bold text-rose-600">{summary.blacklistedSkipped}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Blacklisted</p>
              </div>
            </div>

            {summary.invalidRows && summary.invalidRows.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Invalid Rows Skipped ({summary.invalidRowsCount}):
                </p>
                <div className="max-h-36 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs space-y-1">
                  {summary.invalidRows.map((inv: any, idx: number) => (
                    <div key={idx} className="text-red-600">
                      Row {inv.row}: {inv.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Close & View Prospects
            </button>
          </div>
        ) : (
          // Upload Form
          <form className="space-y-4" onSubmit={handleUpload}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Campaign Select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Assign to Campaign *
              </label>
              {campaigns.length === 0 ? (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-2">
                  <p className="font-medium">No campaigns found. Create one now to organize your prospects:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Q1 Link Outreach"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-indigo-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleQuickCreateCampaign}
                      disabled={creatingCampaign || !newCampaignName.trim()}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {creatingCampaign ? 'Creating…' : '+ Create'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {campaigns.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Or type new campaign name…"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      className="flex-1 px-2.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleQuickCreateCampaign}
                      disabled={creatingCampaign || !newCampaignName.trim()}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium disabled:opacity-50 transition-colors"
                    >
                      {creatingCampaign ? 'Adding…' : '+ Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* File Drag & Drop / Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Upload CSV File *
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-indigo-50/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0])
                    }
                  }}
                />
                <FileText className="mx-auto text-indigo-600 mb-2" size={28} />
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB — Click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Click to browse or drag & drop CSV here
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Up to 5 MB (max 5,000 rows)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Helper & sample CSV link */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>Required column: <strong>domain</strong></span>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-medium cursor-pointer"
              >
                <Download size={13} /> Download Sample CSV
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !file || campaigns.length === 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {loading ? 'Processing…' : 'Start Import'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
