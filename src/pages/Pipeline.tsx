import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  KanbanSquare,
  List,
  Search,
  ExternalLink,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  X,
  Mail,
  Copy,
  Check,
  Tag,
  Briefcase,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react'
import api from '../api/client'
import { useClient } from '../context/ClientContext'

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

interface Prospect {
  _id: string
  domain: string
  pageUrl?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  niche?: string
  metrics?: { dr: number; traffic: number }
  tags?: string[]
  notes?: string
  status: ProspectStatus
  campaign?: {
    _id: string
    name: string
  }
  nextFollowUpAt?: string | null
  createdAt: string
  updatedAt: string
}

interface CampaignOption {
  _id: string
  name: string
  client?: {
    _id: string
    name: string
  }
}

interface Stage {
  key: ProspectStatus
  label: string
  color: string
  border: string
  dot: string
  badgeBg: string
}

const STAGES: Stage[] = [
  { key: 'new',           label: 'New',            color: 'bg-slate-50/80',   border: 'border-slate-200',  dot: 'bg-slate-400',   badgeBg: 'bg-slate-100 text-slate-700' },
  { key: 'contact_found', label: 'Contact Found',  color: 'bg-blue-50/50',    border: 'border-blue-200',   dot: 'bg-blue-500',    badgeBg: 'bg-blue-100 text-blue-700' },
  { key: 'email_sent',    label: 'Email Sent',     color: 'bg-indigo-50/50',  border: 'border-indigo-200', dot: 'bg-indigo-500',  badgeBg: 'bg-indigo-100 text-indigo-700' },
  { key: 'followup_sent', label: 'Follow-up Sent', color: 'bg-violet-50/50',  border: 'border-violet-200', dot: 'bg-violet-500',  badgeBg: 'bg-violet-100 text-violet-700' },
  { key: 'replied',       label: 'Replied',        color: 'bg-amber-50/50',   border: 'border-amber-200',  dot: 'bg-amber-500',   badgeBg: 'bg-amber-100 text-amber-800' },
  { key: 'negotiating',   label: 'Negotiating',    color: 'bg-orange-50/50',  border: 'border-orange-200', dot: 'bg-orange-500',  badgeBg: 'bg-orange-100 text-orange-700' },
  { key: 'agreed',        label: 'Agreed',         color: 'bg-teal-50/50',    border: 'border-teal-200',   dot: 'bg-teal-500',    badgeBg: 'bg-teal-100 text-teal-700' },
  { key: 'link_live',     label: 'Link Live',      color: 'bg-emerald-50/60', border: 'border-emerald-200',dot: 'bg-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-800' },
  { key: 'lost',          label: 'Lost / Closed',  color: 'bg-rose-50/40',    border: 'border-rose-200',   dot: 'bg-rose-400',    badgeBg: 'bg-rose-100 text-rose-700' },
]

export default function Pipeline() {
  const queryClient = useQueryClient()
  const { selectedClientId } = useClient()

  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropOverStage, setDropOverStage] = useState<ProspectStatus | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Link log prompt when prospect reaches 'link_live'
  const [prospectToLogLink, setProspectToLogLink] = useState<Prospect | null>(null)
  const [showAddProspectModal, setShowAddProspectModal] = useState(false)

  // Fetch campaigns for dropdown
  const { data: campaignsData } = useQuery<{ campaigns: CampaignOption[] }>({
    queryKey: ['campaigns-for-pipeline', selectedClientId],
    queryFn: async () => {
      const url = selectedClientId ? `/campaigns?client=${selectedClientId}&limit=100` : '/campaigns?limit=100'
      const res = await api.get(url)
      return res.data?.data
    },
  })

  const availableCampaigns = campaignsData?.campaigns || []

  // Fetch prospects for pipeline
  const { data: prospectsData, isLoading } = useQuery<{ prospects: Prospect[] }>({
    queryKey: ['pipeline-prospects', campaignFilter, selectedClientId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (campaignFilter && campaignFilter !== 'all') {
        params.append('campaign', campaignFilter)
      } else if (selectedClientId && availableCampaigns.length > 0) {
        // If client is selected globally, load prospects of those campaigns
      }
      params.append('limit', '500') // fetch up to 500 prospects for kanban board
      const res = await api.get(`/prospects?${params.toString()}`)
      return res.data?.data
    },
  })

  const allProspects = prospectsData?.prospects || []

  // Filter prospects locally by search term
  const filteredProspects = useMemo(() => {
    return allProspects.filter((p) => {
      // If global client is selected and prospect has campaign with client
      if (search.trim()) {
        const query = search.toLowerCase()
        const domainMatch = p.domain.toLowerCase().includes(query)
        const contactMatch = p.contactName?.toLowerCase().includes(query) || false
        const emailMatch = p.contactEmail?.toLowerCase().includes(query) || false
        if (!domainMatch && !contactMatch && !emailMatch) return false
      }
      return true
    })
  }, [allProspects, search])

  // Group prospects by stage for Kanban columns
  const prospectsByStage = useMemo(() => {
    const map: Record<ProspectStatus, Prospect[]> = {
      new: [],
      contact_found: [],
      email_sent: [],
      followup_sent: [],
      replied: [],
      negotiating: [],
      agreed: [],
      link_live: [],
      lost: [],
    }

    filteredProspects.forEach((p) => {
      const st = p.status || 'new'
      if (map[st]) {
        map[st].push(p)
      } else {
        map.new.push(p)
      }
    })

    return map
  }, [filteredProspects])

  // Status Update Mutation with Optimistic Update
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProspectStatus }) => {
      const res = await api.patch(`/prospects/${id}/status`, { status })
      return res.data
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['pipeline-prospects', campaignFilter, selectedClientId] })
      const previousData = queryClient.getQueryData(['pipeline-prospects', campaignFilter, selectedClientId])

      // Optimistically update query cache
      queryClient.setQueryData(
        ['pipeline-prospects', campaignFilter, selectedClientId],
        (old: any) => {
          if (!old?.prospects) return old
          return {
            ...old,
            prospects: old.prospects.map((p: Prospect) => (p._id === id ? { ...p, status } : p)),
          }
        }
      )

      return { previousData }
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['pipeline-prospects', campaignFilter, selectedClientId], context.previousData)
      }
      setErrorMessage(err.response?.data?.message || 'Failed to update prospect status.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-prospects'] })
      queryClient.invalidateQueries({ queryKey: ['campaign-detail'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  // Handle moving prospect to new status
  const handleMoveStatus = (prospectId: string, newStatus: ProspectStatus) => {
    const targetProspect = allProspects.find((p) => p._id === prospectId)
    if (!targetProspect || targetProspect.status === newStatus) return

    updateStatusMutation.mutate({ id: prospectId, status: newStatus })

    // If moving to link_live, prompt to log link as per acceptance criteria
    if (newStatus === 'link_live') {
      setProspectToLogLink({ ...targetProspect, status: newStatus })
    }
  }

  // Copy email helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4 h-full flex flex-col max-w-[100vw] overflow-hidden">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Pipeline Board</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {filteredProspects.length} prospects
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Drag prospects through 8 pipeline stages from discovery to live backlink.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Campaign Selector Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium shadow-xs"
            >
              <option value="all">All Campaigns</option>
              {availableCampaigns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative w-44 sm:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search domain or contact…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-xs"
            />
          </div>

          {/* View Toggle (Kanban vs Table) */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-all ${
                view === 'kanban' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Kanban Board View"
            >
              <KanbanSquare size={15} />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded-md transition-all ${
                view === 'table' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table List View"
            >
              <List size={15} />
            </button>
          </div>

          {/* Add Prospect Button */}
          <button
            onClick={() => setShowAddProspectModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-xs transition-colors shrink-0"
          >
            <Plus size={14} /> Add Prospect
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-800 animate-in fade-in shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ─── KANBAN BOARD VIEW ─────────────────────────────────────────────── */}
      {view === 'kanban' && (
        <div className="flex-1 overflow-x-auto pb-4 pt-1">
          <div className="flex gap-3.5 min-h-[calc(100vh-210px)] min-w-max">
            {STAGES.map((stage) => {
              const stageProspects = prospectsByStage[stage.key] || []
              const isDropTarget = dropOverStage === stage.key

              return (
                <div
                  key={stage.key}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    if (dropOverStage !== stage.key) {
                      setDropOverStage(stage.key)
                    }
                  }}
                  onDragLeave={() => {
                    if (dropOverStage === stage.key) {
                      setDropOverStage(null)
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const prospectId = e.dataTransfer.getData('text/plain') || draggingId
                    if (prospectId) {
                      handleMoveStatus(prospectId, stage.key)
                    }
                    setDropOverStage(null)
                    setDraggingId(null)
                  }}
                  className={`w-72 shrink-0 rounded-2xl border p-3 flex flex-col gap-2.5 transition-all duration-200 ${
                    stage.color
                  } ${stage.border} ${
                    isDropTarget ? 'ring-2 ring-indigo-500 shadow-md bg-indigo-50/40 border-indigo-300' : ''
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1 py-1 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                      <span className="text-xs font-bold text-gray-800 tracking-tight">{stage.label}</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shadow-2xs ${stage.badgeBg}`}>
                      {stageProspects.length}
                    </span>
                  </div>

                  {/* Cards Drop Container */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 min-h-32">
                    {stageProspects.map((p) => {
                      const isDragging = draggingId === p._id

                      return (
                        <div
                          key={p._id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', p._id)
                            setDraggingId(p._id)
                          }}
                          onDragEnd={() => {
                            setDraggingId(null)
                            setDropOverStage(null)
                          }}
                          className={`bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-grab active:cursor-grabbing group relative ${
                            isDragging ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''
                          }`}
                        >
                          {/* Domain & Link */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs text-gray-900 truncate">
                                  {p.domain}
                                </span>
                                <a
                                  href={`https://${p.domain}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={10} />
                                </a>
                              </div>

                              {p.campaign?.name && (
                                <p className="text-[10px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                                  <Briefcase size={10} />
                                  <span>{p.campaign.name}</span>
                                </p>
                              )}
                            </div>

                            {/* DR Badge */}
                            {p.metrics?.dr ? (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-extrabold text-[10px] shrink-0 border border-slate-200">
                                DR {p.metrics.dr}
                              </span>
                            ) : null}
                          </div>

                          {/* Contact Info */}
                          {(p.contactName || p.contactEmail) && (
                            <div className="text-[11px] text-gray-600 mt-2 space-y-0.5">
                              {p.contactName && <p className="font-medium text-gray-800 truncate">{p.contactName}</p>}
                              {p.contactEmail && (
                                <div className="flex items-center justify-between text-gray-500 font-mono text-[10px]">
                                  <span className="truncate">{p.contactEmail}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopy(p._id, p.contactEmail!)
                                    }}
                                    className="text-gray-400 hover:text-indigo-600 ml-1"
                                    title="Copy email"
                                  >
                                    {copiedId === p._id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Follow-up date or Tags */}
                          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1 text-[10px]">
                            {p.nextFollowUpAt ? (
                              <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-semibold">
                                <Clock size={10} />
                                <span>{new Date(p.nextFollowUpAt).toLocaleDateString()}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">No follow-up set</span>
                            )}

                            {/* Move stage quick select for accessibility/mobile */}
                            <select
                              value={p.status}
                              onChange={(e) => handleMoveStatus(p._id, e.target.value as ProspectStatus)}
                              className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50 hover:bg-white text-gray-600 cursor-pointer outline-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {STAGES.map((s) => (
                                <option key={s.key} value={s.key}>
                                  → {s.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )
                    })}

                    {stageProspects.length === 0 && (
                      <div className="h-28 rounded-xl border border-dashed border-gray-300/80 flex flex-col items-center justify-center text-xs text-gray-400">
                        <span>Drop cards here</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── TABLE VIEW ────────────────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Metrics</th>
                  <th className="py-3 px-4">Stage Status</th>
                  <th className="py-3 px-4">Follow-up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProspects.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[180px]">{p.domain}</span>
                        <a
                          href={`https://${p.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-700">
                      <div>
                        <p className="font-medium text-gray-900">{p.contactName || '-'}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{p.contactEmail || ''}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      {p.campaign?.name || '-'}
                    </td>

                    <td className="py-3 px-4">
                      {p.metrics?.dr ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                          DR {p.metrics.dr}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={p.status}
                        onChange={(e) => handleMoveStatus(p._id, e.target.value as ProspectStatus)}
                        className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-semibold bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        {STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4 text-gray-500">
                      {p.nextFollowUpAt ? new Date(p.nextFollowUpAt).toLocaleDateString() : '-'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {p.status === 'link_live' ? (
                        <button
                          onClick={() => setProspectToLogLink(p)}
                          className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200"
                        >
                          Log Won Link
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMoveStatus(p._id, 'link_live')}
                          className="px-2 py-1 text-[11px] font-semibold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          Move to Live
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredProspects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No prospects found in this pipeline view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Add Won Link Prompt Modal (Acceptance Criterion) ──────────────── */}
      {prospectToLogLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setProspectToLogLink(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Award size={18} className="text-emerald-600" />
                <span>Congratulations! Log Won Backlink</span>
              </h3>
              <button onClick={() => setProspectToLogLink(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              <strong>{prospectToLogLink.domain}</strong> has reached <strong>Link Live</strong>. Enter the publication URL to record this won backlink.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const form = e.target as any
                try {
                  const campId = prospectToLogLink.campaign?._id || availableCampaigns[0]?._id
                  await api.post(`/campaigns/${campId}/links`, {
                    prospect: prospectToLogLink._id,
                    sourceUrl: form.sourceUrl.value.trim(),
                    targetUrl: form.targetUrl.value.trim(),
                    anchorText: form.anchorText.value.trim(),
                    rel: form.rel.value,
                    cost: parseFloat(form.cost.value) || 0,
                    liveDate: new Date().toISOString(),
                  })
                  queryClient.invalidateQueries({ queryKey: ['campaign-detail'] })
                  queryClient.invalidateQueries({ queryKey: ['campaigns'] })
                  queryClient.invalidateQueries({ queryKey: ['pipeline-prospects'] })
                  setProspectToLogLink(null)
                } catch (err: any) {
                  setErrorMessage(err.response?.data?.message || 'Failed to record won link.')
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Source Publication URL <span className="text-rose-500">*</span>
                </label>
                <input
                  name="sourceUrl"
                  type="url"
                  required
                  defaultValue={`https://${prospectToLogLink.domain}/`}
                  placeholder="https://example.com/blog/review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Landing Page URL</label>
                <input
                  name="targetUrl"
                  type="url"
                  placeholder="https://mywebsite.com/product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Anchor Text</label>
                  <input
                    name="anchorText"
                    type="text"
                    placeholder="e.g. outreach CRM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Link Rel</label>
                  <select
                    name="rel"
                    defaultValue="dofollow"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="dofollow">DoFollow</option>
                    <option value="nofollow">NoFollow</option>
                    <option value="sponsored">Sponsored</option>
                    <option value="ugc">UGC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cost ($)</label>
                <input
                  name="cost"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProspectToLogLink(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Save Won Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Prospect Modal ─────────────────────────────────────────────── */}
      {showAddProspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddProspectModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Add Prospect to Pipeline</h3>
              <button onClick={() => setShowAddProspectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const form = e.target as any
                try {
                  await api.post('/prospects', {
                    campaign: form.campaign.value,
                    domain: form.domain.value.trim(),
                    contactName: form.contactName.value.trim(),
                    contactEmail: form.contactEmail.value.trim(),
                    status: form.status.value,
                    metrics: { dr: parseInt(form.dr.value, 10) || 0, traffic: 0 },
                  })
                  queryClient.invalidateQueries({ queryKey: ['pipeline-prospects'] })
                  setShowAddProspectModal(false)
                } catch (err: any) {
                  setErrorMessage(err.response?.data?.message || 'Failed to add prospect.')
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Assign Campaign <span className="text-rose-500">*</span>
                </label>
                <select
                  name="campaign"
                  required
                  defaultValue={campaignFilter !== 'all' ? campaignFilter : availableCampaigns[0]?._id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {availableCampaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Domain <span className="text-rose-500">*</span>
                </label>
                <input
                  name="domain"
                  type="text"
                  required
                  placeholder="e.g. techcrunch.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Name</label>
                  <input
                    name="contactName"
                    type="text"
                    placeholder="Sarah Miller"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Domain Rating (DR)</label>
                  <input
                    name="dr"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contact Email</label>
                <input
                  name="contactEmail"
                  type="email"
                  placeholder="editor@techcrunch.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Starting Stage</label>
                <select
                  name="status"
                  defaultValue="new"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProspectModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Add Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
