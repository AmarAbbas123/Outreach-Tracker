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
  Users,
  Globe,
  Link2,
  CheckSquare,
  Star,
} from 'lucide-react'

// ─── Feature data ────────────────────────────────────────────────────────────

const features = [
  {
    icon: KanbanSquare,
    title: 'Pipeline Board',
    description:
      'Drag prospects through 8 stages — from New all the way to Link Live. Full status history on every card.',
  },
  {
    icon: Mail,
    title: 'Email Templates',
    description:
      'Write once, reuse forever. Variables like {{name}} and {{domain}} fill in automatically for each prospect.',
  },
  {
    icon: BellRing,
    title: 'Follow-up Sequences',
    description:
      'Never miss a reply. Automatic follow-up tasks fire when a prospect goes silent.',
  },
  {
    icon: Sparkles,
    title: 'AI Email Writer',
    description:
      'Personalised outreach emails drafted in seconds. You review before anything sends.',
  },
  {
    icon: MessageSquare,
    title: 'Reply Sorter',
    description:
      'AI tags replies: interested, wants payment, or not interested — so you act on the right ones first.',
  },
  {
    icon: BarChart3,
    title: 'Reports & ROI',
    description:
      "Track reply rate, links won, and cost per link. See exactly what's working.",
  },
]

// ─── How-it-works steps ───────────────────────────────────────────────────────

const steps = [
  {
    number: 1,
    title: 'Add your prospects',
    description: 'Import from CSV or add manually. Duplicates and blacklisted domains are caught automatically.',
    icon: Globe,
  },
  {
    number: 2,
    title: 'Send & track emails',
    description: 'Choose a template, personalise it, and log the send. Follow-up tasks appear on your to-do list.',
    icon: Mail,
  },
  {
    number: 3,
    title: 'Win links & report',
    description: "Log every link you win, its cost, and verify it's still live. Dashboard updates instantly.",
    icon: Link2,
  },
]

// ─── Testimonials ─────────────────────────────────────────────────────────────

const testimonials = [
  {
    quote:
      'We went from tracking everything in a giant spreadsheet to closing 40 % more links in the first month. The pipeline board alone is worth it.',
    name: 'Sarah K.',
    role: 'Head of SEO, LinkForge',
    initials: 'SK',
  },
  {
    quote:
      "The AI reply sorter saves me an hour a day. I know exactly who to follow up with and who I can skip. It's become part of our daily workflow.",
    name: 'Marcus D.',
    role: 'Outreach Manager, SERPify',
    initials: 'MD',
  },
  {
    quote:
      "Finally an outreach tool built for link builders, not generic sales. The won-links log and ROI tracking are exactly what agency clients want to see.",
    name: 'Priya R.',
    role: 'Agency Owner, BacklinkHQ',
    initials: 'PR',
  },
]

// ─── Company logos ────────────────────────────────────────────────────────────

const companies = ['LinkForge', 'SERPify', 'BacklinkHQ', 'OutrankMedia', 'RankPilot']

// ─── Stats ────────────────────────────────────────────────────────────────────

const stats = [
  { value: '10k+', label: 'Links tracked' },
  { value: '500+', label: 'Outreach teams' },
  { value: '40%', label: 'More links closed' },
  { value: '1 hr', label: 'Saved per day' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative py-24 bg-white overflow-hidden">
        {/* Background decoration */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-violet-50 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative container mx-auto px-6 max-w-6xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-indigo-100">
            <Sparkles className="w-4 h-4" />
            AI-powered link-building outreach
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 max-w-4xl mx-auto tracking-tight">
            Link-building outreach,{' '}
            <span className="text-indigo-600">managed from one place</span>
          </h1>

          {/* Subtext */}
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Add prospects, send emails, track replies, and log every link you win —
            with AI that writes, sorts, and scores for you.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-7 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              See all features
            </Link>
          </div>

          <p className="text-sm text-gray-400">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="py-14 bg-indigo-600">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-indigo-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────────────────────── */}
      <section className="py-10 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <span className="text-sm text-gray-500 font-medium">
              Trusted by outreach teams at
            </span>
            {companies.map((name) => (
              <span
                key={name}
                className="bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-1.5 rounded-full shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem / Solution ───────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Problem */}
            <div>
              <span className="inline-block text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                The old way
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Spreadsheets, missed follow-ups, and no idea what works
              </h2>
              <ul className="space-y-4">
                {[
                  'Prospects scattered across spreadsheets and Gmail',
                  'Follow-ups forgotten, deals going cold',
                  'Same site contacted twice — wasting time',
                  'No data on reply rate, links won, or ROI',
                  'Won links vanish silently over time',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600">
                    <span className="mt-1 w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0 text-xs font-bold">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div>
              <span className="inline-block text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                The OutreachTracker way
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                One database. Full timeline. Clear ROI.
              </h2>
              <ul className="space-y-4">
                {[
                  'All prospects in one place with full email timeline',
                  'Automatic follow-up tasks so nothing slips',
                  'Duplicate and blacklist detection on import',
                  'Dashboard with funnel, reply rate, and cost per link',
                  'Won links log with status checks and cost tracking',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600">
                    <CheckCircle2 className="mt-0.5 w-5 h-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              Features
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything your team needs
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Purpose-built tools for every stage of your outreach workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all"
                >
                  <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:underline"
            >
              See all features <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              How it works
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Three steps to close more links
            </h2>
            <p className="text-gray-600">Simple workflow. Powerful results.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div
              aria-hidden
              className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gray-200"
            />
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="text-center relative">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-indigo-600 text-indigo-600 text-xs font-bold rounded-full flex items-center justify-center">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Loved by outreach teams
            </h2>
            <p className="text-gray-600">Join hundreds of link builders closing more deals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ───────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Pricing
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Start free, grow as you go</h2>
          <p className="text-gray-600 mb-8">
            Free plan available. Pro at \$29/mo. Agency plan for teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              See pricing
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">No credit card required</p>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-indigo-700 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500 rounded-full blur-3xl opacity-30" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-700 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="relative container mx-auto px-6 max-w-6xl text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to run better outreach?
          </h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
            Join teams that close more links with less effort — starting today.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
