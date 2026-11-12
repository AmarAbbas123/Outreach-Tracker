import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, ArrowRight, Zap } from 'lucide-react'

// ─── Pricing tiers ───────────────────────────────────────────────────────────

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
    description: 'Perfect for solo link builders getting started.',
    features: [
      '1 user',
      '1 campaign',
      'Up to 50 prospects',
      'Basic pipeline board',
      'Email templates',
      'Manual outreach log',
      'Won links tracker',
    ],
    cta: 'Get started free',
    ctaHref: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: { monthly: '$29', annual: '$23' },
    period: '/month',
    description: 'Everything you need to run serious link-building campaigns.',
    features: [
      'Unlimited campaigns & prospects',
      'All Starter features',
      'Gmail sync (coming soon)',
      'Follow-up sequences',
      'AI email writer',
      'Reply sorter (AI)',
      'Prospect scorer (AI)',
      'Full dashboard & reports',
      'CSV export',
      'Email support',
    ],
    cta: 'Start free trial',
    ctaHref: '/signup',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Agency',
    price: { monthly: '$79', annual: '$63' },
    period: '/month',
    description: 'For teams running outreach across multiple clients.',
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Client workspaces',
      'Chrome extension',
      'Priority support',
      'MCP server (coming soon)',
      'PDF report export',
      'Client portal (coming soon)',
    ],
    cta: 'Contact us',
    ctaHref: 'mailto:hello@outreachtracker.io',
    highlighted: false,
  },
]

// ─── Feature comparison ──────────────────────────────────────────────────────

interface CompareRow {
  feature: string
  starter: boolean | string
  pro: boolean | string
  agency: boolean | string
}

const compareRows: CompareRow[] = [
  { feature: 'Users', starter: '1', pro: '1', agency: 'Up to 5' },
  { feature: 'Campaigns', starter: '1', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Prospects', starter: '50', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Pipeline board', starter: true, pro: true, agency: true },
  { feature: 'Email templates', starter: true, pro: true, agency: true },
  { feature: 'Manual outreach log', starter: true, pro: true, agency: true },
  { feature: 'Won links tracker', starter: true, pro: true, agency: true },
  { feature: 'Follow-up sequences', starter: false, pro: true, agency: true },
  { feature: 'AI email writer', starter: false, pro: true, agency: true },
  { feature: 'AI reply sorter', starter: false, pro: true, agency: true },
  { feature: 'Dashboard & reports', starter: false, pro: true, agency: true },
  { feature: 'CSV export', starter: false, pro: true, agency: true },
  { feature: 'Team members', starter: false, pro: false, agency: 'Up to 5' },
  { feature: 'Chrome extension', starter: false, pro: false, agency: true },
  { feature: 'Priority support', starter: false, pro: false, agency: true },
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
      'Yes. The Pro plan has a 14-day free trial — no credit card required. You get full access to all Pro features during the trial.',
  },
  {
    question: 'What happens when my trial ends?',
    answer:
      "You'll be asked to add a payment method to continue on Pro. If you don't, your account automatically downgrades to the Starter plan. Your data is never deleted.",
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. Cancel from your account settings at any time, no questions asked. You keep access until the end of your billing period.',
  },
  {
    question: 'What is the annual discount?',
    answer:
      'Pay annually and save 20% — Pro drops from $29 to $23/month, and Agency from $79 to $63/month.',
  },
  {
    question: 'Do you support team accounts?',
    answer:
      'Team support is available on the Agency plan with up to 5 seats. Each team member gets their own login and you can control permissions.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. Each workspace is fully isolated. Passwords are hashed with bcrypt. API keys are server-side only and never exposed to the client. We use helmet, CORS whitelisting, and rate limits throughout.',
  },
  {
    question: 'What is the MCP server?',
    answer:
      'The MCP (Model Context Protocol) server lets AI agents connect to your outreach data directly. It is on the Agency roadmap and coming in a future release.',
  },
  {
    question: 'Can I export my data?',
    answer:
      "Yes. Pro and Agency plans include CSV export for prospects, links, and email logs. You can also request a full JSON export of all your data at any time.",
  },
]

// ─── FAQ Accordion item ──────────────────────────────────────────────────────

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
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
        <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4 bg-gray-50">
          {item.answer}
        </div>
      )}
    </div>
  )
}

// ─── Cell component ──────────────────────────────────────────────────────────

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <td className="px-4 py-3 text-center text-sm text-gray-700">{value}</td>
  }
  return (
    <td className="px-4 py-3 text-center">
      {value ? (
        <Check className="w-4 h-4 text-indigo-600 mx-auto" />
      ) : (
        <span className="text-gray-200 text-lg font-light">—</span>
      )}
    </td>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      {/* ── Page Hero ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Pricing
          </span>
          <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto mb-8">
            Start free, upgrade when you need more. No hidden fees. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                !annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing tiers ─────────────────────────────────────────────────── */}
      <section className="pb-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 ${
                  tier.highlighted
                    ? 'border-indigo-500 ring-2 ring-indigo-500 shadow-xl shadow-indigo-100'
                    : 'border-gray-200'
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    {tier.badge}
                  </span>
                )}

                <h2 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h2>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">{tier.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {annual ? tier.price.annual : tier.price.monthly}
                  </span>
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
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                      tier.highlighted
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tier.cta}
                    {tier.highlighted && <ArrowRight className="w-4 h-4" />}
                  </Link>
                ) : (
                  <a
                    href={tier.ctaHref}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {tier.cta}
                  </a>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            All plans include SSL, daily backups, and GDPR-compliant data handling.
          </p>
        </div>
      </section>

      {/* ── Feature comparison table ──────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Compare plans</h2>
            <p className="text-gray-600">See exactly what's included in each plan.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center px-4 py-4 font-semibold text-gray-700">Starter</th>
                  <th className="text-center px-4 py-4 font-semibold text-indigo-600">Pro</th>
                  <th className="text-center px-4 py-4 font-semibold text-gray-700">Agency</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-700">{row.feature}</td>
                    <Cell value={row.starter} />
                    <Cell value={row.pro} />
                    <Cell value={row.agency} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Frequently asked questions</h2>
            <p className="text-gray-600">Still have questions? Email us at hello@outreachtracker.io</p>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((faq) => (
              <FAQAccordion key={faq.question} item={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-indigo-700 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500 rounded-full blur-3xl opacity-30" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-700 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="relative container mx-auto px-6 max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-4 h-4" />
            Start your 14-day free trial
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to close more links?
          </h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
            No credit card required. Full Pro access for 14 days. Upgrade or downgrade anytime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-white border border-white/30 px-8 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors"
            >
              See all features
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
