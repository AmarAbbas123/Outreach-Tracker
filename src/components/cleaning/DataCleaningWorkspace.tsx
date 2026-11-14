import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react'
import {
  Upload,
  Plus,
  Trash2,
  Copy,
  Download,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  FileSpreadsheet,
  ArrowRight,
  Send,
  Loader2,
  History,
  Undo2,
  Redo2,
  Replace,
  Wand2,
  ExternalLink,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import api from '../../api/client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DatasetColumn {
  id: string
  name: string
  type: 'text' | 'number' | 'date'
  order: number
  hidden: boolean
}

export interface DatasetStep {
  label: string
  operation?: any
  rowsAffected: number
  at: string
  byAI?: boolean
}

export interface Dataset {
  _id: string
  name: string
  originalFileName: string
  sheetName: string
  columns: DatasetColumn[]
  rowCount: number
  status: 'uploading' | 'ready' | 'sent'
  steps: DatasetStep[]
  sentToCampaign?: {
    _id: string
    name: string
  }
  lastSentAt?: string
  updatedAt: string
}

export interface DatasetRowData {
  _id: string
  index: number
  cells: Record<string, string>
  original: Record<string, string>
  isDeleted: boolean
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DataCleaningWorkspace({ onProspectsUpdated }: { onProspectsUpdated: () => void }) {
  const queryClient = useQueryClient()
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Fetch datasets list
  const { data: datasets = [], isLoading } = useQuery({
    queryKey: ['datasets-list'],
    queryFn: async () => {
      const res = await api.get('/datasets')
      return res.data.data.datasets as Dataset[]
    },
  })

  const activeDataset = datasets.find((d) => d._id === activeDatasetId) || null

  return (
    <div className="space-y-5">
      {!activeDataset ? (
        // ── View 1: Datasets List ──
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-gray-900">Data Cleaning Workspaces</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload raw scraped lists, CSVs, or Excel files without any template. Clean with AI and one-click tools before pushing to outreach.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              <Upload size={15} /> Upload Raw File (No Template)
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-500">Loading datasets…</p>
            </div>
          ) : datasets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-14 text-center shadow-sm">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="text-indigo-600" size={26} />
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-1">No datasets in cleaning</h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
                Have a raw file from Apollo, Hunter, Ahrefs, or Google Sheets? Upload it here in any format to clean headers, emails, and domains with AI.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                <Upload size={15} /> Upload Dataset
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.map((dataset) => (
                <div
                  key={dataset._id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                          <FileSpreadsheet size={20} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm truncate max-w-[180px]" title={dataset.name}>
                            {dataset.name}
                          </h4>
                          <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{dataset.originalFileName}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          dataset.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {dataset.status === 'sent' ? 'Sent to Outreach' : 'In Cleaning'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Rows</span>
                        <span className="font-medium">{dataset.rowCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Columns</span>
                        <span className="font-medium">{dataset.columns?.length || 0}</span>
                      </div>
                    </div>

                    {dataset.steps && dataset.steps.length > 0 && (
                      <p className="text-[11px] text-gray-500 mt-2 truncate">
                        Last: {dataset.steps[dataset.steps.length - 1].label}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => setActiveDatasetId(dataset._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      Open Grid <ArrowRight size={13} />
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete dataset "${dataset.name}"?`)) {
                            await api.delete(`/datasets/${dataset._id}`)
                            queryClient.invalidateQueries({ queryKey: ['datasets-list'] })
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete dataset"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ── View 2: Excel-Like Grid Workspace ──
        <DatasetGrid
          dataset={activeDataset}
          onBack={() => setActiveDatasetId(null)}
          onProspectsUpdated={onProspectsUpdated}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadDatasetModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newId) => {
            setShowUploadModal(false)
            queryClient.invalidateQueries({ queryKey: ['datasets-list'] })
            setActiveDatasetId(newId)
          }}
        />
      )}
    </div>
  )
}

// ─── Dataset Grid Component ──────────────────────────────────────────────────

function DatasetGrid({
  dataset,
  onBack,
  onProspectsUpdated,
}: {
  dataset: Dataset
  onBack: () => void
  onProspectsUpdated: () => void
}) {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<DatasetRowData[]>([])
  const [columns, setColumns] = useState<DatasetColumn[]>(dataset.columns || [])
  const [loadingRows, setLoadingRows] = useState(true)

  // Clean / Grid States
  const [search, setSearch] = useState('')
  const [selectedColumnId, setSelectedColumnId] = useState<string>(dataset.columns[0]?.id || '')
  const [filterColumnId, setFilterColumnId] = useState<string>('all')
  const [filterOp, setFilterOp] = useState<string>('contains')
  const [filterVal, setFilterVal] = useState<string>('')
  const [commandInput, setCommandInput] = useState('')
  const [commandLoading, setCommandLoading] = useState(false)
  const [commandPreview, setCommandPreview] = useState<any | null>(null)

  // Undo / Redo history stack (up to 50 states)
  const [history, setHistory] = useState<DatasetRowData[][]>([])
  const [future, setFuture] = useState<DatasetRowData[][]>([])

  // Drawers & Modals
  const [showSteps, setShowSteps] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')

  // Load rows from backend
  useEffect(() => {
    let isMounted = true
    const fetchRows = async () => {
      setLoadingRows(true)
      try {
        const res = await api.get(`/datasets/${dataset._id}/rows`)
        if (isMounted && res.data.success) {
          setRows(res.data.data.rows)
          setHistory([])
          setFuture([])
        }
      } catch (err) {
        console.error('Failed to load dataset rows', err)
      } finally {
        if (isMounted) setLoadingRows(false)
      }
    }
    fetchRows()
    return () => {
      isMounted = false
    }
  }, [dataset._id])

  // Save changes helper with undo tracking
  const applyRowChanges = async (newRows: DatasetRowData[], stepLabel: string) => {
    // Push current to history (max 50)
    setHistory((prev) => [...prev.slice(-49), rows])
    setFuture([])
    setRows(newRows)

    // Save batch to server in background
    try {
      const updatedRows = newRows.map((r) => ({ _id: r._id, cells: r.cells }))
      await api.patch(`/datasets/${dataset._id}/rows`, {
        updatedRows,
        stepLabel,
      })
      queryClient.invalidateQueries({ queryKey: ['datasets-list'] })
    } catch (err) {
      console.error('Failed to auto-save dataset changes', err)
    }
  }

  // Undo / Redo
  const handleUndo = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setFuture((f) => [rows, ...f])
    setHistory((h) => h.slice(0, -1))
    setRows(prev)
  }

  const handleRedo = () => {
    if (future.length === 0) return
    const next = future[0]
    setHistory((h) => [...h, rows])
    setFuture((f) => f.slice(1))
    setRows(next)
  }

  // Cell editing
  const handleCellChange = (rowId: string, colId: string, value: string) => {
    const updated = rows.map((r) => {
      if (r._id === rowId) {
        return { ...r, cells: { ...r.cells, [colId]: value } }
      }
      return r
    })
    applyRowChanges(updated, 'Edited cell')
  }

  // ── Rule-Based Cleaning Actions ──

  const handleTrimWhitespace = () => {
    const updated = rows.map((r) => {
      const newCells = { ...r.cells }
      columns.forEach((c) => {
        if (newCells[c.id]) {
          newCells[c.id] = String(newCells[c.id]).trim().replace(/\s+/g, ' ')
        }
      })
      return { ...r, cells: newCells }
    })
    applyRowChanges(updated, 'Trimmed whitespace across all columns')
  }

  const handleChangeCase = (mode: 'lower' | 'upper' | 'title') => {
    if (!selectedColumnId) return
    const colName = columns.find((c) => c.id === selectedColumnId)?.name || 'column'
    const updated = rows.map((r) => {
      const val = r.cells[selectedColumnId] || ''
      let res = val
      if (mode === 'lower') res = val.toLowerCase()
      if (mode === 'upper') res = val.toUpperCase()
      if (mode === 'title') {
        res = val.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase())
      }
      return { ...r, cells: { ...r.cells, [selectedColumnId]: res } }
    })
    applyRowChanges(updated, `Changed case of "${colName}" to ${mode}`)
  }

  const handleExtractDomain = () => {
    if (!selectedColumnId) return
    const colName = columns.find((c) => c.id === selectedColumnId)?.name || 'column'
    let count = 0
    const updated = rows.map((r) => {
      const val = r.cells[selectedColumnId] || ''
      const domain = normalizeDomain(val)
      if (domain && domain !== val) count++
      return { ...r, cells: { ...r.cells, [selectedColumnId]: domain || val } }
    })
    applyRowChanges(updated, `Extracted domain in "${colName}" (${count} normalized)`)
  }

  const handleRemoveDuplicates = () => {
    if (!selectedColumnId) return
    const colName = columns.find((c) => c.id === selectedColumnId)?.name || 'column'
    const seen = new Set<string>()
    const remaining: DatasetRowData[] = []
    let removed = 0

    rows.forEach((r) => {
      const val = (r.cells[selectedColumnId] || '').trim().toLowerCase()
      if (!val) {
        remaining.push(r)
      } else if (!seen.has(val)) {
        seen.add(val)
        remaining.push(r)
      } else {
        removed++
      }
    })

    applyRowChanges(remaining, `Removed ${removed} duplicates in "${colName}"`)
  }

  const handleDeleteEmptyRows = () => {
    if (!selectedColumnId) return
    const colName = columns.find((c) => c.id === selectedColumnId)?.name || 'column'
    const remaining = rows.filter((r) => (r.cells[selectedColumnId] || '').trim().length > 0)
    const count = rows.length - remaining.length
    applyRowChanges(remaining, `Deleted ${count} rows where "${colName}" was empty`)
  }

  const handleFixEmailTypos = () => {
    if (!selectedColumnId) return
    const typos: Record<string, string> = {
      '@gmial.com': '@gmail.com',
      '@gmai.com': '@gmail.com',
      '@gamil.com': '@gmail.com',
      '@hotmial.com': '@hotmail.com',
      '@yaho.com': '@yahoo.com',
    }
    let fixed = 0
    const updated = rows.map((r) => {
      let val = (r.cells[selectedColumnId] || '').toLowerCase().trim()
      for (const [bad, good] of Object.entries(typos)) {
        if (val.includes(bad)) {
          val = val.replace(bad, good)
          fixed++
        }
      }
      return { ...r, cells: { ...r.cells, [selectedColumnId]: val } }
    })
    applyRowChanges(updated, `Fixed ${fixed} common email typos`)
  }

  const handleResetToOriginal = async () => {
    if (!window.confirm('Reset dataset to original uploaded version? All edits will be reverted.')) return
    try {
      const res = await api.post(`/datasets/${dataset._id}/reset`)
      if (res.data.success) {
        const rowsRes = await api.get(`/datasets/${dataset._id}/rows`)
        setRows(rowsRes.data.data.rows)
        setHistory([])
        setFuture([])
        alert('Dataset reset to original state.')
      }
    } catch (err) {
      alert('Failed to reset dataset.')
    }
  }

  // Find & Replace
  const handleFindReplaceSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!findText) return
    let count = 0
    const updated = rows.map((r) => {
      const newCells = { ...r.cells }
      const targetCol = selectedColumnId || columns[0]?.id
      if (newCells[targetCol] && newCells[targetCol].includes(findText)) {
        newCells[targetCol] = newCells[targetCol].replaceAll(findText, replaceText)
        count++
      }
      return { ...r, cells: newCells }
    })
    applyRowChanges(updated, `Replaced "${findText}" with "${replaceText}" in ${count} cells`)
    setShowFindReplace(false)
    setFindText('')
    setReplaceText('')
  }

  // ── AI Plain-Language Command ──

  const handleAICommandSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!commandInput.trim()) return

    setCommandLoading(true)
    try {
      const res = await api.post('/ai/clean/command', {
        command: commandInput.trim(),
        columns,
      })

      if (res.data.success && res.data.data.operations) {
        setCommandPreview({
          command: commandInput.trim(),
          operations: res.data.data.operations,
        })
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not interpret command.')
    } finally {
      setCommandLoading(false)
    }
  }

  const applyAIOperations = () => {
    if (!commandPreview) return
    let currentRows = [...rows]
    const ops = commandPreview.operations

    ops.forEach((op: any) => {
      if (op.type === 'trim') {
        currentRows = currentRows.map((r) => {
          const cells = { ...r.cells }
          op.columns.forEach((cId: string) => {
            if (cells[cId]) cells[cId] = String(cells[cId]).trim().replace(/\s+/g, ' ')
          })
          return { ...r, cells }
        })
      } else if (op.type === 'change_case') {
        currentRows = currentRows.map((r) => {
          const cells = { ...r.cells }
          op.columns.forEach((cId: string) => {
            const val = cells[cId] || ''
            cells[cId] = op.mode === 'lower' ? val.toLowerCase() : op.mode === 'upper' ? val.toUpperCase() : val
          })
          return { ...r, cells }
        })
      } else if (op.type === 'delete_rows') {
        currentRows = currentRows.filter((r) => {
          let keep = true
          op.where.forEach((cond: any) => {
            const val = r.cells[cond.column] || ''
            if (cond.op === 'is_empty' && (!val || val.trim().length === 0)) keep = false
          })
          return keep
        })
      } else if (op.type === 'extract_domain') {
        currentRows = currentRows.map((r) => {
          const val = r.cells[op.column] || ''
          const d = normalizeDomain(val)
          return { ...r, cells: { ...r.cells, [op.target || op.column]: d || val } }
        })
      } else if (op.type === 'replace_values') {
        currentRows = currentRows.map((r) => {
          const val = r.cells[op.column] || ''
          if (val.includes(op.from)) {
            return { ...r, cells: { ...r.cells, [op.column]: val.replaceAll(op.from, op.to) } }
          }
          return r
        })
      }
    })

    applyRowChanges(currentRows, `AI: ${commandPreview.command}`)
    setCommandPreview(null)
    setCommandInput('')
  }

  // Filter visible rows
  const visibleRows = rows.filter((r) => {
    // Quick search
    if (search.trim()) {
      const q = search.toLowerCase()
      const match = Object.values(r.cells).some((val) => String(val).toLowerCase().includes(q))
      if (!match) return false
    }

    // Column filter
    if (filterColumnId !== 'all' && filterVal.trim()) {
      const cellVal = (r.cells[filterColumnId] || '').toLowerCase()
      const target = filterVal.toLowerCase().trim()
      if (filterOp === 'contains' && !cellVal.includes(target)) return false
      if (filterOp === 'equals' && cellVal !== target) return false
      if (filterOp === 'starts_with' && !cellVal.startsWith(target)) return false
      if (filterOp === 'is_empty' && cellVal.length > 0) return false
    }

    return true
  })

  return (
    <div className="space-y-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[82vh]">
      {/* ── Top Header Bar ── */}
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            ← All Datasets
          </button>
          <div>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              {dataset.name}
              <span className="text-xs font-normal text-gray-500">
                ({visibleRows.length.toLocaleString()} rows)
              </span>
            </h3>
          </div>
        </div>

        {/* Send to Outreach CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              window.open(`/api/v1/datasets/${dataset._id}/export?format=xlsx`, '_blank')
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            title="Download cleaned file"
          >
            <Download size={13} /> Export Cleaned
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <Send size={13} /> Send to Outreach Database
          </button>
        </div>
      </div>

      {/* ── AI Command Bar ── */}
      <div className="px-3 pt-2">
        <form onSubmit={handleAICommandSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Sparkles size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600" />
            <input
              type="text"
              placeholder='Tell AI what to clean… (e.g. "remove rows with no email and lowercase all domains", "change Managing Director to MD")'
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className="w-full pl-9 pr-24 py-2 bg-indigo-50/50 border border-indigo-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 placeholder-indigo-400"
            />
            <button
              type="submit"
              disabled={commandLoading || !commandInput.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {commandLoading ? 'Thinking…' : 'Run AI'}
            </button>
          </div>
        </form>

        {/* AI Command Preview Confirmation */}
        {commandPreview && (
          <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
                <Wand2 size={14} className="text-indigo-600" />
                AI Plan for: &quot;{commandPreview.command}&quot;
              </span>
              <button
                onClick={() => setCommandPreview(null)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-1 text-gray-700 pl-5 list-disc">
              {commandPreview.operations.map((op: any, i: number) => (
                <div key={i}>
                  • Action: <strong className="uppercase">{op.type}</strong> {op.columns ? `on ${op.columns.length} column(s)` : ''}
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={applyAIOperations}
                className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 cursor-pointer"
              >
                Approve & Apply Changes
              </button>
              <button
                type="button"
                onClick={() => setCommandPreview(null)}
                className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar & Rule-Based Tools ── */}
      <div className="px-3 py-2 border-y border-gray-200 bg-gray-50/60 flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Undo / Redo */}
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-2xs">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={handleRedo}
              disabled={future.length === 0}
              className="p-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors border-l border-gray-200"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={13} />
            </button>
          </div>

          {/* Target Column Selector for Tools */}
          <select
            value={selectedColumnId}
            onChange={(e) => setSelectedColumnId(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:ring-1 focus:ring-indigo-500"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                Column: {c.name}
              </option>
            ))}
          </select>

          {/* One-Click Clean Tools Dropdown */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleExtractDomain}
              className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors cursor-pointer"
              title="Strip URLs and emails to clean root domains"
            >
              Extract Domain
            </button>
            <button
              onClick={handleTrimWhitespace}
              className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors cursor-pointer"
            >
              Trim Spaces
            </button>
            <button
              onClick={() => handleChangeCase('lower')}
              className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors cursor-pointer"
            >
              lowercase
            </button>
            <button
              onClick={handleRemoveDuplicates}
              className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors cursor-pointer"
            >
              Deduplicate
            </button>
            <button
              onClick={handleDeleteEmptyRows}
              className="px-2.5 py-1.5 bg-white border border-gray-300 text-rose-700 hover:bg-rose-50 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Delete Empty
            </button>
            <button
              onClick={handleFixEmailTypos}
              className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors cursor-pointer"
            >
              Fix Email Typos
            </button>
            <button
              onClick={() => setShowFindReplace(true)}
              className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors cursor-pointer"
            >
              <Replace size={13} className="inline mr-1" /> Find & Replace
            </button>
          </div>
        </div>

        {/* Right Tools: Steps & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSteps(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors cursor-pointer"
          >
            <History size={13} /> Steps ({dataset.steps?.length || 0})
          </button>
          <button
            onClick={handleResetToOriginal}
            className="flex items-center gap-1 px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium transition-colors cursor-pointer"
            title="Restore original uploaded data"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* ── Find and Replace Bar ── */}
      {showFindReplace && (
        <form
          onSubmit={handleFindReplaceSubmit}
          className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs"
        >
          <span className="font-semibold text-amber-900">Find & Replace:</span>
          <input
            type="text"
            placeholder="Text to find…"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            className="px-2 py-1 bg-white border border-amber-300 rounded text-xs focus:outline-none"
            autoFocus
          />
          <span>with</span>
          <input
            type="text"
            placeholder="Replacement…"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="px-2 py-1 bg-white border border-amber-300 rounded text-xs focus:outline-none"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700"
          >
            Replace All
          </button>
          <button
            type="button"
            onClick={() => setShowFindReplace(false)}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={14} />
          </button>
        </form>
      )}

      {/* ── Filter Bar ── */}
      <div className="px-3 py-1.5 bg-gray-50/40 border-b border-gray-200 flex items-center gap-2 text-xs">
        <Filter size={13} className="text-gray-400" />
        <span className="text-gray-500 font-medium">Filter:</span>
        <select
          value={filterColumnId}
          onChange={(e) => setFilterColumnId(e.target.value)}
          className="px-2 py-1 bg-white border border-gray-300 rounded text-xs"
        >
          <option value="all">All Columns</option>
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterOp}
          onChange={(e) => setFilterOp(e.target.value)}
          className="px-2 py-1 bg-white border border-gray-300 rounded text-xs"
        >
          <option value="contains">contains</option>
          <option value="equals">equals</option>
          <option value="starts_with">starts with</option>
          <option value="is_empty">is empty</option>
        </select>
        <input
          type="text"
          placeholder="Value…"
          value={filterVal}
          onChange={(e) => setFilterVal(e.target.value)}
          className="px-2 py-1 bg-white border border-gray-300 rounded text-xs flex-1 max-w-xs"
        />
        {(filterVal || filterColumnId !== 'all') && (
          <button
            onClick={() => {
              setFilterVal('')
              setFilterColumnId('all')
            }}
            className="text-gray-400 hover:text-gray-600 text-[11px]"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* ── Virtualized / Scrollable Spreadsheet Grid ── */}
      <div className="flex-1 overflow-auto bg-white relative">
        {loadingRows ? (
          <div className="p-16 text-center">
            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={24} />
            <p className="text-xs text-gray-500">Loading dataset grid…</p>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10 border-b border-gray-300 shadow-2xs">
              <tr>
                <th className="w-12 px-2 py-2 text-center text-gray-500 font-semibold border-r border-gray-200 bg-gray-100 select-none">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={`px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200 select-none cursor-pointer hover:bg-gray-200 transition-colors ${
                      selectedColumnId === col.id ? 'bg-indigo-50/80 text-indigo-900 border-b-2 border-b-indigo-600' : ''
                    }`}
                    onClick={() => setSelectedColumnId(col.id)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate max-w-[160px]">{col.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visibleRows.slice(0, 1000).map((row, idx) => (
                <tr key={row._id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="w-12 px-2 py-1.5 text-center text-[11px] text-gray-400 bg-gray-50/60 border-r border-gray-200 select-none font-mono">
                    {idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={`p-0 border-r border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:z-10 ${
                        selectedColumnId === col.id ? 'bg-indigo-50/10' : ''
                      }`}
                    >
                      <input
                        type="text"
                        defaultValue={row.cells[col.id] ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (row.cells[col.id] ?? '')) {
                            handleCellChange(row._id, col.id, e.target.value)
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs text-gray-900 bg-transparent border-0 focus:outline-none truncate"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Bottom Status Bar ── */}
      <div className="px-3 py-1.5 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
        <div>
          Showing {visibleRows.length.toLocaleString()} of {rows.length.toLocaleString()} rows • {columns.length} columns
        </div>
        <div>
          Autosaved on server • Undo buffer: {history.length}/50
        </div>
      </div>

      {/* ── Steps History Drawer ── */}
      {showSteps && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-80 bg-white h-full shadow-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <History size={16} /> Cleaning Steps History
              </h4>
              <button onClick={() => setShowSteps(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {dataset.steps && dataset.steps.length > 0 ? (
                dataset.steps.map((st, i) => (
                  <div key={i} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-gray-900">{st.label}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{new Date(st.at).toLocaleTimeString()}</span>
                      {st.rowsAffected > 0 && <span>{st.rowsAffected} rows affected</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">No steps logged yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Send to Outreach Database Modal ── */}
      {showSendModal && (
        <SendToOutreachModal
          dataset={dataset}
          columns={columns}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            setShowSendModal(false)
            onProspectsUpdated()
            alert('Cleaned prospects successfully pushed to the Outreach Database!')
          }}
        />
      )}
    </div>
  )
}

// ─── Send to Outreach Modal ──────────────────────────────────────────────────

function SendToOutreachModal({
  dataset,
  columns,
  onClose,
  onSuccess,
}: {
  dataset: Dataset
  columns: DatasetColumn[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [newCampaignName, setNewCampaignName] = useState('')
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update'>('skip')
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch campaigns
  useEffect(() => {
    api.get('/campaigns?limit=100').then((res) => {
      if (res.data.success) {
        setCampaigns(res.data.data.campaigns)
        if (res.data.data.campaigns.length > 0) {
          setSelectedCampaign(res.data.data.campaigns[0]._id)
        }
      }
    })
  }, [])

  // 2. Auto-detect columns via AI
  useEffect(() => {
    api
      .post('/ai/clean/detect-columns', { columns })
      .then((res) => {
        if (res.data.success && res.data.data.mapping) {
          setMapping(res.data.data.mapping)
        }
      })
      .catch(() => {})
  }, [columns])

  const handleQuickCreateCampaign = async () => {
    if (!newCampaignName.trim()) return
    try {
      const res = await api.post('/campaigns', {
        name: newCampaignName.trim(),
        type: 'guest_post',
      })
      if (res.data.success) {
        setCampaigns((prev) => [...prev, res.data.data.campaign])
        setSelectedCampaign(res.data.data.campaign._id)
        setNewCampaignName('')
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not create campaign.')
    }
  }

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedCampaign) {
      setError('Please select or create a campaign.')
      return
    }
    if (!mapping.domain) {
      setError('You must map the Domain column.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/datasets/${dataset._id}/send-to-outreach`, {
        campaign: selectedCampaign,
        mapping,
        duplicateAction,
      })

      if (res.data.success) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send to outreach database.')
    } finally {
      setLoading(false)
    }
  }

  const outreachFields = [
    { key: 'domain', label: 'Domain *', required: true },
    { key: 'page_url', label: 'Specific Page URL', required: false },
    { key: 'contact_name', label: 'Contact Name', required: false },
    { key: 'contact_email', label: 'Contact Email', required: false },
    { key: 'dr', label: 'Domain Rating (DR)', required: false },
    { key: 'traffic', label: 'Monthly Traffic', required: false },
    { key: 'niche', label: 'Niche / Category', required: false },
    { key: 'country', label: 'Country', required: false },
    { key: 'tags', label: 'Tags', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Send to Outreach Database</h3>
            <p className="text-xs text-gray-500">Map your cleaned dataset columns to outreach prospect fields.</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          {/* Campaign Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Target Campaign *
            </label>
            {campaigns.length === 0 ? (
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs space-y-1.5">
                <p className="text-indigo-900">Create a campaign to receive these prospects:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Campaign name…"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-white border border-gray-300 rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleQuickCreateCampaign}
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {campaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or type new campaign name…"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-white border border-gray-200 rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleQuickCreateCampaign}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium"
                  >
                    + Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Column Mapping Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase text-gray-600">
                Column Mapping (AI Pre-Filled)
              </label>
              <span className="text-[11px] text-indigo-600 font-medium">Smart detection applied</span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 max-h-56 overflow-y-auto text-xs">
              {outreachFields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-gray-700 font-medium block">
                    {f.label}
                  </label>
                  <select
                    value={mapping[f.key] || ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">(None)</option>
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Duplicate handling */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Duplicate Handling
            </label>
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="dup"
                  checked={duplicateAction === 'skip'}
                  onChange={() => setDuplicateAction('skip')}
                  className="text-indigo-600"
                />
                <span>Skip duplicates (Recommended)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="dup"
                  checked={duplicateAction === 'update'}
                  onChange={() => setDuplicateAction('update')}
                  className="text-indigo-600"
                />
                <span>Update existing prospects</span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCampaign}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? 'Pumping into Pipeline…' : 'Send to Outreach Database'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Upload Raw Dataset Modal ────────────────────────────────────────────────

function UploadDatasetModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (datasetId: string) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file.')
      return
    }

    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    if (name.trim()) formData.append('name', name.trim())

    try {
      const res = await api.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (res.data.success && res.data.data.dataset) {
        onSuccess(res.data.data.dataset._id)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload dataset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base">Upload Raw Dataset</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Dataset Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Apollo Scrape - Q1 SaaS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Select File (CSV, TSV, XLSX, XLS) *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-indigo-50/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0])
                    if (!name) {
                      setName(e.target.files[0].name.replace(/\.[^/.]+$/, ''))
                    }
                  }
                }}
              />
              <FileSpreadsheet className="mx-auto text-indigo-600 mb-2" size={28} />
              {file ? (
                <div>
                  <p className="text-xs font-semibold text-gray-900">{file.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB — Click to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-gray-800">
                    Click to browse or drag & drop raw spreadsheet
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Accepts any columns, up to 20,000 rows & 20 MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? 'Uploading…' : 'Open in Cleaning Grid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
