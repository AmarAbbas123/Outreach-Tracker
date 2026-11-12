import { useState } from 'react'
import { Plus, Link2, ExternalLink, Download, CheckCircle2, XCircle } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type LinkStatus = 'pending' | 'live' | 'lost'
type LinkRel = 'dofollow' | 'nofollow' | 'sponsored' | 'ugc'

interface WonLink {
  id: string
  sourceUrl: string
  targetUrl: string
  anchorText: string
  rel: LinkRel
  status: LinkStatus
  cost: number
  liveDate: string
  campaign: string
}

const mockLinks: WonLink[] = []

const statusColors: Record<LinkStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  live:    'bg-green-100 text-green-700',
  lost:    'bg-red-100 text-red-600',
}

const relColors: Record<LinkRel, string> = {
  dofollow:  'bg-indigo-100 text-indigo-700',
  nofollow:  'bg-gray-100 text-gray-600',
  sponsored: 'bg-orange-100 text-orange-700',
  ugc:       'bg-purple-100 text-purple-700',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Links() {
  const [statusFilter, setStatusFilter] = useState<LinkStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)

  const filtered = mockLinks.filter((l) =>
    statusFilter === 'all' ? true : l.status === statusFilter
  )

  const totalCost = filtered.reduce((s, l) => s + l.cost, 0)
  const liveCount = mockLinks.filter((l) => l.status === 'live').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Won Links</h2>
          <p className="text-sm text-gray-500 mt-0.5">Every link you've earned — with cost, status, and anchor text.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Log Link
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Links', value: mockLinks.length },
          { label: 'Live Links', value: liveCount },
          { label: 'Total Cost', value: `$${totalCost.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['all', 'live', 'pending', 'lost'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Link list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Link2 className="text-green-600" size={22} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No links logged yet</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
            Log won links manually here, or they'll be created automatically when you move a prospect to Link Live in the pipeline.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Log Link
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source URL</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Anchor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Campaign</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Rel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Cost</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <a href={l.sourceUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 max-w-xs truncate">
                      {l.sourceUrl} <ExternalLink size={11} className="shrink-0" />
                    </a>
                    <p className="text-xs text-gray-400">{l.liveDate}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{l.anchorText}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{l.campaign}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[l.status]}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${relColors[l.rel]}`}>
                      {l.rel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden xl:table-cell">
                    {l.cost > 0 ? `$${l.cost}` : 'Free'}
                  </td>
                  <td className="px-4 py-3">
                    <ExternalLink size={14} className="text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <LinkModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function LinkModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Log Won Link</h3>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source URL *</label>
            <input type="url" placeholder="https://example.com/page-with-link" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target URL *</label>
            <input type="url" placeholder="https://your-site.com/page" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anchor Text</label>
              <input type="text" placeholder="e.g. best SEO tool" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rel Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="dofollow">Dofollow</option>
                <option value="nofollow">Nofollow</option>
                <option value="sponsored">Sponsored</option>
                <option value="ugc">UGC</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
              <input type="number" placeholder="0" min={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Live Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">Select campaign…</option>
            </select>
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
              Save Link
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
