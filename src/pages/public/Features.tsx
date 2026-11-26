import { Link } from 'react-router-dom'
import {
  Globe,
  KanbanSquare,
  Mail,
  BellRing,
  Link2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

const coreFeatures = [
  {
    icon: Globe,
    title: 'Autonomous Lead Finder',
    description:
      'Deep-scan websites and automatically extract verified decision-maker emails, LinkedIn profiles, and domain authority metrics.',
  },
  {
    icon: KanbanSquare,
    title: 'Visual 8-Stage Pipeline',
    description:
      'Drag and drop prospects from initial discovery to live verified backlinks with full stage history and status tracking.',
  },
  {
    icon: Sparkles,
    title: 'AI Data Cleaning Studio',
    description:
      'Format names, split columns, strip generic email domains, and deduplicate lists using plain English prompt instructions.',
  },
  {
    icon: Mail,
    title: 'Personalized Sequences',
    description:
      'Draft responsive email templates with dynamic merge variables ({{name}}, {{domain}}) and live previews before sending.',
  },
  {
    icon: BellRing,
    title: 'Automated Follow-ups',
    description:
      'Never let warm leads go cold. Schedule smart follow-up intervals and manage daily urgent tasks in one clean view.',
  },
  {
    icon: Link2,
    title: 'Live Won-Link Verification',
    description:
      'Keep track of live placements, anchor text, domain ratings, and total spend with continuous link health checks.',
  },
]

export default function Features() {
  return (
    <div className="bg-white text-gray-800">
      {/* ─── Page Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 text-center">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <span className="inline-block text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full mb-4">
            Product Capabilities
          </span>
          <h1 className="text-3xl sm:text-5xl font-semibold text-gray-900 tracking-tight leading-tight mb-4">
            Engineered for high-conversion outreach
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate manual spreadsheet busywork with autonomous prospecting, instant data cleaning, and unified CRM pipeline tracking.
          </p>
        </div>
      </section>

      {/* ─── 6 Key Feature Cards (Clean & Airy) ──────────────────────────────── */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-gray-200/80 bg-white hover:border-indigo-200 hover:shadow-sm transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Icon size={19} />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Light CTA Banner ────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border-t border-gray-200/80">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Start closing more backlink opportunities
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
            Try OutreachTracker free for 14 days. No credit card required.
          </p>
          <div className="pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-medium text-sm shadow-2xs transition-colors"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
