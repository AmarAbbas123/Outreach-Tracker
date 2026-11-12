import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Globe, Target, ChevronRight, MoreHorizontal } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
  domain: string
  niche: string
  campaigns: number
  prospectsTotal: number
  linksWon: number
  isArchived: boolean
}

// ─── Mock empty state data (will come from API) ───────────────────────────────

const mockClients: Client[] = []

// ─── Component ───────────────────────────────────────────────────────────────

export default function Clients() {
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const filtered = mockClients.filter((c) => {
    if (!showArchived && c.isArchived) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage the clients you are running outreach for.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Show archived
        </label>
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Globe className="text-indigo-600" size={22} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No clients yet</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
            Add your first client to start organising outreach campaigns.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Add Client
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {filtered.map((client) => (
            <div key={client.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0">
                  {client.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                  <p className="text-xs text-gray-500 truncate">{client.domain} · {client.niche}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="hidden sm:flex items-center gap-5 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Target size={12} /> {client.campaigns} campaigns</span>
                  <span>{client.prospectsTotal} prospects</span>
                  <span className="text-green-600 font-medium">{client.linksWon} links won</span>
                </div>
                <Link to={`/app/clients/${client.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {showModal && <ClientModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ─── Add Client Modal ─────────────────────────────────────────────────────────

function ClientModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Add Client</h3>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
            <input type="text" placeholder="e.g. Acme Corp" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <input type="text" placeholder="e.g. acmecorp.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niche</label>
            <input type="text" placeholder="e.g. SaaS, E-commerce" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} placeholder="Optional notes…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Save Client
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
