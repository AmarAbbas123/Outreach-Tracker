import { useState } from 'react'
import { Plus, KanbanSquare, List } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage = {
  key: string
  label: string
  color: string
  dot: string
}

const STAGES: Stage[] = [
  { key: 'new',           label: 'New',           color: 'bg-gray-50 border-gray-200',    dot: 'bg-gray-400' },
  { key: 'contact_found', label: 'Contact Found', color: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-500' },
  { key: 'email_sent',    label: 'Email Sent',    color: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
  { key: 'followup_sent', label: 'Follow-up Sent',color: 'bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
  { key: 'replied',       label: 'Replied',       color: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  { key: 'negotiating',   label: 'Negotiating',   color: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  { key: 'agreed',        label: 'Agreed',        color: 'bg-teal-50 border-teal-200',    dot: 'bg-teal-500' },
  { key: 'link_live',     label: 'Link Live',     color: 'bg-green-50 border-green-200',  dot: 'bg-green-500' },
]

type ViewMode = 'kanban' | 'table'

export default function Pipeline() {
  const [view, setView] = useState<ViewMode>('kanban')
  const [campaignFilter, setCampaignFilter] = useState('all')

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Pipeline</h2>
          <p className="text-sm text-gray-500 mt-0.5">Drag prospects through 8 stages from New to Link Live.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Campaign filter */}
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All campaigns</option>
          </select>
          {/* View toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Kanban view"
            >
              <KanbanSquare size={16} />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Table view"
            >
              <List size={16} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Add Prospect
          </button>
        </div>
      </div>

      {/* Kanban board */}
      {view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              className={`min-w-[200px] max-w-[200px] border rounded-xl p-3 flex flex-col gap-2 ${stage.color}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                </div>
                <span className="text-xs text-gray-400 bg-white/80 rounded-full px-2 py-0.5 font-medium">0</span>
              </div>
              {/* Drop zone */}
              <div className="min-h-32 rounded-lg border-2 border-dashed border-white/80 flex items-center justify-center">
                <span className="text-xs text-gray-300">Empty</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Domain</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Campaign</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Last Contacted</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  No prospects in the pipeline yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
