import { BarChart3, TrendingUp, Mail, Link2, Users, Target, DollarSign } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | 'month' | 'all'

const ranges: { key: DateRange; label: string }[] = [
  { key: '7d',    label: 'Last 7 days' },
  { key: '30d',   label: 'Last 30 days' },
  { key: 'month', label: 'This month' },
  { key: 'all',   label: 'All time' },
]

import { useState } from 'react'

export default function Reports() {
  const [range, setRange] = useState<DateRange>('30d')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track performance across all your campaigns.</p>
        </div>
        {/* Date range */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {ranges.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Emails Sent',     value: '0',  icon: Mail,       color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Replies',         value: '0',  icon: TrendingUp, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Links Won',       value: '0',  icon: Link2,      color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Spend',     value: '$0', icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className={`${bg} ${color} p-2.5 rounded-lg`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Derived metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Reply Rate',    value: '—', desc: 'replies / emails sent' },
          { label: 'Win Rate',      value: '—', desc: 'links won / replied' },
          { label: 'Cost Per Link', value: '—', desc: 'spend / links won' },
        ].map(({ label, value, desc }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Emails Sent & Replies — Daily</h3>
          <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
            <div className="text-center">
              <BarChart3 className="text-gray-300 mx-auto mb-2" size={28} />
              <p className="text-xs text-gray-400">Chart will appear once you log email activity.</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Outreach Funnel</h3>
          <div className="space-y-3">
            {[
              { label: 'Prospects',   color: 'bg-indigo-500' },
              { label: 'Contacted',   color: 'bg-blue-500' },
              { label: 'Replied',     color: 'bg-violet-500' },
              { label: 'Negotiating', color: 'bg-orange-500' },
              { label: 'Link Live',   color: 'bg-green-500' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{s.label}</span><span>0</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-full w-0 ${s.color} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Campaign Breakdown</h3>
        <div className="text-center py-8">
          <Target className="text-gray-300 mx-auto mb-2" size={28} />
          <p className="text-sm text-gray-400">No campaign data yet.</p>
          <p className="text-xs text-gray-400 mt-1">Create campaigns and start logging outreach to see per-campaign stats.</p>
        </div>
      </div>
    </div>
  )
}
