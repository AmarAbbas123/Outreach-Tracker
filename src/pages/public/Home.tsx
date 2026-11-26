import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  KanbanSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Table,
  Zap,
  Search,
  Bot,
  Filter,
  Layers,
  Star,
  ShieldCheck,
  Check,
  Globe,
  Database,
  Terminal,
  Activity,
  ChevronRight,
  ExternalLink,
  Users,
  Clock,
  Send,
  Sliders,
  Compass,
} from 'lucide-react'

// ─── Metrics ──────────────────────────────────────────────────────────────────
const stats = [
  { value: '12M+', label: 'Pages Scanned Autonomously', change: '+38% this month' },
  { value: '99.4%', label: 'Verified Contact Accuracy', change: 'Zero bounce guarantee' },
  { value: '3.8x', label: 'Faster Pipeline Throughput', change: 'Vs. manual spreadsheets' },
  { value: '45,000+', label: 'High-DR Backlinks Won', change: 'Actively monitored daily' },
]

// ─── Workspaces ───────────────────────────────────────────────────────────────
const workspaces = [
  {
    id: 'scraper',
    badge: 'Workspace 01',
    title: 'Autonomous Web Scraper Engine',
    subtitle: 'Deep crawling with AI decision link routing',
    description:
      'Give it any domain or URL list. OutreachTracker’s autonomous crawler detects target pages (/about, /team, /leadership, /services), bypasses boilerplate noise, and extracts verified decision-maker emails, direct phones, and custom fields.',
    features: [
      'Autonomous subpage auto-navigation (/team, /editorial, /contact)',
      'Verified direct email & LinkedIn profile discovery',
      'Free-form natural language extraction recipes with Gemini AI',
      'Built-in politeness, rate-limiting & SSRF protection',
    ],
  },
  {
    id: 'cleaner',
    badge: 'Workspace 02',
    title: 'AI Data Cleaning Studio',
    subtitle: 'Natural language spreadsheet transformations',
    description:
      'Stop wasting hours cleaning messy CSVs in Excel. Type what you want in plain English into the formula bar: split full names, remove generic email domains, format phone numbers, and deduplicate with instant side-by-side previews.',
    features: [
      'Plain-English AI formula bar: "Split first and last name, fix casing"',
      'Instant non-destructive preview before committing edits',
      'Automated domain deduplication & blacklist screening',
      'One-click export directly to active outreach campaigns',
    ],
  },
  {
    id: 'crm',
    badge: 'Workspace 03',
    title: 'Outreach CRM & Backlink Tracker',
    subtitle: '8-stage visual pipeline with live link monitoring',
    description:
      'Move prospects from initial pitch to live verified link. Use dynamic template tags ({{name}}, {{company}}, {{domain}}), automated follow-up reminders, and automatic link crawler verification that alerts you if a link is removed.',
    features: [
      '8-stage visual Kanban: New → Pitched → In Negotiation → Link Live',
      'Personalized sequence templates with real-time preview',
      'Automated smart follow-up task scheduling',
      'Continuous won-link status verification & cost-per-link metrics',
    ],
  },
]

// ─── Comparison Data ──────────────────────────────────────────────────────────
const comparisonPoints = [
  {
    feature: 'Finding Decision Makers',
    oldWay: 'Manual Google searching, clicking through 10 pages per website, guessing emails',
    outreachWay: 'Autonomous crawler visits /team & /about, extracting verified emails in seconds',
  },
  {
    feature: 'Data Normalization',
    oldWay: 'Writing complex VLOOKUPs, regex formulas, or copy-pasting line-by-line',
    outreachWay: 'Natural language AI formula bar: "Clean company names and capitalize properly"',
  },
  {
    feature: 'Outreach Pipeline',
    oldWay: 'Scattered across messy Google Sheets, email client drafts, and sticky notes',
    outreachWay: 'Unified 8-stage drag-and-drop Kanban with automatic follow-up reminders',
  },
  {
    feature: 'Backlink Verification',
    oldWay: 'Manually checking URLs monthly to see if partners kept your anchor link alive',
    outreachWay: 'Automated 24/7 crawler monitoring that verifies link status and anchor tags',
  },
]

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    quote:
      'OutreachTracker replaced Hunter, Google Sheets, and our custom scrapers. The AI Scraper discovering team members and the cleaning studio saved our agency over 15 hours every single week.',
    name: 'Sarah Jenkins',
    role: 'Head of SEO',
    company: 'LinkForge Media',
    rating: 5,
    metrics: '+320% links won',
  },
  {
    quote:
      'Writing an instruction like "find the editor-in-chief and their email" and having OutreachTracker automatically route through the site and build my outreach table is pure magic.',
    name: 'Marcus Delgado',
    role: 'Director of Growth',
    company: 'SERPify Marketing',
    rating: 5,
    metrics: '99.4% email accuracy',
  },
  {
    quote:
      'The 8-stage Kanban and won-links verification gives our clients complete transparency. We closed 62 high-DR guest posts last month without dropping a single ball.',
    name: 'Priya Raman',
    role: 'Founder & CEO',
    company: 'BacklinkHQ Agency',
    rating: 5,
    metrics: '62 won links/mo',
  },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<'scraper' | 'cleaner' | 'crm'>('scraper')

  return (
    <div className="bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-indigo-200/40 via-purple-100/20 to-transparent blur-[120px] -z-10" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-[100px] -z-10" />
          <div className="absolute top-60 left-10 w-80 h-80 bg-violet-200/30 rounded-full blur-[90px] -z-10" />
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b0d_1px,transparent_1px),linear-gradient(to_bottom,#64748b0d_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 max-w-7xl">
          {/* Top Announcement Pill */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-md hover:border-indigo-300 transition-all cursor-pointer group">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              <span className="text-xs font-semibold text-slate-800">
                OutreachTracker 2.0 Engine Live
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-medium text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Autonomous Link Intelligence <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto mb-8">
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-slate-950 tracking-tight leading-[1.08] mb-6">
              The autonomous engine for{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800">
                high-authority outreach
              </span>{' '}
              & link building.
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Replace messy spreadsheets, manual scraping, and lost leads. Unify autonomous AI web crawling, natural-language data cleaning, and high-conversion CRM pipelines.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-medium text-base shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <span>Start Free Workspace</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              to="/features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-7 py-3.5 rounded-xl font-medium text-base border border-slate-200/90 shadow-2xs transition-all hover:border-slate-300"
            >
              <span>Explore Features</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Social Proof Mini Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-slate-500 mb-16">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>50 free scrape queries</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>99.4% verified accuracy</span>
            </div>
          </div>

          {/* ─── Interactive Hero Application Mockup ────────────────────────────── */}
          <div className="relative mx-auto max-w-6xl">
            {/* Glowing frame backdrop */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-70" />

            <div className="relative rounded-2xl bg-white border border-slate-200/80 shadow-2xl shadow-indigo-950/10 overflow-hidden">
              {/* Browser bar top */}
              <div className="bg-slate-100/90 px-3 sm:px-4 py-2.5 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <div className="ml-3 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-500">
                    <span className="text-emerald-600">https://</span>
                    <span>outreachtracker.io/app/workspace</span>
                  </div>
                </div>

                {/* Workspace preview switcher */}
                <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar shrink-0">
                  <button
                    onClick={() => setActiveTab('scraper')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === 'scraper'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    AI Web Scraper
                  </button>
                  <button
                    onClick={() => setActiveTab('cleaner')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === 'cleaner'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    AI Data Cleaner
                  </button>
                  <button
                    onClick={() => setActiveTab('crm')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === 'crm'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Outreach Pipeline
                  </button>
                </div>
              </div>

              {/* Mockup Canvas */}
              <div className="p-4 sm:p-6 md:p-8 bg-slate-50/60 min-h-[420px] flex flex-col justify-between">
                {activeTab === 'scraper' && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    {/* Live URL input bar */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-slate-400 font-mono">Target Domain</div>
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            https://techcrunch.com
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Autonomous Routing Active
                        </span>
                        <div className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Gemini Deep Scan</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Autonomous Navigation Log */}
                    <div className="bg-slate-50 text-slate-700 rounded-xl p-3.5 font-mono text-xs border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-indigo-600" />
                        <span className="text-slate-500">Navigated subpages:</span>
                        <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">/staff</span>
                        <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">/about</span>
                        <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">/leadership</span>
                      </div>
                      <span className="text-emerald-700 font-medium">14 Decision Makers Extracted</span>
                    </div>

                    {/* Extracted Leads Table Mock */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-4">Contact Person</th>
                            <th className="py-2.5 px-4">Role / Title</th>
                            <th className="py-2.5 px-4">Verified Email</th>
                            <th className="py-2.5 px-4">Confidence</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">Sarah Miller</td>
                            <td className="py-3 px-4 text-slate-600">Senior Tech Editor</td>
                            <td className="py-3 px-4 text-indigo-600 font-mono">sarah.m@techcrunch.com</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                99.8% Verified
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-slate-500 hover:text-indigo-600 cursor-pointer font-semibold">
                                + Push to CRM
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">David Vance</td>
                            <td className="py-3 px-4 text-slate-600">VP of Editorial Content</td>
                            <td className="py-3 px-4 text-indigo-600 font-mono">d.vance@techcrunch.com</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                98.4% Verified
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-slate-500 hover:text-indigo-600 cursor-pointer font-semibold">
                                + Push to CRM
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">Marcus Sterling</td>
                            <td className="py-3 px-4 text-slate-600">Head of Brand Partnerships</td>
                            <td className="py-3 px-4 text-indigo-600 font-mono">marcus@techcrunch.com</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                100% Direct MX
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-slate-500 hover:text-indigo-600 cursor-pointer font-semibold">
                                + Push to CRM
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'cleaner' && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    {/* Natural language formula bar */}
                    <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-indigo-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-xs font-mono font-bold shrink-0">
                          fx AI
                        </div>
                        <input
                          type="text"
                          readOnly
                          value="Capitalize first & last names, extract clean root domain, and filter out free Yahoo/Gmail addresses"
                          className="w-full text-xs font-medium text-slate-800 bg-transparent outline-none truncate"
                        />
                      </div>
                      <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shrink-0 transition-colors">
                        Apply AI Rule
                      </button>
                    </div>

                    {/* Before vs After grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Messy Raw CSV (Before)
                        </div>
                        <div className="space-y-2 text-xs font-mono text-slate-500">
                          <div className="p-2 bg-slate-50 rounded">john DOE | HTTPS://WWW.Acme-Corp.COM/blog | john123@gmail.com</div>
                          <div className="p-2 bg-slate-50 rounded">SARAH | https://cloudscale.io/team?id=9 | sarah@cloudscale.io</div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/20">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Normalized & Ready (After)
                        </div>
                        <div className="space-y-2 text-xs font-mono text-slate-800">
                          <div className="p-2 bg-emerald-50/60 rounded border border-emerald-200/50 flex justify-between">
                            <span>John Doe</span>
                            <span className="text-slate-400">acme-corp.com</span>
                            <span className="text-rose-500 line-through">Filtered Gmail</span>
                          </div>
                          <div className="p-2 bg-emerald-50/60 rounded border border-emerald-200/50 flex justify-between">
                            <span className="font-semibold text-emerald-700">Sarah Jenkins</span>
                            <span className="text-indigo-600">cloudscale.io</span>
                            <span className="text-emerald-600">sarah@cloudscale.io</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'crm' && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">Campaign:</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                          SaaS Backlink Outreach Q4
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        Target: 50 Won Links • Progress: 38/50 (76%)
                      </span>
                    </div>

                    {/* Kanban Columns Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                          <span>Contact Pitched</span>
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">12</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                          <div className="font-semibold text-slate-900">TechTarget Review</div>
                          <div className="text-slate-500 text-[11px]">Follow-up due tomorrow</div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-sm">
                        <div className="text-xs font-bold text-indigo-600 mb-2 flex items-center justify-between">
                          <span>In Negotiation</span>
                          <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px]">5</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs space-y-1">
                          <div className="font-semibold text-slate-900">SearchEngineJournal</div>
                          <div className="text-indigo-600 text-[11px]">Guest post draft approved</div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm">
                        <div className="text-xs font-bold text-emerald-600 mb-2 flex items-center justify-between">
                          <span>Link Live (Verified)</span>
                          <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[10px]">38</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-xs space-y-1">
                          <div className="font-semibold text-slate-900">HubSpot Marketing Blog</div>
                          <div className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> DR 92 • DoFollow Live
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom status strip */}
                <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Real-time crawler & AI extraction active</span>
                  </div>
                  <Link
                    to="/signup"
                    className="text-indigo-600 font-semibold hover:text-indigo-700 inline-flex items-center gap-1"
                  >
                    Open Live Demo in your workspace <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Metrics Strip ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="p-4 rounded-2xl">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-slate-800 mb-1">{stat.label}</div>
                <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <span>✓</span> {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The 3 Unified Workspaces (Bento Section) ─────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-200/60">
              Complete Link Acquisition Stack
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
              Three workspaces. One unified platform.
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              No more exporting CSVs from scraper tools, pasting into spreadsheets, and emailing from personal inboxes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                      {ws.badge}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {ws.id === 'scraper' && <Search className="w-5 h-5 text-indigo-600" />}
                      {ws.id === 'cleaner' && <Table className="w-5 h-5 text-purple-600" />}
                      {ws.id === 'crm' && <KanbanSquare className="w-5 h-5 text-emerald-600" />}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">{ws.title}</h3>
                  <div className="text-xs font-semibold text-indigo-600 mb-4">{ws.subtitle}</div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{ws.description}</p>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    {ws.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 mt-6 border-t border-slate-100">
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors"
                  >
                    <span>Launch this workspace</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Old Way vs OutreachTracker (Comparison Matrix) ──────────────────── */}
      <section className="py-24 bg-white border-t border-slate-200/80">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
              Stop stitching 5 different tools together
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Here is how traditional manual outreach compares to our autonomous pipeline engine.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 overflow-hidden shadow-lg bg-white">
            <div className="hidden md:grid md:grid-cols-12 bg-slate-100/90 text-gray-700 p-4 sm:p-5 font-semibold text-xs tracking-wider uppercase border-b border-slate-200">
              <div className="md:col-span-3 text-slate-500">Workflow Step</div>
              <div className="md:col-span-4 text-rose-700">Traditional Messy Approach</div>
              <div className="md:col-span-5 text-emerald-700">The OutreachTracker Way</div>
            </div>

            <div className="divide-y divide-slate-100">
              {comparisonPoints.map((item) => (
                <div key={item.feature} className="grid grid-cols-1 md:grid-cols-12 p-4 sm:p-6 gap-3 sm:gap-4 items-center">
                  <div className="md:col-span-3 font-bold text-slate-900 text-sm">
                    {item.feature}
                  </div>
                  <div className="md:col-span-4 text-xs sm:text-sm text-slate-500 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    <span className="font-semibold text-rose-700 block mb-1">✕ Pain Point</span>
                    {item.oldWay}
                  </div>
                  <div className="md:col-span-5 text-xs sm:text-sm text-slate-800 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 font-medium">
                    <span className="font-semibold text-emerald-700 block mb-1">✓ Autonomous Fix</span>
                    {item.outreachWay}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof & Testimonials ──────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-200/60">
              Verified User Results
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
              Loved by SEO agencies & link acquisition specialists
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {t.metrics}
                    </span>
                  </div>

                  <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {t.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role} • {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA Banner ────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/60 border-t border-indigo-100/80 text-gray-900 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-gradient-to-r from-indigo-200/20 via-purple-200/20 to-indigo-200/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative container mx-auto px-6 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/70 border border-indigo-200/70 text-indigo-700 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Zero Setup Required • Instant Scraping & Outreach
          </div>

          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-6 leading-tight text-gray-900">
            Ready to scale your outreach and win authority links?
          </h2>

          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Join over 1,200 SEO directors, outreach specialists, and agencies discovering verified prospects and managing pipelines with OutreachTracker.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-medium text-base shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
            >
              <span>Get Started Free Today</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-7 py-3.5 rounded-xl font-medium text-base border border-gray-200 shadow-2xs transition-all"
            >
              <span>Talk to Enterprise Sales</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
