import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

interface PricingTier {
  name: string
  price: { monthly: string; annual: string }
  period: string
  description: string
  features: string[]
  cta: string
  ctaHref: string
  highlighted: boolean
  badge?: string
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: { monthly: '$0', annual: '$0' },
    period: '/month',
    description: 'Perfect for solo founders and beginners.',
    features: [
      '1 active campaign',
      'Up to 50 prospects',
      '8-stage Kanban pipeline',
      'Personalized email templates',
      'Won backlink logging',
    ],
    cta: 'Get started free',
    ctaHref: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: { monthly: '$29', annual: '$23' },
    period: '/month',
    description: 'For growing brands and outreach specialists.',
    features: [
      'Unlimited campaigns & prospects',
      'Autonomous lead finder crawler',
      'AI data cleaning studio',
      'Automated follow-up reminders',
      'Live backlink verification checks',
      'Full ROI & performance reports',
    ],
    cta: 'Start 14-day trial',
    ctaHref: '/signup',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Agency',
    price: { monthly: '$79', annual: '$63' },
    period: '/month',
    description: 'For SEO agencies running client outreach.',
    features: [
      'Everything in Pro tier',
      'Up to 5 team member seats',
      'Multi-client isolated workspaces',
      'Custom webhook integrations',
      'Priority support & CSV exports',
    ],
    cta: 'Choose Agency',
    ctaHref: '/signup',
    highlighted: false,
  },
]

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes. The Pro plan includes a 14-day free trial with zero upfront credit card requirement.',
  },
  {
    q: 'Can I cancel or change plans anytime?',
    a: 'Yes, you can upgrade, downgrade, or cancel your subscription directly from your settings at any time.',
  },
  {
    q: 'How does the annual discount work?',
    a: 'Choosing annual billing saves 20% across all paid plans ($23/mo for Pro, $63/mo for Agency).',
  },
  {
    q: 'Is my outreach data private?',
    a: 'Yes. Every workspace is isolated and secured with JWT encryption, rate limiting, and strict SSRF protections.',
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="bg-white text-gray-800">
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-10 sm:pt-20 sm:pb-14 text-center">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <span className="inline-block text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full mb-4">
            Pricing Plans
          </span>
          <h1 className="text-3xl sm:text-5xl font-semibold text-gray-900 tracking-tight leading-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto mb-8">
            Start for free. Scale your outreach as your client campaigns grow.
          </p>

          {/* Billing Interval Switcher */}
          <div className="inline-flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !annual ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                annual ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Pricing Tiers ───────────────────────────────────────────────────── */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between border transition-all ${
                  tier.highlighted
                    ? 'border-indigo-400 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-sm ring-1 ring-indigo-200'
                    : 'border-gray-200/90 bg-white shadow-2xs'
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-medium px-3 py-0.5 rounded-full shadow-2xs">
                    {tier.badge}
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{tier.name}</h3>
                  <p className="text-xs text-gray-500 mb-5 leading-relaxed">{tier.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl sm:text-4xl font-semibold text-gray-900">
                      {annual ? tier.price.annual : tier.price.monthly}
                    </span>
                    <span className="text-xs text-gray-400">{tier.period}</span>
                  </div>

                  <ul className="space-y-2.5 mb-8 text-xs text-gray-600">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={tier.ctaHref}
                  className={`w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    tier.highlighted
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{tier.cta}</span>
                  {tier.highlighted && <ArrowRight className="w-3.5 h-3.5" />}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Compact FAQs ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50/60 border-t border-gray-200/80">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.q}
                className="rounded-xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs sm:text-sm font-medium text-gray-800 hover:text-indigo-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
