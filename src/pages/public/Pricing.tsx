import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Pricing tiers ───────────────────────────────────────────────────────────

interface PricingTier {
  name: string
  price: string
  period: string
  features: string[]
  cta: string
  ctaHref: string
  highlighted: boolean
  badge?: string
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    features: [
      '1 user',
      '1 campaign',
      '50 prospects',
      'Basic pipeline',
      'Email templates',
    ],
    cta: 'Get started free',
    ctaHref: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: [
      'Unlimited campaigns & prospects',
      'Gmail sync',
      'Follow-up sequences',
      'AI email writer',
      'Reply sorter',
      'Reports',
    ],
    cta: 'Start free trial',
    ctaHref: '/signup',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Agency',
    price: '$79',
    period: '/month',
    features: [
      'Everything in Pro',
      'Teams (5 users)',
      'Chrome extension',
      'Priority support',
      'MCP server',
    ],
    cta: 'Contact us',
    ctaHref: '#',
    highlighted: false,
  },
]

// ─── FAQ data ─────────────────────────────────────────────────────────────────

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'Is there a free trial?',
    answer:
      'Yes. The Pro plan has a 14-day free trial, no credit card required.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. Cancel from your account settings at any time, no questions asked.',
  },
  {
    question: 'Do you support team accounts?',
    answer:
      'Team support is available on the Agency plan with up to 5 seats.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. Each workspace is fully isolated. API keys are server-side only and never exposed to the client.',
  },
]

// ─── FAQ Accordion item ──────────────────────────────────────────────────────

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{item.question}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
          {item.answer}
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Pricing() {
  return (
    <>
      {/* ── Page Hero ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-5">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>
      </section>

      {/* ── Pricing tiers ─────────────────────────────────────────────────── */}
      <section className="pb-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 ${
                  tier.highlighted
                    ? 'border-indigo-500 ring-2 ring-indigo-500 shadow-lg'
                    : 'border-gray-200'
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {tier.badge}
                  </span>
                )}

                <h2 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h2>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-500 text-sm">{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {tier.ctaHref.startsWith('/') ? (
                  <Link
                    to={tier.ctaHref}
                    className={`block text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                      tier.highlighted
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <a
                    href={tier.ctaHref}
                    className="block text-center px-6 py-3 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {tier.cta}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-4">
            {faqs.map((faq) => (
              <FAQAccordion key={faq.question} item={faq} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
