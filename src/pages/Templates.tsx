import { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Mail,
  Copy,
  Eye,
  Trash2,
  Edit2,
  Search,
  Check,
  AlertTriangle,
  X,
  Sparkles,
  BarChart2,
  Send,
  Users,
  ExternalLink,
  Code2,
  RotateCcw,
  Tag,
  Briefcase,
} from 'lucide-react'
import api from '../api/client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmailTemplate {
  _id: string
  name: string
  campaignType: string
  subject: string
  body: string
  stats: {
    used: number
    replied: number
  }
  createdAt: string
  updatedAt: string
}

interface ProspectOption {
  _id: string
  domain: string
  contactName?: string
  contactEmail?: string
  campaign?: {
    _id: string
    name: string
  }
}

const TEMPLATE_VARIABLES = [
  { key: 'first_name',   label: 'First Name',   desc: "Contact's first name (e.g. Sarah)" },
  { key: 'contact_name', label: 'Full Name',    desc: "Contact's full name (e.g. Sarah Miller)" },
  { key: 'domain',       label: 'Domain',       desc: "Prospect website (e.g. techradar.com)" },
  { key: 'page_url',     label: 'Page URL',     desc: "Target article or blog post URL" },
  { key: 'target_url',   label: 'Target URL',   desc: "Your link target URL being pitched" },
  { key: 'client_name',  label: 'Client Name',  desc: "Your client or business name" },
  { key: 'my_name',      label: 'My Name',      desc: "Your sender account name" },
]

const campaignTypeLabels: Record<string, string> = {
  guest_post: 'Guest Post',
  broken_link: 'Broken Link',
  resource_page: 'Resource Page',
  link_insertion: 'Link Insertion',
  digital_pr: 'Digital PR',
  other: 'Other Outreach',
  general: 'General Outreach',
}

export default function Templates() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [templateToEdit, setTemplateToEdit] = useState<EmailTemplate | null>(null)
  const [templateToPreview, setTemplateToPreview] = useState<EmailTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null)
  const [copiedVar, setCopiedVar] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch templates from API
  const { data, isLoading } = useQuery<{ templates: EmailTemplate[] }>({
    queryKey: ['templates', search, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search.trim())
      if (typeFilter !== 'all') params.append('campaignType', typeFilter)
      params.append('limit', '100')

      const res = await api.get(`/templates?${params.toString()}`)
      return res.data?.data
    },
  })

  const templates = data?.templates || []

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/templates', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setShowAddModal(false)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to create template.')
    },
  })

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await api.put(`/templates/${id}`, updates)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setTemplateToEdit(null)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to update template.')
    },
  })

  // Duplicate template mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/templates/${id}/duplicate`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to duplicate template.')
    },
  })

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/templates/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setTemplateToDelete(null)
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to delete template.')
    },
  })

  // Metrics
  const totalTemplates = templates.length
  const totalUsed = templates.reduce((acc, t) => acc + (t.stats?.used || 0), 0)
  const totalReplied = templates.reduce((acc, t) => acc + (t.stats?.replied || 0), 0)
  const averageReplyRate = totalUsed > 0 ? Math.round((totalReplied / totalUsed) * 100) : 0

  const handleCopyVar = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedVar(token)
    setTimeout(() => setCopiedVar(null), 1800)
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Email Templates</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Write high-converting outreach copy once, personalise with dynamic variables, and track reply rates.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shrink-0"
        >
          <Plus size={15} /> New Template
        </button>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Template Notice</p>
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
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Total Templates
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{totalTemplates}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Reusable across campaigns</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Times Dispatched
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">{totalUsed}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Emails sent using templates</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Replies Logged
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{totalReplied}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Engaged prospect replies</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Average Reply Rate
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{averageReplyRate}%</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Overall conversion rate</div>
        </div>
      </div>

      {/* Variables Quick Reference Bar */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            <Code2 size={14} className="text-indigo-600" />
            <span>Supported Dynamic Variables (Click to copy)</span>
          </span>
          <span className="text-[11px] text-indigo-600 font-medium hidden sm:inline">
            Variables are automatically replaced when composing or previewing
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_VARIABLES.map((v) => {
            const token = `{{${v.key}}}`
            const isCopied = copiedVar === token
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => handleCopyVar(token)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  isCopied
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-400 hover:shadow-2xs'
                }`}
                title={v.desc}
              >
                <span>{token}</span>
                {isCopied ? <Check size={11} className="text-emerald-700" /> : <Copy size={11} className="text-indigo-400" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap justify-between bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates by name or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium"
        >
          <option value="all">All Campaign Types</option>
          <option value="guest_post">Guest Post</option>
          <option value="broken_link">Broken Link</option>
          <option value="resource_page">Resource Page</option>
          <option value="link_insertion">Link Insertion</option>
          <option value="digital_pr">Digital PR</option>
          <option value="general">General</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 bg-gray-100 rounded-2xl" />
          <div className="h-44 bg-gray-100 rounded-2xl" />
          <div className="h-44 bg-gray-100 rounded-2xl" />
          <div className="h-44 bg-gray-100 rounded-2xl" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={26} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {search || typeFilter !== 'all' ? 'No matching templates' : 'No templates yet'}
          </h3>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            {search || typeFilter !== 'all'
              ? 'Try modifying your search keywords or campaign type filter.'
              : 'Create your first personalized email template with dynamic prospect variables.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
          >
            <Plus size={15} /> Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => {
            const used = tpl.stats?.used || 0
            const replied = tpl.stats?.replied || 0
            const rate = used > 0 ? Math.round((replied / used) * 100) : 0

            return (
              <div
                key={tpl._id}
                className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                        {tpl.name}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 uppercase tracking-wider inline-block mt-1">
                        {campaignTypeLabels[tpl.campaignType] || tpl.campaignType}
                      </span>
                    </div>

                    {/* Stats Pill */}
                    <div className="flex items-center gap-2 shrink-0 text-right">
                      <span className="text-xs text-gray-500">Used {used}×</span>
                      {used > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rate}% reply
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subject line */}
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-3 text-xs">
                    <span className="font-bold text-gray-600">Subject: </span>
                    <span className="text-gray-900 font-medium">{tpl.subject}</span>
                  </div>

                  {/* Body Preview */}
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-wrap font-sans">
                    {tpl.body}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    Updated {new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Preview Button */}
                    <button
                      onClick={() => setTemplateToPreview(tpl)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Preview with Prospect Data"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>

                    {/* Duplicate Button */}
                    <button
                      onClick={() => duplicateMutation.mutate(tpl._id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Duplicate Template"
                    >
                      <Copy size={14} />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => setTemplateToEdit(tpl)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit Template"
                    >
                      <Edit2 size={14} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setTemplateToDelete(tpl)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Create / Edit Template Modal ───────────────────────────────────── */}
      {(showAddModal || templateToEdit) && (
        <TemplateFormModal
          title={templateToEdit ? 'Edit Template' : 'New Email Template'}
          initialData={
            templateToEdit
              ? {
                  name: templateToEdit.name,
                  campaignType: templateToEdit.campaignType,
                  subject: templateToEdit.subject,
                  body: templateToEdit.body,
                }
              : {
                  name: '',
                  campaignType: 'guest_post',
                  subject: 'Quick question about {{domain}}',
                  body: `Hi {{first_name}},\n\nI was reading your article on {{domain}} and loved your points. I recently published a piece covering {{target_url}} that your readers might find valuable.\n\nWould you be open to collaborating on a guest article or link insertion?\n\nBest regards,\n{{my_name}}`,
                }
          }
          onClose={() => {
            setShowAddModal(false)
            setTemplateToEdit(null)
          }}
          onSubmit={(values) => {
            if (templateToEdit) {
              updateMutation.mutate({ id: templateToEdit._id, updates: values })
            } else {
              createMutation.mutate(values)
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* ─── Live Preview Modal with Real Prospect (Acceptance Criteria) ─────── */}
      {templateToPreview && (
        <TemplatePreviewModal
          template={templateToPreview}
          onClose={() => setTemplateToPreview(null)}
        />
      )}

      {/* ─── Delete Confirmation Modal ──────────────────────────────────────── */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setTemplateToDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Template?</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to permanently delete <strong>{templateToDelete.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(templateToDelete._id)}
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

// ─── Template Form Modal With Inserter Buttons ───────────────────────────────

function TemplateFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  title: string
  initialData: { name: string; campaignType: string; subject: string; body: string }
  onClose: () => void
  onSubmit: (values: any) => void
  isSubmitting: boolean
}) {
  const [name, setName] = useState(initialData.name)
  const [campaignType, setCampaignType] = useState(initialData.campaignType)
  const [subject, setSubject] = useState(initialData.subject)
  const [body, setBody] = useState(initialData.body)

  const subjectInputRef = useRef<HTMLInputElement>(null)
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Insert variable into active field
  const handleInsertVariable = (token: string, target: 'subject' | 'body') => {
    if (target === 'subject') {
      const input = subjectInputRef.current
      if (input) {
        const start = input.selectionStart || subject.length
        const end = input.selectionEnd || subject.length
        const updated = subject.slice(0, start) + token + subject.slice(end)
        setSubject(updated)
        setTimeout(() => {
          input.focus()
          input.setSelectionRange(start + token.length, start + token.length)
        }, 10)
      } else {
        setSubject((s) => s + token)
      }
    } else {
      const textarea = bodyTextareaRef.current
      if (textarea) {
        const start = textarea.selectionStart || body.length
        const end = textarea.selectionEnd || body.length
        const updated = body.slice(0, start) + token + body.slice(end)
        setBody(updated)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + token.length, start + token.length)
        }, 10)
      } else {
        setBody((b) => b + token)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: name.trim(),
      campaignType,
      subject: subject.trim(),
      body: body.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Template Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Guest Post Pitch v1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Campaign Type</label>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="guest_post">Guest Post</option>
                <option value="broken_link">Broken Link</option>
                <option value="resource_page">Resource Page</option>
                <option value="link_insertion">Link Insertion</option>
                <option value="digital_pr">Digital PR</option>
                <option value="general">General</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                Subject Line <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">Insert variable into Subject:</span>
            </div>

            {/* Quick variable insert chips for Subject */}
            <div className="flex flex-wrap gap-1 mb-1.5">
              {TEMPLATE_VARIABLES.slice(0, 3).map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => handleInsertVariable(`{{${v.key}}}`, 'subject')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 transition-colors"
                >
                  + &#123;&#123;{v.key}&#125;&#125;
                </button>
              ))}
            </div>

            <input
              ref={subjectInputRef}
              type="text"
              required
              placeholder="e.g. Content contribution for {{domain}}"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                Email Body <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">Insert variable into Body:</span>
            </div>

            {/* Quick variable insert chips for Body */}
            <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => handleInsertVariable(`{{${v.key}}}`, 'body')}
                  className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-700 shadow-2xs transition-colors"
                >
                  + &#123;&#123;{v.key}&#125;&#125;
                </button>
              ))}
            </div>

            <textarea
              ref={bodyTextareaRef}
              rows={8}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email body here. Use {{first_name}}, {{domain}}, etc."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-sans leading-relaxed"
            />
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
              disabled={isSubmitting || !name.trim() || !subject.trim() || !body.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Live Preview Modal With Real Prospect Data ───────────────────────────────

function TemplatePreviewModal({
  template,
  onClose,
}: {
  template: EmailTemplate
  onClose: () => void
}) {
  const [selectedProspectId, setSelectedProspectId] = useState<string>('')
  const [copiedSubject, setCopiedSubject] = useState(false)
  const [copiedBody, setCopiedBody] = useState(false)

  // Fetch real prospects for preview selection
  const { data: prospectsData } = useQuery<{ prospects: ProspectOption[] }>({
    queryKey: ['prospects-for-preview'],
    queryFn: async () => {
      const res = await api.get('/prospects?limit=50')
      return res.data?.data
    },
  })

  const availableProspects = prospectsData?.prospects || []

  // Fetch rendered preview from server endpoint
  const { data: previewData, isLoading } = useQuery({
    queryKey: ['template-preview', template._id, selectedProspectId],
    queryFn: async () => {
      const res = await api.post(`/templates/${template._id}/preview`, {
        prospectId: selectedProspectId || undefined,
      })
      return res.data?.data
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Eye size={18} className="text-indigo-600" />
              <span>Template Preview: {template.name}</span>
            </h3>
            <p className="text-xs text-gray-500">Live test render with workspace prospect data</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Prospect Selector */}
        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Preview with Prospect:
          </label>
          <select
            value={selectedProspectId}
            onChange={(e) => setSelectedProspectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Sample Data (Default Test Contact)</option>
            {availableProspects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.domain} {p.contactName ? `(${p.contactName})` : '(No contact name)'}
              </option>
            ))}
          </select>
        </div>

        {/* Missing Variables Warning Banner (Acceptance Criterion) */}
        {previewData?.warnings && previewData.warnings.length > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-800 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <span>Variable Warning Notice:</span>
            </div>
            <ul className="list-disc pl-5 text-[11px] space-y-0.5">
              {previewData.warnings.map((w: string, idx: number) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400 animate-pulse">
            Rendering template variables...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rendered Subject */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                  Rendered Subject
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewData?.renderedSubject || '')
                    setCopiedSubject(true)
                    setTimeout(() => setCopiedSubject(false), 2000)
                  }}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  {copiedSubject ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedSubject ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-900 break-words">
                {previewData?.renderedSubject}
              </p>
            </div>

            {/* Rendered Body */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                  Rendered Message Body
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewData?.renderedBody || '')
                    setCopiedBody(true)
                    setTimeout(() => setCopiedBody(false), 2000)
                  }}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  {copiedBody ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedBody ? 'Copied Body' : 'Copy Body'}</span>
                </button>
              </div>
              <div className="p-3 bg-gray-50/60 rounded-lg border border-gray-100 text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                {previewData?.renderedBody}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
