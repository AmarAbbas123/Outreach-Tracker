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
  Lock,
  Layers,
  Terminal,
} from 'lucide-react'

const stats = [
  { value: '12M+', label: 'Pages Autonomously Scanned' },
  { value: '99.4%', label: 'Contact Verification Rate' },
  { value: '1,200+', label: 'Active Link-Building Teams' },
  { value: '45,000+', label: 'High-DR Backlinks Verified' },
]

const values = [
  {
    icon: Target,
    title: 'Precision Over Volume',
    badge: 'Core Philosophy',
    description:
      'Mass-spamming irrelevant blogs destroys your sender reputation and wastes client budget. We build AI systems that pinpoint verified decision-makers, editors, and relevant editorial partners.',
  },
  {
    icon: Cpu,
    title: 'Autonomous Intelligence',
    badge: 'AI Architecture',
    description:
      'From discovering internal team subpages to dynamically structuring unformatted text, our crawler makes intelligent choices in real-time so your team does not have to click manually.',
  },
  {
    icon: ShieldCheck,
    title: 'Polite & Ethical Crawling',
    badge: 'Infrastructure',
    description:
      'We respect robots.txt compliance, apply strict SSRF protections, and honor polite server rate-limits. We believe high-performance outreach must be built on respectful, sustainable standards.',
  },
  {
    icon: Zap,
    title: 'Zero Spreadsheet Friction',
    badge: 'Product Design',
    description:
      'Copying and pasting rows between Hunter, Google Sheets, and personal Gmail accounts leads to dropped balls. One unified workspace brings scraping, cleaning, and outreach under one roof.',
  },
]

const teamMembers = [
  {
    name: 'Maseeh Ullah',
    role: 'Founder & Chief Architect',
    bio: 'Systems engineer with deep expertise in autonomous web crawling, resilient queue architectures, and high-conversion SaaS outreach workflows.',
    initials: 'MU',
  },
  {
    name: 'Elena Rostova',
    role: 'Head of AI & NLP',
    bio: 'Former machine learning engineer specialized in LLM semantic extraction, structured JSON synthesis, and entity classification.',
    initials: 'ER',
  },
  {
    name: 'David Vance',
    role: 'VP of Product & SEO',
    bio: 'Ex-agency outreach director who scaled organic link acquisition across 400+ SaaS, media, and e-commerce brands globally.',
    initials: 'DV',
  },
  {
    name: 'Aisha Al-Mansoor',
    role: 'Lead Infrastructure Engineer',
    bio: 'Distributed systems architect focused on SSRF security, high-throughput workers, and sub-second database persistence.',
    initials: 'AA',
  },
]

const milestones = [
  {
    year: '2024',
    title: 'The Frustration With Disconnected Spreadsheets',
    description:
      'Frustrated by broken CSV imports, scattered Google Sheets, and missed follow-ups, our founding team began engineering the first unified outreach database prototype.',
  },
  {
    year: '2025',
    title: 'Autonomous AI Scraper & Formula Cleaner',
    description:
      'We introduced deep subpage auto-navigation (/team, /about) and natural-language spreadsheet cleaning powered by Gemini AI, cutting lead preparation time by 80%.',
  },
  {
    year: '2026',
    title: 'OutreachTracker 2.0 Global Scale',
    description:
      'Now powering over 1,200 SEO directors, agencies, and link acquisition specialists across 42 countries with verified backlink tracking and automated follow-ups.',
  },
]

export default function About() {
  return (
    <div className="bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-indigo-200/40 via-purple-100/20 to-transparent blur-[120px] -z-10" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b0d_1px,transparent_1px),linear-gradient(to_bottom,#64748b0d_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-slate-200 shadow-sm text-xs font-semibold text-slate-800 mb-8 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Our Mission & Architectural Philosophy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1] mb-6">
            We are engineering the future of{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              intelligent link acquisition.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10">
            OutreachTracker was built to kill the chaos of bloated spreadsheets, brittle scraper scripts, and forgotten follow-ups. We empower link builders and growth teams with autonomous tools that discover verified prospects, clean data instantly, and close partnerships.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-medium text-sm shadow-2xs transition-all"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-7 py-3 rounded-xl font-medium text-sm transition-colors shadow-2xs"
            >
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats Banner (Light Gradient Card) ──────────────────────────────── */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/60 text-gray-900 p-6 sm:p-8 md:p-12 border border-indigo-100/80 shadow-2xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative z-10">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 tracking-tight mb-1">
                    {s.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Values (Bento Cards) ────────────────────────────────────────── */}
      <section className="py-24 bg-white border-t border-slate-200/80">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-4">
              The Principles That Guide Us
            </h2>
            <p className="text-slate-600 text-base">
              Built by practitioners who have managed multi-million dollar organic link campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((v) => {
              const Icon = v.icon
              return (
                <div
                  key={v.title}
                  className="bg-slate-50/70 p-8 rounded-3xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
                      {v.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-950 mb-3">{v.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{v.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Milestone Timeline ──────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 border-t border-slate-200/80">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-4">
              Our Journey So Far
            </h2>
            <p className="text-slate-600 text-base">
              From an internal link tracker to an autonomous enterprise acquisition engine.
            </p>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-indigo-200/70">
            {milestones.map((m) => (
              <div key={m.year} className="relative flex items-start gap-6 group">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-indigo-600 text-indigo-600 font-extrabold text-sm flex items-center justify-center shrink-0 shadow-md z-10 group-hover:scale-105 transition-transform">
                  {m.year}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex-1 group-hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-slate-950 mb-2">{m.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Leadership Team ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white border-t border-slate-200/80">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-4">
              Built by Link Builders & Engineers
            </h2>
            <p className="text-slate-600 text-base">
              The multidisciplinary team committed to giving you the fastest, smartest outreach software.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 text-center hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-indigo-600/20">
                    {member.initials}
                  </div>
                  <h3 className="font-bold text-slate-950 text-base mb-1">{member.name}</h3>
                  <div className="text-xs font-semibold text-indigo-600 mb-3">{member.role}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Security & Politeness Standard Card ──────────────────────────────── */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <Lock className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-950 mb-2">
                Ethical Crawling, SSRF Protection & Zero Data Leakage
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                We take crawler safety seriously. Our scraper verifies target domain hosts against private RFC 1918 addresses, restricts socket loops, obeys robots.txt directives, and stores campaign data encrypted at rest.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> SSRF Hardened
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Robots.txt Politeness
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> AES-256 Workspace Isolation
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
