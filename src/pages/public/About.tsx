import { Link } from 'react-router-dom'
import { Sparkles, Target, ShieldCheck, Zap, ArrowRight } from 'lucide-react'

const principles = [
  {
    icon: Target,
    title: 'Precision Over Spam',
    description:
      'We believe high-conversion outreach starts with verified decision-makers and high-relevance editorial targets, not mass unpersonalized blasts.',
  },
  {
    icon: Zap,
    title: 'Zero Spreadsheet Friction',
    description:
      'Copy-pasting between scrapers, CSVs, and email accounts causes lost deals. Our workspace unifies discovery, cleaning, and outreach pipeline management.',
  },
  {
    icon: ShieldCheck,
    title: 'Ethical & Polite Crawling',
    description:
      'We respect robots.txt compliance, apply strict SSRF protections, and honor polite rate-limits so outreach operations remain reliable and secure.',
  },
]

export default function About() {
  return (
    <div className="bg-white text-gray-800">
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 text-center">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <span className="inline-block text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full mb-4">
            About OutreachTracker
          </span>
          <h1 className="text-3xl sm:text-5xl font-semibold text-gray-900 tracking-tight leading-tight mb-4">
            We are building the future of link acquisition
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            OutreachTracker empowers SEO directors, agencies, and in-house growth teams to run high-throughput outreach without the chaos of disconnected spreadsheets.
          </p>
        </div>
      </section>

      {/* ─── Core Principles ─────────────────────────────────────────────────── */}
      <section className="pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {principles.map(({ icon: Icon, title, description }) => (
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
            Ready to upgrade your outreach workflow?
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
            Join over 1,200 link acquisition specialists discovering verified prospects daily.
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
