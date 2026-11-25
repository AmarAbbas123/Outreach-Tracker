import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  Target,
  Users,
  Award,
  Plus,
  Archive,
  RotateCcw,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  FileText,
  Percent,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react'
import api from '../api/client'
import { useClient } from '../context/ClientContext'

interface Campaign {
  _id: string
  name: string
  type: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  targetUrls?: string[]
  goalLinks?: number
  budget?: number
  startDate?: string
  endDate?: string
  prospectsCount?: number
  linksWon?: number
  createdAt: string
}

interface ClientDetailData {
  client: {
    _id: string
    name: string
    domain?: string
    niche?: string
    notes?: string
    isArchived: boolean
    campaignCount: number
    prospectsTotal: number
    linksWon: number
    createdAt: string
    updatedAt: string
  }
  campaigns: Campaign[]
  totals: {
    campaignsCount: number
    prospectsTotal: number
    linksWon: number
  }
}

const statusBadgeClasses: Record<string, string> = {
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

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refetchClients } = useClient()

  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Fetch client details with campaigns and totals
  const { data, isLoading, error } = useQuery<ClientDetailData>({
    queryKey: ['client-detail', id],
    queryFn: async () => {
      const res = await api.get(`/clients/${id}`)
      return res.data?.data
    },
    enabled: !!id,
  })

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: { name?: string; domain?: string; niche?: string; notes?: string; isArchived?: boolean }) => {
      const res = await api.put(`/clients/${id}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      refetchClients()
      setShowEditModal(false)
    },
  })

  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/clients/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      refetchClients()
      navigate('/app/clients')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to delete client.'
      setDeleteError(msg)
      setShowDeleteConfirm(false)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
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

  if (error || !data?.client) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">Client Not Found</h3>
        <p className="text-sm text-gray-500 mb-6">
          The requested client record does not exist or has been removed.
        </p>
        <Link
          to="/app/clients"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <ArrowLeft size={16} /> Back to Clients List
        </Link>
      </div>
    )
  }

  const { client, campaigns, totals } = data
  const winRate = totals.prospectsTotal > 0
    ? ((totals.linksWon / totals.prospectsTotal) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back link & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/app/clients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={14} /> Back to All Clients
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {client.isArchived ? (
            <button
              onClick={() => updateMutation.mutate({ isArchived: false })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <RotateCcw size={14} /> Restore Client
            </button>
          ) : (
            <button
              onClick={() => updateMutation.mutate({ isArchived: true })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Archive size={14} /> Archive Client
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

      {/* Delete error notification */}
      {deleteError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start justify-between gap-3 text-sm text-rose-800">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to delete client</p>
              <p className="text-xs text-rose-700 mt-0.5">{deleteError}</p>
            </div>
          </div>
          <button onClick={() => setDeleteError(null)} className="text-rose-500 hover:text-rose-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Client Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{client.name}</h2>
              {client.isArchived && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                  Archived
                </span>
              )}
              {client.niche && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {client.niche}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 flex-wrap">
              {client.domain ? (
                <a
                  href={`https://${client.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-indigo-600 hover:underline font-medium"
                >
                  <Globe size={13} />
                  <span>{client.domain}</span>
                  <ExternalLink size={11} />
                </a>
              ) : (
                <span className="text-gray-400 italic">No domain provided</span>
              )}
              <span>•</span>
              <span>Added on {new Date(client.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <Link
          to={`/app/campaigns`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all shrink-0"
        >
          <Plus size={14} /> New Campaign for Client
        </Link>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Campaigns</span>
            <Target size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{totals.campaignsCount}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Active & archived</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Prospects</span>
            <Users size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{totals.prospectsTotal}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Total across campaigns</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Won Links</span>
            <Award size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{totals.linksWon}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Verified live backlinks</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Link Win Rate</span>
            <Percent size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{winRate}%</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Won per prospect</div>
        </div>
      </div>

      {/* Client Notes Card (if present or empty) */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <FileText size={13} /> Client Notes & Requirements
          </h3>
          <button
            onClick={() => setShowEditModal(true)}
            className="text-xs text-indigo-600 hover:underline font-semibold"
          >
            {client.notes ? 'Edit Notes' : '+ Add Notes'}
          </button>
        </div>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {client.notes || <span className="text-gray-400 italic">No notes provided for this client.</span>}
        </p>
      </div>

      {/* Campaigns Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Campaigns ({campaigns.length})</h3>
            <p className="text-xs text-gray-500">Outreach efforts running for {client.name}</p>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Layers size={22} />
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">No campaigns created yet</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Create an outreach campaign for {client.name} to start finding prospects and tracking backlinks.
            </p>
            <Link
              to="/app/campaigns"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
            >
              <Plus size={14} /> Create Campaign
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs divide-y divide-gray-100">
            {campaigns.map((camp) => (
              <div key={camp._id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-gray-900 truncate">{camp.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadgeClasses[camp.status] || 'bg-gray-100 text-gray-700'}`}>
                      {camp.status.toUpperCase()}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                      {typeLabels[camp.type] || camp.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 flex-wrap">
                    <span>Goal: <strong className="text-gray-800">{camp.goalLinks || 0} links</strong></span>
                    <span>•</span>
                    <span>Prospects: <strong className="text-gray-800">{camp.prospectsCount || 0}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">Won: <strong>{camp.linksWon || 0}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/app/prospects?campaign=${camp._id}`}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    View Prospects
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      {showEditModal && (
        <EditClientModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => updateMutation.mutate(updated)}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Client?</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to permanently delete <strong>{client.name}</strong>?
              Note: Clients with existing campaigns cannot be deleted and must be archived instead.
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

function EditClientModal({
  client,
  onClose,
  onSave,
  isSaving,
}: {
  client: any
  onClose: () => void
  onSave: (payload: any) => void
  isSaving: boolean
}) {
  const [name, setName] = useState(client.name || '')
  const [domain, setDomain] = useState(client.domain || '')
  const [niche, setNiche] = useState(client.niche || '')
  const [notes, setNotes] = useState(client.notes || '')
  const [isArchived, setIsArchived] = useState(client.isArchived || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim(),
      domain: domain.trim(),
      niche: niche.trim(),
      notes: notes.trim(),
      isArchived,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Edit Client</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Client Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. acmecorp.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Niche / Industry</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. SaaS, Fintech, Legal"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Client requirements, link preferences, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-700 font-medium cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isArchived}
              onChange={(e) => setIsArchived(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Archive this client (hide from active selectors)</span>
          </label>

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
              disabled={isSaving || !name.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
