import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Globe,
  Target,
  ChevronRight,
  ExternalLink,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Users,
  Award,
  AlertTriangle,
  X,
  CheckCircle2,
  Building,
} from 'lucide-react'
import api from '../api/client'
import { useClient, type Client } from '../context/ClientContext'

export default function Clients() {
  const queryClient = useQueryClient()
  const { refetchClients: refetchGlobalClients } = useClient()

  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  // Fetch clients from API
  const { data, isLoading, isError, refetch } = useQuery<{
    clients: Client[]
    pagination: { total: number; page: number; limit: number; totalPages: number }
  }>({
    queryKey: ['clients', search, showArchived],
    queryFn: async () => {
      const archivedParam = showArchived ? 'all' : 'false'
      const res = await api.get(`/clients?search=${encodeURIComponent(search)}&archived=${archivedParam}&limit=100`)
      return res.data?.data
    },
  })

  const clients = data?.clients || []

  // Add client mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; domain?: string; niche?: string; notes?: string }) => {
      const res = await api.post('/clients', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      refetchGlobalClients()
      setShowAddModal(false)
    },
  })

  // Edit client mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      const res = await api.put(`/clients/${id}`, updates)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client-detail'] })
      refetchGlobalClients()
      setClientToEdit(null)
    },
  })

  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/clients/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      refetchGlobalClients()
      setClientToDelete(null)
      setDeleteError(null)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to delete client.'
      setDeleteError(msg)
      setClientToDelete(null)
    },
  })

  // Calculate totals
  const totalClients = clients.length
  const totalCampaigns = clients.reduce((acc, c) => acc + (c.campaignCount || 0), 0)
  const totalProspects = clients.reduce((acc, c) => acc + (c.prospectsTotal || 0), 0)
  const totalWon = clients.reduce((acc, c) => acc + (c.linksWon || 0), 0)

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Clients</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Group your outreach campaigns and prospect databases by customer or target site.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shrink-0"
        >
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Delete error notification banner */}
      {deleteError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Cannot delete client</p>
              <p className="text-rose-700 mt-0.5">{deleteError}</p>
            </div>
          </div>
          <button onClick={() => setDeleteError(null)} className="text-rose-500 hover:text-rose-700">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Clients</span>
            <Building size={15} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{totalClients}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{showArchived ? 'Including archived' : 'Active clients'}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Campaigns</span>
            <Target size={15} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{totalCampaigns}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Across displayed clients</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Prospects</span>
            <Users size={15} className="text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{totalProspects}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Contacted & queued</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Won Links</span>
            <Award size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{totalWon}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Verified live backlinks</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap justify-between bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name, domain, or niche…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none px-2 py-1 rounded-md hover:bg-gray-50">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Show archived clients</span>
        </label>
      </div>

      {/* Loading & Client List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-gray-100 rounded w-1/4" />
          <div className="h-16 bg-gray-50 rounded" />
          <div className="h-16 bg-gray-50 rounded" />
          <div className="h-16 bg-gray-50 rounded" />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe size={26} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {search ? 'No matching clients found' : 'No clients yet'}
          </h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            {search
              ? `No clients matched "${search}". Try clearing your search filter.`
              : 'Add your first client or internal site to organize outreach campaigns and prospects.'}
          </p>
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
            >
              <Plus size={15} /> Add First Client
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 divide-y divide-gray-100 overflow-hidden shadow-xs">
          {clients.map((client) => (
            <div
              key={client._id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-4 hover:bg-gray-50/80 transition-colors gap-4 group ${
                client.isArchived ? 'opacity-70 bg-gray-50/50' : ''
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <Link
                  to={`/app/clients/${client._id}`}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform"
                >
                  {client.name.charAt(0).toUpperCase()}
                </Link>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/app/clients/${client._id}`}
                      className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors truncate"
                    >
                      {client.name}
                    </Link>
                    {client.isArchived && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        Archived
                      </span>
                    )}
                    {client.niche && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {client.niche}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                    {client.domain ? (
                      <a
                        href={`https://${client.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-gray-500 hover:text-indigo-600"
                      >
                        <Globe size={12} />
                        <span>{client.domain}</span>
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">No domain</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Metrics */}
              <div className="flex items-center gap-6 text-xs text-gray-500 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Target size={14} className="text-indigo-600" />
                  <span className="font-semibold text-gray-800">{client.campaignCount || 0}</span>
                  <span className="text-gray-400">campaigns</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-purple-600" />
                  <span className="font-semibold text-gray-800">{client.prospectsTotal || 0}</span>
                  <span className="text-gray-400">prospects</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Award size={14} className="text-emerald-600" />
                  <span className="font-semibold text-emerald-700">{client.linksWon || 0}</span>
                  <span className="text-gray-400">won</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                {/* Archive / Restore Button */}
                {client.isArchived ? (
                  <button
                    onClick={() => updateMutation.mutate({ id: client._id, updates: { isArchived: false } })}
                    title="Restore Client"
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <RotateCcw size={15} />
                  </button>
                ) : (
                  <button
                    onClick={() => updateMutation.mutate({ id: client._id, updates: { isArchived: true } })}
                    title="Archive Client"
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Archive size={15} />
                  </button>
                )}

                {/* Edit Button */}
                <button
                  onClick={() => setClientToEdit(client)}
                  title="Edit Client"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 size={15} />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => setClientToDelete(client)}
                  title="Delete Client"
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>

                {/* View Details Link */}
                <Link
                  to={`/app/clients/${client._id}`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors ml-1"
                  title="View Client Detail"
                >
                  <ChevronRight size={17} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <ClientFormModal
          title="Add New Client"
          initialData={{ name: '', domain: '', niche: '', notes: '' }}
          onClose={() => setShowAddModal(false)}
          onSubmit={(values) => createMutation.mutate(values)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit Client Modal */}
      {clientToEdit && (
        <ClientFormModal
          title="Edit Client"
          initialData={{
            name: clientToEdit.name,
            domain: clientToEdit.domain || '',
            niche: clientToEdit.niche || '',
            notes: clientToEdit.notes || '',
            isArchived: clientToEdit.isArchived,
          }}
          onClose={() => setClientToEdit(null)}
          onSubmit={(values) => updateMutation.mutate({ id: clientToEdit._id, updates: values })}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setClientToDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Client?</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to permanently delete <strong>{clientToDelete.name}</strong>?
              If this client has existing campaigns, deletion will be blocked and you should archive it instead.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(clientToDelete._id)}
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

// ─── Reusable Client Form Modal ───────────────────────────────────────────────

function ClientFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  title: string
  initialData: { name: string; domain?: string; niche?: string; notes?: string; isArchived?: boolean }
  onClose: () => void
  onSubmit: (values: any) => void
  isSubmitting: boolean
}) {
  const [name, setName] = useState(initialData.name)
  const [domain, setDomain] = useState(initialData.domain || '')
  const [niche, setNiche] = useState(initialData.niche || '')
  const [notes, setNotes] = useState(initialData.notes || '')
  const [isArchived, setIsArchived] = useState(initialData.isArchived || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
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
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
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
              placeholder="e.g. Acme Media Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Domain</label>
            <input
              type="text"
              placeholder="e.g. acmecorp.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Protocols (https://) and www are automatically normalised.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Niche / Industry</label>
            <input
              type="text"
              placeholder="e.g. SaaS, E-commerce, Healthcare"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              placeholder="Key notes, target anchor preferences, or goals…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {initialData.isArchived !== undefined && (
            <label className="flex items-center gap-2 text-xs text-gray-700 font-medium cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Archived client</span>
            </label>
          )}

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
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
