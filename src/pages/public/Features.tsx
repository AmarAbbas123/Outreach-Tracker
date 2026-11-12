import { Link } from 'react-router-dom'
import {
  Users,
  Globe,
  KanbanSquare,
  Mail,
  BellRing,
  CheckSquare,
  Link2,
  Sparkles,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Upload,
  Tag,
  History,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react'

// ─── Feature sections ─────────────────────────────────────────────────────────

interface FeatureDetail {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  bullets: string[]
}

const featureSections: FeatureDetail[] = [
  {
    icon: Users,
    title: 'Clients & Campaigns',
    description:
      'Organise all your work by client and by goal. Set link targets per campaign and watch progress in real time.',
    bullets: [
      'Multiple clients in one workspace',
      'Per-campaign link targets and progress',
      'Campaign-level stats: prospects, reply rate, links won',
    ],
  },
  {
    icon: Globe,
    title: 'Prospect Database',
    description:
      "Your central database of every site you've ever approached. Import from CSV, search, filter, and tag.",
    bullets: [
      'Store website URL, contact name, and email',
      'CSV import with automatic duplicate detection',
      'Domain-level blacklist so you never double-contact',
      'Tags and custom notes per prospect',
    ],
  },
  {
    icon: KanbanSquare,
    title: 'Pipeline Board',
    description:
      'An 8-stage Kanban from New to Link Live. Drag cards through stages and keep the full status history.',
    bullets: [
      '8 stages: New → Contact Found → Email Sent → Replied → Negotiating → Agreed → Link Live → Rejected',
      'Drag-and-drop or table view — your choice',
      'Full status history on every prospect card',
      'Filter by campaign, status, or tag',
    ],
  },
  {
    icon: Mail,
    title: 'Email Templates',
    description:
      'Write once, personalise every time. Variables like {{name}} and {{domain}} fill in automatically.',
    bullets: [
      'Unlimited templates across campaigns',
      '{{name}}, {{domain}}, {{site_name}} variables',
      "Live preview with a real prospect's data",
      'Copy-to-clipboard or open in your mail client',
    ],
  },
  {
    icon: BellRing,
    title: 'Follow-up Sequences',
    description:
      'Marking an email as sent automatically creates a follow-up task. Logging a reply closes it.',
    bullets: [
      'Configurable follow-up delay (default 3 days)',
      "Daily to-do list of what's due and overdue",
      'Reply logs automatically complete open tasks',
      'Snooze a task when you need more time',
    ],
  },
  {
    icon: CheckSquare,
    title: 'Task Reminders',
    description:
      "Your daily action list. Know exactly what needs attention today, what's overdue, and what's coming up.",
    bullets: [
      'Today / Overdue / Upcoming / Done filters',
      'One-click complete or snooze',
      'Linked directly to the prospect and email',
    ],
  },
  {
    icon: Link2,
    title: 'Won Links Tracker',
    description:
      'Log every link you win. Track cost, anchor text, and verify the link is still live.',
    bullets: [
      'URL, anchor text, DR, and cost per link',
      'Manual link health checks',
      'Export to CSV for client reports',
      'Links count toward campaign goals',
    ],
  },
  {
    icon: Sparkles,
    title: 'AI Features',
    description:
      'AI that assists, not automates. You stay in control — the AI just does the heavy lifting.',
    bullets: [
      'AI email writer — drafts in seconds, you edit and send',
      'Reply sorter — interested, wants payment, or not interested',
      'Prospect scorer — prioritise the best opportunities first',
    ],
  },
  {
    icon: BarChart3,
    title: 'Dashboard & Reports',
    description:
      'Your outreach funnel at a glance. Know your reply rate, links won, and cost per link at all times.',
    bullets: [
      'Funnel from prospects → emails sent → replied → links won',
      'Reply rate and link win rate by campaign',
      'Cost per link and total spend',
      '30-day activity feed',
    ],
  },
]

// ─── Comparison table ────────────────────────────────────────────────────────

const comparisonRows = [
  { feature: 'Prospect database', tracker: true, spreadsheet: false, generic: false },
  { feature: 'Pipeline board (8 stages)', tracker: true, spreadsheet: false, generic: true },
  { feature: 'Duplicate detection', tracker: true, spreadsheet: false, generic: false },
  { feature: 'Email templates + variables', tracker: true, spreadsheet: false, generic: true },
  { feature: 'Follow-up task automation', tracker: true, spreadsheet: false, generic: false },
  { feature: 'Won links log', tracker: true, spreadsheet: false, generic: false },
  { feature: 'Reply rate & ROI reporting', tracker: true, spreadsheet: false, generic: false },
  { feature: 'AI email writer', tracker: true, spreadsheet: false, generic: false },
]

function Check() {
  return <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
}
function Cross() {
  return <span className="text-gray-300 text-xl font-light mx-auto block text-center">—</span>
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Features() {
  return (
    <>
      {/* ── Page Hero ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Features
          </span>
          <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
            Everything you need to close more links
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            No spreadsheets. No forgotten follow-ups. No missed links. Built specifically for
            link-building outreach teams.
          </p>
        </div>
      </section>

      {/* ── Feature detail sections ───────────────────────────────────────── */}
      <section className="pb-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureSections.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="flex flex-col p-6 border border-gray-100 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all bg-white"
                >
                  <div className="flex-shrink-0 w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{card.description}</p>
                  <ul className="space-y-2 mt-auto">
                    {card.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              OutreachTracker vs the alternatives
            </h2>
            <p className="text-gray-600">See why teams switch from spreadsheets and generic CRMs.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-semibold text-gray-900 w-1/2">Feature</th>
                  <th className="text-center px-6 py-4 font-semibold text-indigo-600">OutreachTracker</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-500">Spreadsheets</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-500">Generic CRM</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-3.5 text-gray-700">{row.feature}</td>
                    <td className="px-6 py-3.5">
                      {row.tracker ? <Check /> : <Cross />}
                    </td>
                    <td className="px-6 py-3.5">
                      {row.spreadsheet ? <Check /> : <Cross />}
                    </td>
                    <td className="px-6 py-3.5">
                      {row.generic ? <Check /> : <Cross />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <h2 className="text-4xl font-bold text-white mb-4">Start your free trial</h2>
          <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
            No credit card required. Full Pro features for 14 days.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
