import { Link } from 'react-router-dom'
import {
  Sparkles,
  Target,
  ShieldCheck,
  Zap,
  Globe2,
  Users2,
  ArrowRight,
  Cpu,
  BarChart4,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react'

const stats = [
  { value: '12M+', label: 'Web Pages Scanned' },
  { value: '99.4%', label: 'Verified Contact Accuracy' },
  { value: '1,200+', label: 'Active Link-Building Teams' },
  { value: '45,000+', label: 'High-Authority Backlinks Won' },
]

const values = [
  {
    icon: Target,
    title: 'Precision Over Volume',
    description:
      'Spamming thousands of irrelevent blogs destroys your domain reputation. We build AI tools that identify the exact right contacts, verified emails, and relevant opportunities.',
  },
  {
    icon: Cpu,
    title: 'Autonomous Intelligence',
    description:
      'From following internal team subpages to dynamically structuring complex company details, our scraper and AI cleaning studio make intelligent decisions so you don’t have to.',
  },
  {
    icon: ShieldCheck,
    title: 'Polite & Ethical Crawling',
    description:
      'We respect robots.txt compliance, apply strict SSRF protections, and honor server rate-limits. We believe high-performance outreach must be built on sustainable, respectful standards.',
  },
  {
    icon: Zap,
    title: 'Zero Spreadsheet Friction',
    description:
      'Copying and pasting rows between Google Sheets, Hunter, and Gmail is a thing of the past. One unified platform brings scraping, data cleaning, and email pipelines under one roof.',
  },
]

const teamMembers = [
  {
    name: 'Maseeh Ullah',
    role: 'Founder & Chief Architect',
    bio: 'Full-stack systems engineer and automation architect with 7+ years building enterprise scrapers and growth data engines.',
    avatar: 'MU',
  },
  {
    name: 'Elena Rostova',
    role: 'Head of AI & NLP',
    bio: 'Former ML researcher specializing in large language model extraction, semantic classification, and structured schema synthesis.',
    avatar: 'ER',
  },
  {
    name: 'David Vance',
    role: 'VP of Product & SEO',
    bio: 'Ex-agency outreach director who scaled organic link acquisition across 400+ SaaS and e-commerce brands.',
    avatar: 'DV',
  },
  {
    name: 'Aisha Al-Mansoor',
    role: 'Lead Infrastructure Engineer',
    bio: 'Distributed systems expert focused on resilient web crawling, high-throughput queue architectures, and database persistence.',
    avatar: 'AA',
  },
]

const milestones = [
  {
    year: '2024',
    title: 'The Frustration With Spreadsheets',
    description: 'Frustrated by broken CSV imports, disconnected outreach tools, and missed follow-ups, our founders started prototyping a unified outreach database.',
  },
  {
    year: '2025',
    title: 'Autonomous AI Scraper & Cleaner',
    description: 'We launched the AI Web Scraper Engine capable of discovering deep subpages and cleaning raw spreadsheets using natural language instructions.',
  },
  {
    year: '2026',
    title: 'OutreachTracker 2.0 Global Scale',
    description: 'Now powering link-building agencies, SaaS growth teams, and enterprise outreach specialists across 42 countries worldwide.',
  },
]

export default function About() {
  return (
    <div className="bg-white">
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative py-24 bg-gradient-to-b from-indigo-50/70 via-white to-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative container mx-auto px-6 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-indigo-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Our Mission & Story
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
            Built for modern growth teams who demand{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              smarter outreach
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
            OutreachTracker was created to eliminate the chaotic mess of bloated spreadsheets, expensive point-solution tools, and lost leads. We give link builders and outreach specialists an autonomous intelligence engine that finds prospects, cleans data, and closes deals.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-7 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats Strip ──────────────────────────────────────────────────────── */}
      <section className="py-12 bg-indigo-900 text-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-indigo-800/80">
            {stats.map((s) => (
              <div key={s.label} className="pt-4 md:pt-0">
                <div className="text-3xl md:text-4xl font-extrabold text-indigo-200 mb-1">{s.value}</div>
                <div className="text-indigo-300 text-sm font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why We Built OutreachTracker ──────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                The Origin
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Outreach shouldn’t feel like wrestling a spreadsheet.
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base">
                <p>
                  For years, outreach and SEO teams had to jump between 5 different subscriptions: a web scraper to find pages, a contact extractor to guess emails, an email verifier to clean lists, a CSV spreadsheet to track rows, and an email tool to send pitches.
                </p>
                <p>
                  Data was constantly lost, duplicate emails were sent to the same editors, and deals slipped through the cracks. Worst of all, nobody knew the true cost per link won.
                </p>
                <p>
                  We built OutreachTracker as the all-in-one ecosystem: three unified workspaces where you discover leads with our autonomous AI scraper, clean spreadsheets with natural language, and manage high-conversion email pipelines seamlessly.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold text-gray-800 text-sm">3 Unified Workspaces</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold text-gray-800 text-sm">Autonomous AI Engine</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-tr from-indigo-50 to-purple-50 p-8 rounded-3xl border border-indigo-100 shadow-sm relative">
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">1. Autonomous Discovery</h4>
                    <p className="text-gray-500 text-xs mt-1">Deep crawl target sites, auto-navigate to `/team` or `/services`, and extract verified decision-maker contacts.</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">2. AI Spreadsheet Studio</h4>
                    <p className="text-gray-500 text-xs mt-1">Clean and standardize columns with plain English formulas, normalize job titles, and merge duplicates instantly.</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <BarChart4 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">3. Visual Pipeline & Won Links</h4>
                    <p className="text-gray-500 text-xs mt-1">Track negotiations through 8 visual stages, log live backlinks, and measure exact ROI per client.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Our Core Values ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Core Principles
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4 mb-4">
              The values that drive our engineering
            </h2>
            <p className="text-gray-600 text-base md:text-lg">
              We build tools with respect for both our users and the open web ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((v) => {
              const Icon = v.icon
              return (
                <div
                  key={v.title}
                  className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{v.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Leadership & Team ────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Leadership
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4 mb-4">
              Meet the minds behind OutreachTracker
            </h2>
            <p className="text-gray-600 text-base">
              A distributed team of engineers, SEO specialists, and designers passionate about high-impact web software.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((m) => (
              <div
                key={m.name}
                className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-md">
                  {m.avatar}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                <p className="text-indigo-600 text-xs font-semibold mb-3">{m.role}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Milestones / Journey ─────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Our Growth Milestones</h2>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:left-5 md:before:left-1/2 before:w-0.5 before:bg-indigo-200">
            {milestones.map((item, idx) => (
              <div
                key={item.year}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 ${
                  idx % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center z-10 shrink-0 shadow-sm ring-4 ring-white">
                  {item.year.slice(2)}'
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{item.year}</span>
                  <h4 className="text-lg font-bold text-gray-900 mt-1 mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
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
            Ready to upgrade your outreach workflow?
          </h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            Start discovering verified contacts and closing links in minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="bg-white text-indigo-700 px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Get Started for Free →
            </Link>
            <Link
              to="/contact"
              className="bg-indigo-700/80 text-white border border-indigo-400/50 px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
