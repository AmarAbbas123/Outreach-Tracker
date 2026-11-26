import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  Search,
  Table,
  KanbanSquare,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Users,
} from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'scraper' | 'cleaner' | 'pipeline'>('pipeline')

  return (
    <div className="bg-white text-slate-800 selection:bg-indigo-500 selection:text-white">
      {/* ─── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-20 overflow-hidden">
        {/* Soft background ambient glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-100/60 via-purple-50/40 to-transparent blur-[100px] -z-10" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/60 text-indigo-700 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>OutreachTracker 2.0 • Autonomous Link Acquisition</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 tracking-tight leading-[1.15] mb-5">
            Smart link building & outreach,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              simplified.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-600 font-normal leading-relaxed max-w-2xl mx-auto mb-8">
            Discover verified editorial contacts, clean messy lead lists with natural language AI, and manage high-conversion backlink pipelines without bloated spreadsheets.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-medium text-sm shadow-2xs transition-colors"
            >
              <span>Start Free Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-medium text-sm border border-gray-200 shadow-2xs transition-colors"
            >
              <span>Explore Features</span>
            </Link>
          </div>

          {/* Mini benefits pills */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500 font-normal">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>50 free prospect queries</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Kanban pipeline included</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Clean Interactive Product Preview ─────────────────────────────────── */}
      <section className="pb-20 container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="rounded-2xl bg-white border border-gray-200/90 shadow-sm overflow-hidden">
          {/* Top Bar Switcher */}
          <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs text-gray-400 font-mono hidden sm:inline">
                outreachtracker.io/app
              </span>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200/80 shadow-2xs">
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'pipeline'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Outreach Pipeline
              </button>
              <button
                onClick={() => setActiveTab('scraper')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'scraper'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Lead Finder
              </button>
              <button
                onClick={() => setActiveTab('cleaner')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'cleaner'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                AI Data Cleaner
              </button>
            </div>
          </div>

          {/* Interactive Preview Content */}
          <div className="p-5 sm:p-6 bg-white min-h-[280px]">
            {activeTab === 'pipeline' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Column 1 */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-2.5">
                    <span>Pitched (18)</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      Follow-up in 3d
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-gray-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-800">techcrunch.com</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-mono">
                        DR 92
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">Alex Wilhelm • Managing Editor</p>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-3">
                  <div className="flex items-center justify-between text-xs font-medium text-indigo-900 mb-2.5">
                    <span>In Discussion (6)</span>
                    <span className="text-[10px] bg-indigo-100/70 text-indigo-700 px-2 py-0.5 rounded-full">
                      Warm Reply
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-indigo-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-800">zapier.com</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-mono">
                        DR 89
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">Reviewing guest contribution draft</p>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3">
                  <div className="flex items-center justify-between text-xs font-medium text-emerald-900 mb-2.5">
                    <span>Links Won (34)</span>
                    <span className="text-[10px] bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded-full">
                      Live Verified
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-emerald-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-800">hubspot.com/blog</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-mono">
                        DR 93
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">Anchor: "Autonomous Outreach"</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scraper' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <span className="text-gray-600 font-mono">Domain: cloudscale.io</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium text-[11px]">
                    4 Editorial Contacts Found
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                    <p className="font-medium text-gray-800">Sarah Jenkins</p>
                    <p className="text-gray-400 text-[11px]">Head of Content • sarah@cloudscale.io</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
                    <p className="font-medium text-gray-800">Marcus Cole</p>
                    <p className="text-gray-400 text-[11px]">Editor-in-Chief • marcus@cloudscale.io</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cleaner' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-800 flex items-center justify-between">
                  <span>Prompt: "Clean names, capitalize properly, and remove generic info@ emails"</span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded font-mono border border-indigo-200">
                    Done
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs font-mono text-[11px] text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>JOHN DOE → John Doe</span>
                    <span className="text-emerald-600">Formatted</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HTTPS://TECHCO.COM/BLOG → techco.com</span>
                    <span className="text-emerald-600">Cleaned Domain</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 3 Core Capabilities (Concise & Focused) ───────────────────────────── */}
      <section className="py-16 bg-slate-50/60 border-t border-b border-gray-200/70">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
              Everything your outreach needs
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Three streamlined workspaces built for growth agencies, SEO directors, and link builders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Search size={18} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Autonomous Lead Finder</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Scan target websites, automatically navigate editorial subpages, and extract verified decision-maker emails.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                <Table size={18} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">AI Data Cleaning Studio</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Transform messy spreadsheets with simple English instructions. Deduplicate, standardize casing, and strip noise instantly.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                <KanbanSquare size={18} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Visual Outreach Pipeline</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Manage campaigns with an 8-stage drag-and-drop board, automated follow-up reminders, and 24/7 live backlink verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Metric Strip ──────────────────────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">12M+</p>
              <p className="text-xs text-gray-500 mt-0.5">Pages Scanned</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">99.4%</p>
              <p className="text-xs text-gray-500 mt-0.5">Verified Contacts</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">3.8x</p>
              <p className="text-xs text-gray-500 mt-0.5">Faster Outreach</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">45k+</p>
              <p className="text-xs text-gray-500 mt-0.5">Backlinks Won</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Call to Action ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border-t border-gray-200/80">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-semibold text-gray-900 tracking-tight">
            Ready to streamline your outreach?
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
            Create your free workspace in 30 seconds. Start discovering high-authority prospects and closing link placements today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-medium text-sm shadow-2xs transition-colors"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-medium text-sm border border-gray-200 shadow-2xs transition-colors"
            >
              <span>View Pricing Plans</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
