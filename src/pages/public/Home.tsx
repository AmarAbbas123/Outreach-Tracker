import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  KanbanSquare,
  Mail,
  BellRing,
  Sparkles,
  MessageSquare,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Globe,
  Link2,
  Table,
  Zap,
  Search,
  Bot,
  Filter,
  Layers,
  ChevronRight,
  Star,
  ShieldCheck,
} from 'lucide-react'

// ─── Stats ────────────────────────────────────────────────────────────────────
const stats = [
  { value: '12M+', label: 'Pages Scanned Autonomously' },
  { value: '99.4%', label: 'Verified Contact Accuracy' },
  { value: '40%', label: 'Higher Reply Rate' },
  { value: '45k+', label: 'Live Backlinks Monitored' },
]

// ─── Trusted brands ───────────────────────────────────────────────────────────
const companies = ['LinkForge', 'SERPify Media', 'BacklinkHQ', 'OutrankMedia', 'RankPilot Pro', 'SEOVelocity']

// ─── The 3 Unified Workspaces ──────────────────────────────────────────────────
const workspaces = [
  {
    id: 'scraper',
    badge: 'Workspace 1',
    title: 'Autonomous Web Scraper Engine',
    description:
      'Input any target website or domain. Our crawler autonomously navigates deep subpages (/team, /about, /services), finds verified decision-maker emails and phones, and extracts custom structured data.',
    icon: Search,
    color: 'from-blue-600 to-indigo-600',
    features: [
      'Autonomous subpage auto-navigation (/our-team, /services, /case-studies)',
      'Verified business email, phone, and social profile extraction',
      'Free-form natural language extraction recipes powered by Gemini AI',
      'Strict SSRF protection, politeness limits, and robots.txt compliance',
    ],
  },
  {
    id: 'cleaning',
    badge: 'Workspace 2',
    title: 'AI Data Cleaning Studio',
    description:
      'Never wrestle with messy spreadsheets again. Clean, normalize, and transform raw rows using plain English commands with an interactive formula bar and instant preview.',
    icon: Table,
    color: 'from-purple-600 to-indigo-600',
    features: [
      'Plain-language AI formula bar: "Capitalize names", "Extract clean domain"',
      'Automated deduplication and domain blacklist screening',
      'One-click export directly into verified outreach campaigns',
      'Non-destructive transformations with step-by-step history',
    ],
  },
  {
    id: 'pipeline',
    badge: 'Workspace 3',
    title: 'Outreach CRM & Backlink Tracker',
    description:
      'Manage outreach campaigns across an 8-stage drag & drop kanban board. Send personalized sequence templates, schedule follow-ups, and verify live won backlinks.',
    icon: KanbanSquare,
    color: 'from-emerald-600 to-teal-600',
    features: [
      'Visual 8-stage Kanban board (New → Pitched → In Negotiation → Link Live)',
      'Smart personalized email templates with dynamic {{name}} and {{domain}} tags',
      'Automated follow-up reminders so no warm lead goes cold',
      'Continuous won-link status verification and cost-per-link ROI reporting',
    ],
  },
]

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    quote:
      'OutreachTracker replaced three disconnected subscriptions for our agency. The AI Scraper finding team members and the Data Cleaning studio saved us over 15 hours every week.',
    name: 'Sarah Jenkins',
    role: 'Head of SEO, LinkForge Digital',
    initials: 'SJ',
  },
  {
    quote:
      'Being able to write a prompt like "extract services and key details" and watching the AI autonomously navigate the site and build the spreadsheet is magical. Nothing else comes close.',
    name: 'Marcus Delgado',
    role: 'Growth Director, SERPify',
    initials: 'MD',
  },
  {
    quote:
      'We went from tracking deals in messy Google Sheets to closing 45+ high-DR links a month. The won-links verification ensures we never lose what we paid for.',
    name: 'Priya Raman',
    role: 'Founder, BacklinkHQ Agency',
    initials: 'PR',
  },
]

export default function Home() {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(0)
  const currentWorkspace = workspaces[activeWorkspaceTab]

  return (
    <div className="bg-white">
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 bg-gradient-to-b from-indigo-50/70 via-white to-white overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-100/60 rounded-full blur-3xl opacity-70" />
          <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-purple-100/50 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative container mx-auto px-6 max-w-6xl text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-indigo-200/80 shadow-sm hover:bg-indigo-100/80 transition-colors">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>The All-In-One AI Outreach & Web Scraping Engine</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight max-w-5xl mx-auto">
            Discover verified prospects, clean data, and{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600">
              win high-value backlinks
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Eliminate messy spreadsheets and disconnected point tools. OutreachTracker unifies autonomous AI web scraping, intelligent spreadsheet cleaning, and high-conversion outreach pipelines in one workspace.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
            >
              Explore All Workspaces
            </Link>
          </div>

          <p className="text-xs md:text-sm text-gray-400 font-medium">
            No credit card required · 50 free prospect scrapes included · Cancel anytime
          </p>

          {/* Interactive Workspace Preview Mockup */}
          <div className="mt-14 max-w-5xl mx-auto bg-white rounded-3xl border border-gray-200/80 shadow-2xl p-4 md:p-6 text-left relative overflow-hidden">
            {/* Top Browser Bar */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-gray-400 bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
                  app.outreachtracker.io/prospects
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                AI Scraper Engine Active
              </div>
            </div>

            {/* Mockup Workspace Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {workspaces.map((ws, idx) => {
                const Icon = ws.icon
                const isActive = activeWorkspaceTab === idx
                return (
                  <button
                    key={ws.id}
                    onClick={() => setActiveWorkspaceTab(idx)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl text-left border transition-all ${
                      isActive
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 shadow-sm'
                        : 'bg-gray-50/70 border-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">{ws.badge}</div>
                      <div className="text-xs font-semibold text-gray-900 line-clamp-1">{ws.title}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Active Workspace Showcase Card */}
            <div className="bg-gradient-to-tr from-gray-900 to-indigo-950 text-white p-6 md:p-8 rounded-2xl shadow-inner">
              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-block text-xs font-bold text-indigo-300 bg-indigo-900/60 border border-indigo-700/80 px-3 py-1 rounded-full">
                    {currentWorkspace.badge}: {currentWorkspace.title}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
                    {currentWorkspace.title}
                  </h3>
                  <p className="text-indigo-200 text-sm leading-relaxed">
                    {currentWorkspace.description}
                  </p>
                  <ul className="space-y-2.5 pt-2">
                    {currentWorkspace.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-xs md:text-sm text-indigo-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-5 bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/10 space-y-3 font-mono text-xs text-indigo-100">
                  <div className="text-indigo-300 font-bold border-b border-white/10 pb-2 flex items-center justify-between">
                    <span>LIVE PIPELINE SNAPSHOT</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">200 OK</span>
                  </div>
                  <div>Target: <span className="text-amber-300">visualsoft-inc.com</span></div>
                  <div>Subpage Detected: <span className="text-emerald-300">/our-team/</span></div>
                  <div>Decision Maker: <span className="text-white font-semibold">Muhammad Rafiq (CEO)</span></div>
                  <div>Verified Contact: <span className="text-cyan-300">contact@visualsoft-inc.com</span></div>
                  <div>Phone: <span className="text-white">+92 321 5265188</span></div>
                  <div>Status: <span className="text-emerald-400 font-bold">READY TO ENRICH →</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-indigo-900 text-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-indigo-800/80">
            {stats.map((s) => (
              <div key={s.label} className="pt-4 md:pt-0">
                <div className="text-3xl md:text-4xl font-extrabold text-indigo-200 mb-1">{s.value}</div>
                <div className="text-indigo-300 text-xs md:text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─────────────────────────────────────────────────────── */}
      <section className="py-10 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap text-center">
            <span className="text-xs md:text-sm text-gray-500 font-medium">
              Trusted by high-growth outreach teams & SEO agencies:
            </span>
            {companies.map((name) => (
              <span
                key={name}
                className="bg-white border border-gray-200 text-gray-700 text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Problem vs Solution ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* The Old Way */}
            <div className="bg-red-50/50 p-8 rounded-3xl border border-red-100">
              <span className="inline-block text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                The Old Fragile Way
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Manual spreadsheets, disconnected tools, and lost leads
              </h2>
              <ul className="space-y-4">
                {[
                  'Scraping URLs into CSVs, then manually hunting for emails in separate apps',
                  'Messy columns with broken formats, missing domains, and duplicate contacts',
                  'Accidentally pitching the same website twice because blacklists are not synced',
                  'Forgotten follow-ups causing hot link-building opportunities to go cold',
                  'Zero real visibility into backlink ROI and whether won links stay live',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The OutreachTracker Way */}
            <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100">
              <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                The OutreachTracker Engine
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Autonomous scraping, clean sheets, and guaranteed delivery
              </h2>
              <ul className="space-y-4">
                {[
                  'Autonomous AI web scraping crawls subpages and pulls verified emails & phones',
                  'AI Data Cleaning Studio normalizes spreadsheets using plain English prompts',
                  'Workspace-level duplicate and blacklist detection prevents embarrassing repeat emails',
                  'Automatic follow-up tasks and schedule alerts guarantee no prospect is missed',
                  'Live Backlink Tracker continuously verifies that your won links remain active',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works (3 Steps) ───────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Simple 3-Step Flow
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
              From raw website to closed backlink
            </h2>
            <p className="text-gray-600 text-base">
              A frictionless path engineered for maximum efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-lg mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Autonomous Discovery</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Paste your target domains or use AI instructions. The engine crawls deep subpages, finds verified decision-makers, and indexes company data.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm relative">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center text-lg mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Clean in AI Studio</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Type instructions like "Capitalize names and extract clean domain" to prepare flawless, personalized outreach data in seconds.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-lg mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Outreach & Win Links</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Move prospects through your visual pipeline, send dynamic sequence templates, and track live verified backlinks in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
              Loved by outreach leaders worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-gray-50/80 p-8 rounded-2xl border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 italic leading-relaxed">"{t.quote}"</p>
                </div>
                <div className="pt-6 mt-6 border-t border-gray-200/60 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{t.name}</h4>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-indigo-600 text-white text-center relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Start closing more high-quality backlinks today
          </h2>
          <p className="text-indigo-100 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Join hundreds of forward-thinking SEOs, agencies, and growth teams who trust OutreachTracker.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg text-sm md:text-base"
            >
              Get Started for Free →
            </Link>
            <Link
              to="/pricing"
              className="bg-indigo-700/80 text-white border border-indigo-400/50 px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors text-sm md:text-base"
            >
              View Pricing & Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
