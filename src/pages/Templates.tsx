import { useState } from 'react'
import { Plus, Mail, Copy, Eye, Trash2, MoreHorizontal } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Template {
  id: string
  name: string
  campaignType: string
  subject: string
  body: string
  used: number
  replied: number
}

const mockTemplates: Template[] = []

const VARIABLES = ['{{first_name}}', '{{domain}}', '{{page_url}}', '{{target_url}}', '{{client_name}}', '{{my_name}}']

// ─── Component ───────────────────────────────────────────────────────────────

export default function Templates() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Email Templates</h2>
          <p className="text-sm text-gray-500 mt-0.5">Write once, personalise with variables, reuse forever.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Variables reference */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-indigo-700 mb-2">Available variables</p>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <code key={v} className="bg-white border border-indigo-200 text-indigo-700 text-xs px-2 py-1 rounded-lg font-mono">
              {v}
            </code>
          ))}
        </div>
      </div>

      {/* Template list */}
      {mockTemplates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Mail className="text-indigo-600" size={22} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No templates yet</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
            Create reusable email templates with dynamic variables for each prospect.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> New Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockTemplates.map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{t.name}</h3>
                  <p className="text-xs text-gray-500">{t.campaignType}</p>
                </div>
                <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                  <MoreHorizontal size={15} />
                </button>
              </div>
              <p className="text-xs font-medium text-gray-700 mb-1">Subject: {t.subject}</p>
              <p className="text-xs text-gray-500 line-clamp-2 mb-4">{t.body}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Used {t.used}×</span>
                  {t.used > 0 && <span className="text-green-600">{Math.round((t.replied / t.used) * 100)}% reply rate</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Preview">
                    <Eye size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Duplicate">
                    <Copy size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <TemplateModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function TemplateModal({ onClose }: { onClose: () => void }) {
  const [body, setBody] = useState('')

  const insertVar = (v: string) => setBody((b) => b + v)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <h3 className="text-base font-semibold text-gray-900 mb-5">New Template</h3>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
              <input type="text" placeholder="e.g. Guest Post Outreach" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option>Guest Post</option>
                <option>Broken Link</option>
                <option>Resource Page</option>
                <option>Link Insertion</option>
                <option>Digital PR</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input type="text" placeholder="e.g. Collaboration idea for {{domain}}" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Body *</label>
              <div className="flex flex-wrap gap-1">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVar(v)}
                    className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors font-mono"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Hi {{first_name}},\n\nI came across {{domain}} and loved your content on...\n\nBest,\n{{my_name}}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
