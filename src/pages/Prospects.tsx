import { useState } from 'react'
import { Plus, Search, Globe, Upload, Tag, ChevronRight, Filter } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ProspectStatus =
  | 'new' | 'contact_found' | 'email_sent' | 'followup_sent'
  | 'replied' | 'negotiating' | 'agreed' | 'link_live' | 'lost'

interface Prospect {
  id: string
  domain: string
  contactName: string
  contactEmail: string
  status: ProspectStatus
  tags: string[]
  dr: number
  campaign: string
  lastContacted: string | null
}

const mockProspects: Prospect[] = []

const statusColors: Record<ProspectStatus, string> = {
  new:           'bg-gray-100 text-gray-600',
  contact_found: 'bg-blue-100 text-blue-700',
  email_sent:    'bg-indigo-100 text-indigo-700',
  followup_sent: 'bg-violet-100 text-violet-700',
  replied:       'bg-yellow-100 text-yellow-700',
  negotiating:   'bg-orange-100 text-orange-700',
  agreed:        'bg-teal-100 text-teal-700',
  link_live:     'bg-green-100 text-green-700',
  lost:          'bg-red-100 text-red-600',
}

const statusLabels: Record<ProspectStatus, string> = {
  new:           'New',
  contact_found: 'Contact Found',
  email_sent:    'Email Sent',
  followup_sent: 'Follow-up Sent',
  replied:       'Replied',
  negotiating:   'Negotiating',
  agreed:        'Agreed',
  link_live:     'Link Live',
  lost:          'Lost',
}

export default function Prospects() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const filtered = mockProspects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (search && !p.domain.toLowerCase().includes(search.toLowerCase()) &&
        !p.contactName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleSelect = (id: string) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Prospects</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your prospect database — websites and contacts you want links from.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <Upload size={15} /> Import CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Add Prospect
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search domain or contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProspectStatus | 'all')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All statuses</option>
          {(Object.keys(statusLabels) as ProspectStatus[]).map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
        {selected.length > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-sm text-indigo-700">
            <span>{selected.length} selected</span>
            <button className="font-medium hover:underline">Change status</button>
            <button className="font-medium hover:underline text-red-600">Delete</button>
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Globe className="text-indigo-600" size={22} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No prospects yet</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
            Add prospects manually or import a CSV file. Duplicate domains are detected automatically.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              <Upload size={15} /> Import CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={15} /> Add Prospect
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Domain</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Campaign</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Tags</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{p.domain}</span>
                    {p.dr > 0 && <span className="ml-2 text-xs text-gray-400">DR {p.dr}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.contactName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.campaign}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {p.tags.map((t) => (
                        <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight size={16} className="text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <ProspectModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ProspectModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Add Prospect</h3>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain / URL *</label>
            <input type="text" placeholder="e.g. example.com or https://example.com/page" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-xs text-gray-400 mt-1">Domain will be normalised automatically.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign *</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">Select campaign…</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input type="text" placeholder="Jane Smith" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" placeholder="jane@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DR (Ahrefs)</label>
              <input type="number" placeholder="45" min={0} max={100} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input type="text" placeholder="US" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input type="text" placeholder="e.g. finance, high-dr (comma separated)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
              Save Prospect
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
