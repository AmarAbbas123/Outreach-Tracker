import { Link } from 'react-router-dom'
import {
  KanbanSquare,
  Mail,
  BellRing,
  Sparkles,
  MessageSquare,
  BarChart3,
} from 'lucide-react'

// ─── Feature data ────────────────────────────────────────────────────────────

interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: KanbanSquare,
    title: 'Pipeline Board',
    description: 'Drag prospects through 8 stages from New to Link Live.',
  },
  {
    icon: Mail,
    title: 'Email Templates',
    description: 'Reusable templates with {{name}} and {{domain}} variables.',
  },
  {
    icon: BellRing,
    title: 'Follow-up Sequences',
    description: 'Never miss a reply. Automated reminders keep deals moving.',
  },
  {
    icon: Sparkles,
    title: 'AI Email Writer',
    description: 'Drafts personalised outreach emails in seconds.',
  },
  {
    icon: MessageSquare,
    title: 'Reply Sorter',
    description: 'AI tags replies: interested, wants payment, or not interested.',
  },
  {
    icon: BarChart3,
    title: 'Reports & ROI',
    description: 'Track reply rate, links won, and cost per link.',
  },
]

// ─── How-it-works steps ───────────────────────────────────────────────────────

interface Step {
  number: number
  title: string
  description: string
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Add your prospects',
    description: 'Import from CSV or add manually',
  },
  {
    number: 2,
    title: 'Send & track emails',
    description: 'Templates, sequences, AI drafts',
  },
  {
    number: 3,
    title: 'Win links & report',
    description: 'Log wins, track ROI',
  },
]

// ─── Company pills ────────────────────────────────────────────────────────────

const companies = ['LinkForge', 'SERPify', 'BacklinkHQ', 'OutrankMedia']

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            ✦ AI-powered outreach
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6 max-w-3xl mx-auto">
            Link-building outreach, managed from one place
          </h1>

          {/* Subtext */}
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Add prospects, send emails, track replies, and log every link you win — with AI
            that writes, sorts, and scores for you.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
            <Link
              to="/signup"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Start for free →
            </Link>
            <Link
              to="/features"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              See features
            </Link>
          </div>

          <p className="text-sm text-gray-400">No credit card required · Cancel anytime</p>
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

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Everything your team needs
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Purpose-built tools for every stage of your outreach workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="p-6 border border-gray-100 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-600">Three simple steps to close more links.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5">
                  {step.number}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-indigo-700">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to run better outreach?
          </h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
            Join teams that close more links with less effort.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-indigo-700 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>
    </>
  )
}
