import { useState, useEffect, useRef } from 'react'
import {
  Globe,
  Search,
  Sparkles,
  Plus,
  Play,
  RotateCcw,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  Code,
  Table as TableIcon,
  List as ListIcon,
  Link2,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  Bot,
  Check,
  ChevronRight,
  X,
  Loader2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Copy,
  Info,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { getAccessToken } from '../../api/client'

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ScrapeJobCounts {
  total: number
  done: number
  ok: number
  failed: number
  blocked: number
}

export interface ScrapeJob {
  _id: string
  name: string
  inputType: 'urls' | 'prospects' | 'any_url'
  inputs: string[]
  options?: {
    maxPagesPerSite?: number
    useAI?: boolean
  }
  mode?: string
  instruction?: string
  recipe?: any
  status: 'queued' | 'running' | 'completed' | 'cancelled' | 'failed'
  counts: ScrapeJobCounts
  dataset?: {
    _id: string
    name: string
    rowCount: number
  } | null
  startedAt?: string
  finishedAt?: string
  createdAt: string
}

export interface ScrapeTask {
  _id: string
  job: string
  url: string
  domain: string
  status: 'pending' | 'running' | 'ok' | 'no_contact' | 'blocked' | 'error' | 'timeout'
  attempts: number
  error?: string
  pagesVisited?: string[]
  extractedData?: any
  updatedAt: string
}

export interface ScrapeRecipe {
  _id: string
  name: string
  domain?: string
  instruction?: string
  recipe: {
    rowSelector: string
    fields: Array<{
      name: string
      selector: string
      attr?: string
    }>
    pagination?: any
  }
  lastWorkedAt?: string
  createdAt: string
}

interface WebScraperWorkspaceProps {
  onNavigateToCleaning: (datasetId?: string) => void
  onProspectsUpdated?: () => void
}

export default function WebScraperWorkspace({
  onNavigateToCleaning,
  onProspectsUpdated,
}: WebScraperWorkspaceProps) {
  const queryClient = useQueryClient()

  // Workspace View Tabs: 'analyze' | 'describe' | 'jobs' | 'recipes'
  const [activeTab, setActiveTab] = useState<'analyze' | 'describe' | 'jobs' | 'recipes'>('analyze')

  // Top URL input
  const [inputUrl, setInputUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeMode, setAnalyzeMode] = useState<'prospect' | 'any'>('prospect')
  const [analyzeResult, setAnalyzeResult] = useState<any>(null)
  const [analyzeActiveSubTab, setAnalyzeActiveSubTab] = useState<'contacts' | 'tables' | 'lists' | 'links' | 'schema' | 'text'>('contacts')
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  // Describe with AI state
  const [describeUrl, setDescribeUrl] = useState('')
  const [describeInstruction, setDescribeInstruction] = useState('')
  const [describeColumns, setDescribeColumns] = useState('')
  const [describing, setDescribing] = useState(false)
  const [describeResult, setDescribeResult] = useState<any>(null)
  const [describeError, setDescribeError] = useState<string | null>(null)
  const [saveRecipeName, setSaveRecipeName] = useState('')
  const [isSavingRecipe, setIsSavingRecipe] = useState(false)

  // Modals
  const [showNewJobModal, setShowNewJobModal] = useState(false)
  const [viewTasksJobId, setViewTasksJobId] = useState<string | null>(null)
  const [viewRecipeModal, setViewRecipeModal] = useState<ScrapeRecipe | null>(null)

  // New Job Form State
  const [newJobName, setNewJobName] = useState('')
  const [newJobMode, setNewJobMode] = useState<'prospect' | 'instruction' | 'recipe'>('prospect')
  const [newJobInstruction, setNewJobInstruction] = useState('')
  const [newJobUrls, setNewJobUrls] = useState('')
  const [newJobMaxPages, setNewJobMaxPages] = useState(10)
  const [newJobUseAI, setNewJobUseAI] = useState(true)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testingUrl, setTestingUrl] = useState(false)

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  // 1. Fetch Jobs
  const { data: jobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['scrape-jobs'],
    queryFn: async () => {
      const res = await api.get('/scrape/jobs')
      return res.data.data.jobs as ScrapeJob[]
    },
    refetchInterval: (query) => {
      // Auto-poll every 3s if any job is queued or running
      const hasActive = query.state.data?.some(
        (j) => j.status === 'queued' || j.status === 'running'
      )
      return hasActive ? 3000 : false
    },
  })

  // 2. Fetch Recipes
  const { data: recipes = [], refetch: refetchRecipes } = useQuery({
    queryKey: ['scrape-recipes'],
    queryFn: async () => {
      const res = await api.get('/scrape/recipes')
      return res.data.data.recipes as ScrapeRecipe[]
    },
  })

  // 3. Fetch Tasks for selected Job in modal
  const { data: jobTasksData, isLoading: loadingTasks, refetch: refetchTasks } = useQuery({
    queryKey: ['scrape-job-tasks', viewTasksJobId],
    queryFn: async () => {
      if (!viewTasksJobId) return null
      const res = await api.get(`/scrape/jobs/${viewTasksJobId}`)
      return res.data.data as { job: ScrapeJob; tasks: ScrapeTask[] }
    },
    enabled: Boolean(viewTasksJobId),
    refetchInterval: 3000,
  })

  // ─── SSE Streaming for Active Jobs ─────────────────────────────────────────
  const activeJobId = jobs.find((j) => j.status === 'running' || j.status === 'queued')?._id
  useEffect(() => {
    if (!activeJobId) return

    const baseURL = (api.defaults.baseURL || '').replace(/\/$/, '')
    const token = getAccessToken() || (api.defaults.headers.common as any)?.Authorization?.replace(/^Bearer\s+/i, '') || ''
    const streamUrl = token
      ? `${baseURL}/scrape/jobs/${activeJobId}/events?token=${encodeURIComponent(token)}`
      : `${baseURL}/scrape/jobs/${activeJobId}/events`

    const eventSource = new EventSource(streamUrl)
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.status === 'completed' || payload.status === 'cancelled' || payload.status === 'failed') {
          queryClient.invalidateQueries({ queryKey: ['scrape-jobs'] })
          queryClient.invalidateQueries({ queryKey: ['datasets-list'] })
          onProspectsUpdated?.()
        } else {
          queryClient.setQueryData(['scrape-jobs'], (old: ScrapeJob[] | undefined) => {
            if (!old) return old
            return old.map((j) =>
              j._id === activeJobId
                ? { ...j, status: payload.status, counts: payload.counts || j.counts }
                : j
            )
          })
        }
      } catch (err) {
        console.error('SSE JSON parse error', err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [activeJobId, queryClient, onProspectsUpdated])

  // ─── Actions ──────────────────────────────────────────────────────────────

  // Analyze URL
  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputUrl.trim()) return

    setAnalyzing(true)
    setAnalyzeError(null)
    setAnalyzeResult(null)

    try {
      const endpoint = analyzeMode === 'prospect' ? '/scrape/preview' : '/scrape/analyze'
      const res = await api.post(endpoint, { url: inputUrl.trim() })
      setAnalyzeResult(res.data.data)
      if (analyzeMode === 'prospect') {
        setAnalyzeActiveSubTab('contacts')
      } else {
        setAnalyzeActiveSubTab('tables')
      }
    } catch (err: any) {
      setAnalyzeError(err.response?.data?.message || err.message || 'Failed to inspect website.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Describe with AI
  const handleDescribe = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!describeUrl.trim() || !describeInstruction.trim()) return

    setDescribing(true)
    setDescribeError(null)
    setDescribeResult(null)

    try {
      const colNames = describeColumns
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)

      const res = await api.post('/scrape/describe', {
        url: describeUrl.trim(),
        instruction: describeInstruction.trim(),
        columnNames: colNames,
      })

      setDescribeResult(res.data.data)
      setSaveRecipeName(`${new URL(describeUrl.startsWith('http') ? describeUrl : `https://${describeUrl}`).hostname} Recipe`)
    } catch (err: any) {
      setDescribeError(err.response?.data?.message || err.message || 'AI failed to construct recipe.')
    } finally {
      setDescribing(false)
    }
  }

  // Save Recipe
  const handleSaveRecipe = async () => {
    if (!describeResult?.recipe || !saveRecipeName.trim()) return
    setIsSavingRecipe(true)
    try {
      let domain = ''
      try {
        domain = new URL(describeUrl.startsWith('http') ? describeUrl : `https://${describeUrl}`).hostname
      } catch {}

      await api.post('/scrape/recipes', {
        name: saveRecipeName.trim(),
        domain,
        instruction: describeInstruction,
        recipe: describeResult.recipe,
      })

      refetchRecipes()
      alert('Recipe successfully saved!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save recipe.')
    } finally {
      setIsSavingRecipe(false)
    }
  }

  // Send Rows to Data Cleaning
  const handleSendToCleaning = async (name: string, rows: any[], columns?: any[]) => {
    try {
      if (!rows || rows.length === 0) {
        alert('No rows to send to Data Cleaning.')
        return
      }

      const res = await api.post('/datasets/create', {
        name,
        rows,
        columns,
      })

      const dataset = res.data.data.dataset
      queryClient.invalidateQueries({ queryKey: ['datasets-list'] })
      onNavigateToCleaning(dataset._id)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create dataset in Data Cleaning.')
    }
  }

  // Create Scrape Job
  const handleCreateJob = async () => {
    const urls = newJobUrls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)

    if (urls.length === 0) {
      alert('Please enter at least one URL or domain to scrape.')
      return
    }

    try {
      let payload: any = {
        name: newJobName.trim() || `Scrape Job (${new Date().toLocaleDateString()})`,
        inputType: newJobMode === 'prospect' ? 'urls' : 'any_url',
        inputs: urls,
        options: {
          maxPagesPerSite: newJobMaxPages,
          useAI: newJobUseAI,
        },
      }

      if (newJobMode === 'instruction') {
        if (!newJobInstruction.trim()) {
          alert('Please enter an extraction instruction.')
          return
        }
        payload.instruction = newJobInstruction.trim()
      } else if (newJobMode === 'recipe') {
        const recipeObj = recipes.find((r) => r._id === selectedRecipeId)?.recipe || describeResult?.recipe
        if (!recipeObj) {
          alert('Please select or specify a valid recipe.')
          return
        }
        payload.recipe = recipeObj
      }

      await api.post('/scrape/jobs', payload)
      setShowNewJobModal(false)
      setNewJobUrls('')
      setNewJobName('')
      setNewJobInstruction('')
      setActiveTab('jobs')
      refetchJobs()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create scrape job.')
    }
  }

  // Test on 1 URL
  const handleTestOneUrl = async () => {
    const firstUrl = newJobUrls.split('\n').map((u) => u.trim()).filter(Boolean)[0]
    if (!firstUrl) {
      alert('Please enter a URL in the textarea to test.')
      return
    }

    setTestingUrl(true)
    setTestResult(null)
    try {
      if (newJobMode === 'instruction') {
        if (!newJobInstruction.trim()) {
          alert('Please enter an extraction instruction to test.')
          return
        }
        const res = await api.post('/scrape/describe', {
          url: firstUrl,
          instruction: newJobInstruction.trim(),
        })
        setTestResult({ mode: 'instruction', data: res.data.data })
      } else if (newJobMode === 'recipe') {
        const recipeObj = recipes.find((r) => r._id === selectedRecipeId)?.recipe || describeResult?.recipe
        if (!recipeObj) {
          alert('Please select a recipe first.')
          return
        }
        const res = await api.post('/scrape/analyze', { url: firstUrl, recipe: recipeObj })
        setTestResult({ mode: 'recipe', data: { ...res.data.data, rows: res.data.data?.recipeRows || [] } })
      } else {
        const res = await api.post('/scrape/preview', { url: firstUrl })
        setTestResult({ mode: 'prospect', data: res.data.data })
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Test scrape failed.')
    } finally {
      setTestingUrl(false)
    }
  }

  // Cancel Job
  const handleCancelJob = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this scraping job?')) return
    try {
      await api.post(`/scrape/jobs/${id}/cancel`)
      refetchJobs()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel job.')
    }
  }

  // Retry Failed
  const handleRetryFailed = async (id: string) => {
    try {
      await api.post(`/scrape/jobs/${id}/retry-failed`)
      refetchJobs()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry job.')
    }
  }

  // Delete Job
  const handleDeleteJob = async (id: string) => {
    if (!window.confirm('Delete this scrape job? Any generated dataset in Data Cleaning will be kept.')) return
    try {
      await api.delete(`/scrape/jobs/${id}`)
      refetchJobs()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete job.')
    }
  }

  // Delete Recipe
  const handleDeleteRecipe = async (id: string) => {
    if (!window.confirm('Delete this saved recipe?')) return
    try {
      await api.delete(`/scrape/recipes/${id}`)
      refetchRecipes()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete recipe.')
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Top Header & Tab Navigation ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-2xs">
            <Globe size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              Web Scraper Engine
              <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                Live Politeness & SSRF Protected
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              Extract verified prospect contacts, structured tables, or use AI Cheerio recipes on any target website.
            </p>
          </div>
        </div>

        {/* Action Button: New Scrape Job */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setNewJobUrls(inputUrl || '')
              setShowNewJobModal(true)
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={14} /> New Scrape Job
          </button>
        </div>
      </div>

      {/* ── Secondary Sub-Tabs ── */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analyze'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye size={13} /> Live Analyze & Preview
          </button>
          <button
            onClick={() => setActiveTab('describe')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'describe'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles size={13} /> Describe with AI (Cheerio Recipe)
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'jobs'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers size={13} /> Scrape Jobs
            <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 rounded-full text-[10px]">
              {jobs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'recipes'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code size={13} /> Saved Recipes
            <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 rounded-full text-[10px]">
              {recipes.length}
            </span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: LIVE ANALYZE & PREVIEW */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'analyze' && (
        <div className="space-y-4">
          {/* URL Search Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
            <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Enter URL or domain to analyze (e.g. techcrunch.com, https://example.com/blog)..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setAnalyzeMode('prospect')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    analyzeMode === 'prospect' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600'
                  }`}
                >
                  Prospect Deep Scan
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyzeMode('any')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    analyzeMode === 'any' ? 'bg-white text-indigo-700 shadow-2xs font-semibold' : 'text-gray-600'
                  }`}
                >
                  Auto-Detect Elements
                </button>
              </div>

              <button
                type="submit"
                disabled={analyzing || !inputUrl.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Scanning…
                  </>
                ) : (
                  <>
                    <Search size={13} /> Inspect URL
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <div className="flex items-center gap-3">
                <span>• Subpage crawl: /contact, /about, /write-for-us, /guest-post</span>
                <span>• Strict robots.txt compliance & 15s timeout</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDescribeUrl(inputUrl)
                  setActiveTab('describe')
                }}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} /> Want custom fields? Describe with AI →
              </button>
            </div>
          </div>

          {/* Analyze Error Banner */}
          {analyzeError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <XCircle size={15} />
              <span>{analyzeError}</span>
            </div>
          )}

          {/* Analyze Result View */}
          {analyzeResult && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm space-y-4 p-4">
              {/* Meta Banner */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{analyzeResult.domain || inputUrl}</span>
                    {analyzeResult.cms && (
                      <span className="px-2 py-0.5 text-[10px] bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold">
                        CMS: {analyzeResult.cms}
                      </span>
                    )}
                    {analyzeResult.language && (
                      <span className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold uppercase">
                        Lang: {analyzeResult.language}
                      </span>
                    )}
                    {analyzeResult.pagesVisited && (
                      <span className="px-2 py-0.5 text-[10px] bg-gray-200 text-gray-700 rounded font-semibold">
                        {analyzeResult.pagesVisited.length} pages checked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{analyzeResult.title || 'No page title'}</p>
                  {analyzeResult.description && (
                    <p className="text-[11px] text-gray-400 line-clamp-1">{analyzeResult.description}</p>
                  )}
                </div>

                {/* Send to Data Cleaning Action */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const phone = analyzeResult.primaryPhone || (analyzeResult.phones && analyzeResult.phones[0]) || ''
                      const address = analyzeResult.address || (analyzeResult.addresses && analyzeResult.addresses[0]) || ''
                      if (analyzeResult.emails && analyzeResult.emails.length > 0) {
                        const rows = analyzeResult.emails.map((em: any) => ({
                          Domain: analyzeResult.domain,
                          Email: em.email,
                          Phone: phone,
                          Address: address,
                          Type: em.isRole ? 'Role/Generic' : 'Personal',
                          SourceUrl: em.sourceUrl,
                          Title: analyzeResult.title || '',
                          ContactPage: analyzeResult.contactPageUrl || '',
                          GuestPostPage: analyzeResult.guestPostPageUrl || '',
                          LinkedIn: analyzeResult.linkedin || '',
                          Twitter: analyzeResult.twitter || '',
                          Facebook: analyzeResult.facebook || '',
                          Instagram: analyzeResult.instagram || '',
                          YouTube: analyzeResult.youtube || '',
                          TikTok: analyzeResult.tiktok || '',
                          GitHub: analyzeResult.github || '',
                          WhatsApp: analyzeResult.whatsapp || analyzeResult.socials?.whatsapp || '',
                          Telegram: analyzeResult.telegram || analyzeResult.socials?.telegram || '',
                          Discord: analyzeResult.discord || analyzeResult.socials?.discord || '',
                          Threads: analyzeResult.threads || analyzeResult.socials?.threads || '',
                          AllSocials: (analyzeResult.allSocials || []).map((s: any) => s.url).join(', '),
                        }))
                        handleSendToCleaning(`Contacts: ${analyzeResult.domain}`, rows)
                      } else {
                        const rows = [
                          {
                            Domain: analyzeResult.domain || inputUrl,
                            Email: analyzeResult.primaryEmail || 'None found',
                            Phone: phone,
                            Address: address,
                            Title: analyzeResult.title || '',
                            ContactPage: analyzeResult.contactPageUrl || '',
                            GuestPostPage: analyzeResult.guestPostPageUrl || '',
                            LinkedIn: analyzeResult.linkedin || '',
                            Twitter: analyzeResult.twitter || '',
                            Facebook: analyzeResult.facebook || '',
                            Instagram: analyzeResult.instagram || '',
                            YouTube: analyzeResult.youtube || '',
                            TikTok: analyzeResult.tiktok || '',
                            GitHub: analyzeResult.github || '',
                            WhatsApp: analyzeResult.whatsapp || analyzeResult.socials?.whatsapp || '',
                            Telegram: analyzeResult.telegram || analyzeResult.socials?.telegram || '',
                            Discord: analyzeResult.discord || analyzeResult.socials?.discord || '',
                            Threads: analyzeResult.threads || analyzeResult.socials?.threads || '',
                            AllSocials: (analyzeResult.allSocials || []).map((s: any) => s.url).join(', '),
                            Author: analyzeResult.author || '',
                          },
                        ]
                        handleSendToCleaning(`Prospect: ${analyzeResult.domain || inputUrl}`, rows)
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet size={13} /> Send to Data Cleaning
                  </button>
                </div>
              </div>

              {/* Sub-tab navigation */}
              <div className="flex items-center gap-1 border-b border-gray-200 pb-2 overflow-x-auto text-xs">
                <button
                  onClick={() => setAnalyzeActiveSubTab('contacts')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    analyzeActiveSubTab === 'contacts'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Mail size={13} /> Contacts & Socials
                  <span className="px-1.5 py-0.2 bg-gray-200 rounded-full text-[10px]">
                    {analyzeResult.emails?.length || (analyzeResult.primaryEmail ? 1 : 0)}
                  </span>
                </button>
                {analyzeResult.tables && (
                  <button
                    onClick={() => setAnalyzeActiveSubTab('tables')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      analyzeActiveSubTab === 'tables'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <TableIcon size={13} /> Tables
                    <span className="px-1.5 py-0.2 bg-gray-200 rounded-full text-[10px]">
                      {analyzeResult.tables.length}
                    </span>
                  </button>
                )}
                {analyzeResult.lists && (
                  <button
                    onClick={() => setAnalyzeActiveSubTab('lists')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      analyzeActiveSubTab === 'lists'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <ListIcon size={13} /> Lists & Cards
                    <span className="px-1.5 py-0.2 bg-gray-200 rounded-full text-[10px]">
                      {analyzeResult.lists.length}
                    </span>
                  </button>
                )}
                {analyzeResult.links && (
                  <button
                    onClick={() => setAnalyzeActiveSubTab('links')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      analyzeActiveSubTab === 'links'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Link2 size={13} /> Links
                    <span className="px-1.5 py-0.2 bg-gray-200 rounded-full text-[10px]">
                      {Array.isArray(analyzeResult.links)
                        ? analyzeResult.links.length
                        : (analyzeResult.links.internal?.length || 0) + (analyzeResult.links.external?.length || 0)}
                    </span>
                  </button>
                )}
                {analyzeResult.structuredData && (
                  <button
                    onClick={() => setAnalyzeActiveSubTab('schema')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      analyzeActiveSubTab === 'schema'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Code size={13} /> JSON-LD Schema
                    <span className="px-1.5 py-0.2 bg-gray-200 rounded-full text-[10px]">
                      {analyzeResult.structuredData.length}
                    </span>
                  </button>
                )}
              </div>

              {/* Sub-tab 1: Contacts & Socials */}
              {analyzeActiveSubTab === 'contacts' && (
                <div className="space-y-4">
                  {/* Social & Special URLs row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <span className="font-bold text-gray-700 block">Outreach Discovery Pages</span>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Contact Page:</span>
                        {analyzeResult.contactPageUrl ? (
                          <a
                            href={analyzeResult.contactPageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1 max-w-[200px] truncate"
                          >
                            {analyzeResult.contactPageUrl} <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-gray-400">None detected</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Guest Post / Write For Us:</span>
                        {analyzeResult.guestPostPageUrl ? (
                          <a
                            href={analyzeResult.guestPostPageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 max-w-[200px] truncate"
                          >
                            {analyzeResult.guestPostPageUrl} <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-gray-400">None detected</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Author Name:</span>
                        <span className="font-medium text-gray-800">{analyzeResult.author || 'None'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Address:</span>
                        {analyzeResult.address || (analyzeResult.addresses && analyzeResult.addresses[0]) ? (
                          <span className="font-medium text-gray-800 max-w-[200px] truncate" title={analyzeResult.address || analyzeResult.addresses[0]}>
                            {analyzeResult.address || analyzeResult.addresses[0]}
                          </span>
                        ) : (
                          <span className="text-gray-400">None detected</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <span className="font-bold text-gray-700 block">Verified Social Channels</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">LinkedIn:</span>
                          {analyzeResult.linkedin || analyzeResult.socials?.linkedin ? (
                            <a href={analyzeResult.linkedin || analyzeResult.socials?.linkedin} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.linkedin || analyzeResult.socials?.linkedin} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">Twitter / X:</span>
                          {analyzeResult.twitter || analyzeResult.socials?.twitter ? (
                            <a href={analyzeResult.twitter || analyzeResult.socials?.twitter} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.twitter || analyzeResult.socials?.twitter} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">Facebook:</span>
                          {analyzeResult.facebook || analyzeResult.socials?.facebook ? (
                            <a href={analyzeResult.facebook || analyzeResult.socials?.facebook} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.facebook || analyzeResult.socials?.facebook} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">Instagram:</span>
                          {analyzeResult.instagram || analyzeResult.socials?.instagram ? (
                            <a href={analyzeResult.instagram || analyzeResult.socials?.instagram} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.instagram || analyzeResult.socials?.instagram} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">YouTube:</span>
                          {analyzeResult.youtube || analyzeResult.socials?.youtube ? (
                            <a href={analyzeResult.youtube || analyzeResult.socials?.youtube} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.youtube || analyzeResult.socials?.youtube} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">TikTok:</span>
                          {analyzeResult.tiktok || analyzeResult.socials?.tiktok ? (
                            <a href={analyzeResult.tiktok || analyzeResult.socials?.tiktok} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.tiktok || analyzeResult.socials?.tiktok} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">GitHub:</span>
                          {analyzeResult.github || analyzeResult.socials?.github ? (
                            <a href={analyzeResult.github || analyzeResult.socials?.github} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.github || analyzeResult.socials?.github} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">Pinterest:</span>
                          {analyzeResult.pinterest || analyzeResult.socials?.pinterest ? (
                            <a href={analyzeResult.pinterest || analyzeResult.socials?.pinterest} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.pinterest || analyzeResult.socials?.pinterest} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">WhatsApp:</span>
                          {analyzeResult.whatsapp || analyzeResult.socials?.whatsapp ? (
                            <a href={analyzeResult.whatsapp || analyzeResult.socials?.whatsapp} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.whatsapp || analyzeResult.socials?.whatsapp} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">Telegram:</span>
                          {analyzeResult.telegram || analyzeResult.socials?.telegram ? (
                            <a href={analyzeResult.telegram || analyzeResult.socials?.telegram} target="_blank" rel="noreferrer" className="text-sky-600 font-medium hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.telegram || analyzeResult.socials?.telegram} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">Discord:</span>
                          {analyzeResult.discord || analyzeResult.socials?.discord ? (
                            <a href={analyzeResult.discord || analyzeResult.socials?.discord} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.discord || analyzeResult.socials?.discord} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">Threads:</span>
                          {analyzeResult.threads || analyzeResult.socials?.threads ? (
                            <a href={analyzeResult.threads || analyzeResult.socials?.threads} target="_blank" rel="noreferrer" className="text-gray-800 hover:underline flex items-center gap-1 truncate max-w-[140px]">
                              {analyzeResult.threads || analyzeResult.socials?.threads} <ExternalLink size={10} />
                            </a>
                          ) : <span className="text-gray-400">—</span>}
                        </div>
                      </div>

                      {/* All Discovered Social Profile URLs */}
                      {analyzeResult.allSocials && analyzeResult.allSocials.length > 0 && (
                        <div className="pt-2 border-t border-gray-200 mt-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                            All Discovered Profiles ({analyzeResult.allSocials.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {analyzeResult.allSocials.map((prof: any, pIdx: number) => (
                              <a
                                key={pIdx}
                                href={prof.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-2xs max-w-[180px] truncate"
                                title={prof.url}
                              >
                                <span className="font-semibold capitalize text-indigo-700">{prof.network}:</span>
                                <span className="truncate">{prof.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                <ExternalLink size={8} className="shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Address Section */}
                  {(analyzeResult.address || (analyzeResult.addresses && analyzeResult.addresses.length > 0)) && (
                    <div className="border border-indigo-200 bg-indigo-50/30 rounded-xl overflow-hidden">
                      <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-200 flex items-center justify-between">
                        <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                          <MapPin size={13} className="text-indigo-600" /> Extracted Company Address
                        </span>
                        {analyzeResult.addresses && analyzeResult.addresses.length > 1 && (
                          <span className="text-[11px] text-indigo-700 font-medium">
                            {analyzeResult.addresses.length} locations found
                          </span>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        {(analyzeResult.addresses?.length ? analyzeResult.addresses : [analyzeResult.address]).map((addr: string, aIdx: number) => (
                          <div key={aIdx} className="flex items-center justify-between px-3 py-2 bg-white border border-indigo-200/80 rounded-lg text-xs shadow-2xs">
                            <span className="font-medium text-gray-800 flex items-center gap-2">
                              <MapPin size={12} className="text-indigo-500 shrink-0" />
                              {addr}
                            </span>
                            <button
                              onClick={() => handleCopy(addr, `addr_${aIdx}`)}
                              className="text-gray-400 hover:text-gray-700 cursor-pointer ml-2 p-1 shrink-0"
                              title="Copy address"
                            >
                              {copiedKey === `addr_${aIdx}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Phone Numbers Section */}
                  {((analyzeResult.phones && analyzeResult.phones.length > 0) || analyzeResult.primaryPhone) && (
                    <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl overflow-hidden">
                      <div className="bg-emerald-50 px-3 py-2 border-b border-emerald-200 flex items-center justify-between">
                        <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                          <Phone size={13} className="text-emerald-600" /> Extracted Phone Numbers
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          {(analyzeResult.phones?.length) || (analyzeResult.primaryPhone ? 1 : 0)} phone(s) found
                        </span>
                      </div>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {(analyzeResult.phones?.length ? analyzeResult.phones : [analyzeResult.primaryPhone]).map((ph: string, pIdx: number) => (
                          <div key={pIdx} className="flex items-center justify-between px-3 py-2 bg-white border border-emerald-200/80 rounded-lg text-xs shadow-2xs">
                            <a href={`tel:${ph}`} className="font-mono font-semibold text-gray-900 hover:text-emerald-700 flex items-center gap-1.5 truncate">
                              <Phone size={11} className="text-emerald-500 shrink-0" /> {ph}
                            </a>
                            <button
                              onClick={() => handleCopy(ph, `phone_${pIdx}`)}
                              className="text-gray-400 hover:text-gray-700 cursor-pointer ml-2 p-1"
                              title="Copy phone number"
                            >
                              {copiedKey === `phone_${pIdx}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emails Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                      <span className="font-bold text-gray-700 text-xs">Extracted Emails</span>
                      <span className="text-[11px] text-gray-500">
                        {analyzeResult.emails?.length || (analyzeResult.primaryEmail ? 1 : 0)} email(s) found
                      </span>
                    </div>

                    {analyzeResult.emails && analyzeResult.emails.length > 0 ? (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Email</th>
                            <th className="px-3 py-2 font-semibold">Type</th>
                            <th className="px-3 py-2 font-semibold">Discovered On Page</th>
                            <th className="px-3 py-2 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {analyzeResult.emails.map((em: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-mono font-medium text-gray-900">{em.email}</td>
                              <td className="px-3 py-2">
                                {em.isRole ? (
                                  <span className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold">
                                    Role / Generic
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold">
                                    Personal / Named
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-500 truncate max-w-xs">{em.sourceUrl}</td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() => handleCopy(em.email, `email_${idx}`)}
                                  className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                  title="Copy email"
                                >
                                  {copiedKey === `email_${idx}` ? <Check size={13} className="text-emerald-600 inline" /> : <Copy size={13} className="inline" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : analyzeResult.primaryEmail ? (
                      <div className="p-3 text-xs flex items-center justify-between">
                        <span className="font-mono font-medium text-gray-900">{analyzeResult.primaryEmail}</span>
                        <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold">
                          Primary Email
                        </span>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-gray-400">
                        No direct mailto or plaintext emails were detected on checked pages.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Detected Tables */}
              {analyzeActiveSubTab === 'tables' && (
                <div className="space-y-4">
                  {analyzeResult.tables && analyzeResult.tables.length > 0 ? (
                    analyzeResult.tables.map((tbl: any, idx: number) => {
                      const headers = tbl.columns || []
                      const rowObjects = tbl.rows || []
                      return (
                        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                            <span className="font-bold text-gray-800 text-xs">
                              {tbl.name || `Table #${idx + 1}`} ({rowObjects.length} rows, {headers.length} columns)
                            </span>
                            <button
                              onClick={() => {
                                const columns = headers.map((h: string, cIdx: number) => ({
                                  id: `col_${cIdx}`,
                                  name: h || `Column ${cIdx + 1}`,
                                }))
                                const formattedRows = rowObjects.map((r: any) => {
                                  const rowObj: any = {}
                                  headers.forEach((h: string) => {
                                    rowObj[h] = r[h] ?? ''
                                  })
                                  return rowObj
                                })
                                handleSendToCleaning(`Table from ${analyzeResult.domain || 'Site'}`, formattedRows, columns)
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              <FileSpreadsheet size={12} /> Send Table to Data Cleaning
                            </button>
                          </div>

                          <div className="overflow-x-auto max-h-60">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-gray-100 text-gray-700 border-b border-gray-200 sticky top-0">
                                <tr>
                                  {headers.map((h: string, hIdx: number) => (
                                    <th key={hIdx} className="px-2.5 py-1.5 font-semibold">
                                      {h || `Col ${hIdx + 1}`}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {rowObjects.slice(0, 15).map((row: any, rIdx: number) => (
                                  <tr key={rIdx} className="hover:bg-gray-50">
                                    {headers.map((h: string, cIdx: number) => (
                                      <td key={cIdx} className="px-2.5 py-1.5 text-gray-800 truncate max-w-xs">
                                        {String(row[h] ?? '')}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-gray-400">No HTML tables detected on this page.</div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Detected Lists */}
              {analyzeActiveSubTab === 'lists' && (
                <div className="space-y-3">
                  {analyzeResult.lists && analyzeResult.lists.length > 0 ? (
                    analyzeResult.lists.map((lst: any, idx: number) => {
                      const items = lst.rows || lst.items || []
                      return (
                        <div key={idx} className="border border-gray-200 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-800 text-xs">
                              {lst.name || `Repeated Structure #${idx + 1}`} ({items.length} items)
                            </span>
                            <button
                              onClick={() => {
                                const rows = items.map((it: any) => (typeof it === 'string' ? { Item: it } : it))
                                handleSendToCleaning(`List from ${analyzeResult.domain || 'Site'}`, rows)
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              <FileSpreadsheet size={12} /> Send to Data Cleaning
                            </button>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 text-xs">
                            {items.slice(0, 10).map((it: any, iIdx: number) => (
                              <div key={iIdx} className="text-gray-700 truncate border-b border-gray-200/50 pb-1">
                                {typeof it === 'string' ? it : it.Title || JSON.stringify(it)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-gray-400">No repeated card/list patterns detected.</div>
                  )}
                </div>
              )}

              {/* Sub-tab 4: Links */}
              {analyzeActiveSubTab === 'links' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {(() => {
                    const linksArr = Array.isArray(analyzeResult.links) ? analyzeResult.links : []
                    const internal = Array.isArray(analyzeResult.links?.internal)
                      ? analyzeResult.links.internal
                      : linksArr.filter((l: any) => l.Type === 'Internal')
                    const external = Array.isArray(analyzeResult.links?.external)
                      ? analyzeResult.links.external
                      : linksArr.filter((l: any) => l.Type === 'External')
                    return (
                      <>
                        <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                          <span className="font-bold text-gray-700 block">
                            Internal Links ({internal.length})
                          </span>
                          <div className="max-h-60 overflow-y-auto space-y-1.5">
                            {internal.slice(0, 30).map((l: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] border-b border-gray-100 pb-1 gap-2">
                                <span className="truncate max-w-[200px] text-gray-800">{l.Anchor || l.text || l.URL || l.href}</span>
                                <a href={l.URL || l.href} target="_blank" rel="noreferrer" className="text-gray-500 font-mono text-[10px] truncate max-w-[180px] hover:text-indigo-600">
                                  {l.URL || l.href}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                          <span className="font-bold text-gray-700 block">
                            External Outbound Links ({external.length})
                          </span>
                          <div className="max-h-60 overflow-y-auto space-y-1.5">
                            {external.slice(0, 30).map((l: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] border-b border-gray-100 pb-1 gap-2">
                                <span className="truncate max-w-[200px] text-gray-800">{l.Anchor || l.text || l.URL || l.href}</span>
                                <a href={l.URL || l.href} target="_blank" rel="noreferrer" className="text-indigo-600 font-mono text-[10px] truncate max-w-[180px]">
                                  {l.URL || l.href}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Sub-tab 5: JSON-LD */}
              {analyzeActiveSubTab === 'schema' && (
                <div className="space-y-3">
                  {analyzeResult.structuredData && analyzeResult.structuredData.length > 0 ? (
                    analyzeResult.structuredData.map((schema: any, idx: number) => (
                      <div key={idx} className="bg-gray-900 text-gray-100 p-3 rounded-xl font-mono text-xs overflow-x-auto">
                        <pre>{JSON.stringify(schema, null, 2)}</pre>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-gray-400">No JSON-LD structured data detected.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: DESCRIBE WITH AI (CHEERIO RECIPE GENERATOR) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'describe' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <Bot size={16} /> Describe What to Extract in Natural Language (Generic & Adaptive)
            </div>
            <p className="text-xs text-gray-500">
              Tell AI what you want to extract in plain language. Supports any generic instruction from any user — company overview, team members, services, pricing, articles, products, or contact details. No rigid commands required.
            </p>

            <form onSubmit={handleDescribe} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Target Page URL</label>
                <input
                  type="text"
                  placeholder="https://example.com or http://alilogicsinfotech.com/"
                  value={describeUrl}
                  onChange={(e) => setDescribeUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-gray-700">
                    Extraction Instruction (Plain Language)
                  </label>
                  <span className="text-[10px] text-gray-400">Write any natural language instruction — flexible & generic</span>
                </div>
                <textarea
                  rows={3}
                  placeholder='e.g. "Extract company overview, address, and contact info" or "Extract team members, job titles, and LinkedIn or email" or "Extract products, prices, and descriptions"'
                  value={describeInstruction}
                  onChange={(e) => setDescribeInstruction(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                />
                {/* Quick Example Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                  <span className="text-[10px] text-gray-400 font-medium">Quick examples:</span>
                  {[
                    { label: 'Company Overview & Contacts', text: 'Extract company name, about overview, address, phone number, and social links', cols: 'company, overview, address, phone, socials' },
                    { label: 'Team Members', text: 'Extract person name, job title, and linkedin or email', cols: 'name, role, contact' },
                    { label: 'Articles & Blogs', text: 'Extract blog article title, author name, publication date, and article URL', cols: 'title, author, date, url' },
                    { label: 'Product Catalog', text: 'Extract product title, price, in-stock availability, and product link', cols: 'title, price, stock, url' },
                    { label: 'Services Offered', text: 'Extract service title, description, and link', cols: 'service, description, url' },
                  ].map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDescribeInstruction(ex.text)
                        setDescribeColumns(ex.cols)
                      }}
                      className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 rounded border border-gray-200 transition-colors cursor-pointer"
                    >
                      + {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Optional Target Columns (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. title, author, date, url"
                  value={describeColumns}
                  onChange={(e) => setDescribeColumns(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={describing || !describeUrl.trim() || !describeInstruction.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {describing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Generating Recipe & 10-Row Preview…
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} /> Generate Cheerio Recipe
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {describeError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <XCircle size={15} />
              <span>{describeError}</span>
            </div>
          )}

          {/* Recipe Generated View */}
          {describeResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    AI Cheerio Recipe Generated
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold">
                      Confidence: {Math.round((describeResult.confidence || 0.9) * 100)}%
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{describeResult.explanation}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (describeResult.previewRows && describeResult.previewRows.length > 0) {
                        handleSendToCleaning(`AI Scrape: ${describeUrl}`, describeResult.previewRows)
                      }
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Send 10 Rows to Cleaning
                  </button>
                  <button
                    onClick={() => {
                      setNewJobUrls(describeUrl)
                      setNewJobMode('recipe')
                      setShowNewJobModal(true)
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Start Full Scrape Job
                  </button>
                </div>
              </div>

              {/* Recipe Selector Spec */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700">Cheerio Selector Schema</span>
                  <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Row Selector: {describeResult.recipe?.rowSelector}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {describeResult.recipe?.fields?.map((f: any, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-2 font-mono text-[11px] space-y-0.5">
                      <div className="font-bold text-gray-900">{f.name}</div>
                      <div className="text-gray-500 truncate" title={f.selector}>
                        sel: {f.selector}
                      </div>
                      <div className="text-gray-400">attr: {f.attr || 'text'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 10-Row Preview Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 font-bold text-gray-700 text-xs">
                  Live Preview Output ({describeResult.previewRows?.length || 0} rows extracted)
                </div>
                <div className="overflow-x-auto max-h-64">
                  {describeResult.previewRows && describeResult.previewRows.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <tr>
                          {Object.keys(describeResult.previewRows[0] || {}).map((k) => (
                            <th key={k} className="px-3 py-2 font-semibold">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {describeResult.previewRows.map((r: any, rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-gray-50">
                            {Object.values(r).map((val: any, cIdx: number) => (
                              <td key={cIdx} className="px-3 py-2 text-gray-800 truncate max-w-xs">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-400">
                      No matching rows found with these selectors. You may tweak your instruction above.
                    </div>
                  )}
                </div>
              </div>

              {/* Save Recipe Form */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Recipe name (e.g. My Website Articles Recipe)"
                  value={saveRecipeName}
                  onChange={(e) => setSaveRecipeName(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg flex-1 max-w-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  disabled={isSavingRecipe || !saveRecipeName.trim()}
                  className="px-3.5 py-1.5 bg-gray-900 hover:bg-black disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isSavingRecipe ? 'Saving…' : 'Save as Reusable Recipe'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: SCRAPE JOBS (ACTIVE & HISTORY) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
              <Globe size={32} className="mx-auto text-gray-400" />
              <h3 className="font-bold text-gray-800 text-sm">No Scrape Jobs Yet</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Launch a deep prospect crawl or run a custom recipe on a list of websites. All extracted records flow directly into a Data Cleaning dataset.
              </p>
              <button
                onClick={() => setShowNewJobModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                + Create First Scrape Job
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const total = job.counts.total || job.inputs?.length || 1
                const done = job.counts.done || 0
                const percent = Math.min(100, Math.round((done / total) * 100))

                return (
                  <div
                    key={job._id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3 transition-all hover:border-gray-300"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-sm">{job.name}</h4>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded font-semibold uppercase ${
                              job.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : job.status === 'running'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse'
                                : job.status === 'failed'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {job.status}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Mode: {job.inputType === 'prospects' ? 'Prospect Enrich' : job.inputType === 'any_url' ? 'Recipe' : 'Deep Scan'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Started: {new Date(job.createdAt).toLocaleString()} • {job.inputs?.length || 0} targets
                        </p>
                      </div>

                      {/* Job Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Open in Data Cleaning CTA */}
                        {job.dataset && (
                          <button
                            onClick={() => onNavigateToCleaning(job.dataset?._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet size={13} /> Open in Data Cleaning ({job.counts.ok} rows)
                          </button>
                        )}

                        {/* Cancel Button */}
                        {(job.status === 'running' || job.status === 'queued') && (
                          <button
                            onClick={() => handleCancelJob(job._id)}
                            className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}

                        {/* Retry Failed Button */}
                        {job.counts.failed > 0 && job.status !== 'running' && (
                          <button
                            onClick={() => handleRetryFailed(job._id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <RotateCcw size={12} /> Retry Failed ({job.counts.failed})
                          </button>
                        )}

                        {/* View Tasks Details */}
                        <button
                          onClick={() => setViewTasksJobId(job._id)}
                          className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Tasks
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Job"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Breakdown */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="font-medium">
                          Progress: {done} / {total} ({percent}%)
                        </span>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-emerald-700 font-semibold">✓ {job.counts.ok} OK</span>
                          {job.counts.blocked > 0 && (
                            <span className="text-amber-700 font-semibold">⚠ {job.counts.blocked} Blocked</span>
                          )}
                          {job.counts.failed > 0 && (
                            <span className="text-rose-700 font-semibold">✗ {job.counts.failed} Failed</span>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            job.status === 'completed'
                              ? 'bg-emerald-500'
                              : job.status === 'failed'
                              ? 'bg-rose-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: SAVED RECIPES */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          {recipes.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
              <Code size={32} className="mx-auto text-gray-400" />
              <h3 className="font-bold text-gray-800 text-sm">No Saved Recipes</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Use the "Describe with AI" tab to create your first selector recipe for blog posts, catalogues, or directories.
              </p>
              <button
                onClick={() => setActiveTab('describe')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                Create Recipe with AI →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.map((rec) => (
                <div
                  key={rec._id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 text-sm">{rec.name}</h4>
                      {rec.domain && (
                        <span className="px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold">
                          {rec.domain}
                        </span>
                      )}
                    </div>
                    {rec.instruction && (
                      <p className="text-xs text-gray-500 line-clamp-2">"{rec.instruction}"</p>
                    )}
                    <div className="bg-gray-50 rounded-lg p-2 font-mono text-[11px] text-gray-700 space-y-1">
                      <div>Row Selector: {rec.recipe?.rowSelector}</div>
                      <div>Fields: {rec.recipe?.fields?.map((f) => f.name).join(', ')}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setViewRecipeModal(rec)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      View JSON Spec
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedRecipeId(rec._id)
                          setNewJobMode('recipe')
                          setShowNewJobModal(true)
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Run Job
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(rec._id)}
                        className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: NEW SCRAPE JOB */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Globe size={16} className="text-indigo-600" /> New Web Scrape Job
              </h3>
              <button
                onClick={() => setShowNewJobModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Job Name</label>
                <input
                  type="text"
                  placeholder="e.g. SaaS Blog Outreach Crawl"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Scraping Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewJobMode('prospect')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newJobMode === 'prospect'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Mail size={13} className="text-indigo-600" /> Prospect Scan
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Emails, socials, and /write-for-us subpages.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewJobMode('instruction')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newJobMode === 'instruction'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Sparkles size={13} className="text-indigo-600" /> AI Instruction
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Tell AI what to extract across target sites.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewJobMode('recipe')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newJobMode === 'recipe'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <Code size={13} className="text-indigo-600" /> Saved Recipe
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Run previously saved CSS selector schema.
                    </div>
                  </button>
                </div>
              </div>

              {newJobMode === 'instruction' && (
                <div className="space-y-1.5 bg-indigo-50/30 border border-indigo-100 p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-gray-800 text-[11px]">
                      Extraction Instruction (Plain Language)
                    </label>
                    <span className="text-[10px] text-indigo-600 font-medium">Applied generic extraction to each target site</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder='e.g. "Extract company overview, address, and phone" or "Extract article title, author, date, and link"'
                    value={newJobInstruction}
                    onChange={(e) => setNewJobInstruction(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs resize-none"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {[
                      'Overview & Contacts',
                      'Articles (title, author, date, link)',
                      'Catalog (product, price, stock, link)',
                      'Team Members (name, role, email)',
                      'Services (title, details)',
                    ].map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewJobInstruction(`Extract ${s.toLowerCase()}`)}
                        className="text-[10px] px-2 py-0.5 bg-white hover:bg-indigo-50 text-gray-600 rounded border border-gray-200 transition-colors cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {newJobMode === 'recipe' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Saved Recipe</label>
                  <select
                    value={selectedRecipeId}
                    onChange={(e) => setSelectedRecipeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">-- Choose a Saved Recipe --</option>
                    {recipes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name} ({r.domain || 'Global'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Target URLs / Domains (one per line, up to 100)
                </label>
                <textarea
                  rows={5}
                  placeholder={`techcrunch.com\nhttps://searchenginejournal.com\nblog.hubspot.com`}
                  value={newJobUrls}
                  onChange={(e) => setNewJobUrls(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Subpages per Site</label>
                  <select
                    value={newJobMaxPages}
                    onChange={(e) => setNewJobMaxPages(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
                  >
                    <option value={1}>1 page (Homepage only)</option>
                    <option value={3}>3 pages</option>
                    <option value={5}>5 pages</option>
                    <option value={10}>10 pages (Recommended)</option>
                    <option value={15}>15 pages</option>
                    <option value={25}>25 pages</option>
                    <option value={50}>50 pages (Deep Crawl)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newJobUseAI}
                      onChange={(e) => setNewJobUseAI(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Use AI Fallback Extraction
                  </label>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Extracts author and dates using Gemini when meta tags are missing.
                  </p>
                </div>
              </div>

              {/* Test 1 URL preview button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestOneUrl}
                  disabled={testingUrl || !newJobUrls.trim()}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer"
                >
                  {testingUrl ? 'Testing…' : 'Test on 1 URL'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewJobModal(false)}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateJob}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm cursor-pointer"
                  >
                    Start Scrape Job
                  </button>
                </div>
              </div>

              {/* Test on 1 URL preview result */}
              {testResult && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1 font-mono text-[11px] max-h-40 overflow-y-auto">
                  <div className="font-bold text-gray-800">Test Result Preview:</div>
                  <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: VIEW JOB TASKS BREAKDOWN */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {viewTasksJobId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {jobTasksData?.job?.name || 'Job Tasks Breakdown'}
                </h3>
                <p className="text-xs text-gray-500">
                  {jobTasksData?.tasks?.length || 0} target websites in this scraping run
                </p>
              </div>
              <button
                onClick={() => setViewTasksJobId(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl">
              {loadingTasks ? (
                <div className="p-12 text-center text-xs text-gray-500">
                  <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={20} />
                  Loading tasks…
                </div>
              ) : jobTasksData?.tasks?.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">No tasks found.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Target URL / Domain</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold">Pages Checked</th>
                      <th className="px-3 py-2 font-semibold">Result / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobTasksData?.tasks.map((t) => (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-[11px] text-gray-900">{t.domain || t.url}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded font-semibold uppercase ${
                              t.status === 'ok'
                                ? 'bg-emerald-50 text-emerald-700'
                                : t.status === 'no_contact'
                                ? 'bg-gray-100 text-gray-700'
                                : t.status === 'blocked'
                                ? 'bg-amber-50 text-amber-700'
                                : t.status === 'error' || t.status === 'timeout'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-[11px]">
                          {t.pagesVisited?.length || 0} page(s)
                        </td>
                        <td className="px-3 py-2 text-[11px] text-gray-600 truncate max-w-xs">
                          {t.error ? (
                            <span className="text-rose-600 font-medium">{t.error}</span>
                          ) : t.extractedData?.primaryEmail ? (
                            <span className="font-mono text-emerald-700 font-semibold">{t.extractedData.primaryEmail}</span>
                          ) : (
                            'Processed'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-gray-500">Live task updates every 3 seconds</span>
              <button
                onClick={() => setViewTasksJobId(null)}
                className="px-4 py-1.5 bg-gray-900 text-white rounded-lg font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: VIEW RECIPE JSON SPEC */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {viewRecipeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">{viewRecipeModal.name}</h3>
              <button
                onClick={() => setViewRecipeModal(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-xl p-3 font-mono text-xs max-h-72 overflow-y-auto">
              <pre>{JSON.stringify(viewRecipeModal.recipe, null, 2)}</pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewRecipeModal(null)}
                className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

