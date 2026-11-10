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
} from 'lucide-react'

interface FeatureCard {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const featureCards: FeatureCard[] = [
  {
    icon: Users,
    title: 'Clients & Campaigns',
    description:
      'Organise work by client and by goal. Set targets and track progress.',
  },
  {
    icon: Globe,
    title: 'Prospect Database',
    description:
      'Store websites and contacts. Import CSV, detect duplicates automatically.',
  },
  {
    icon: KanbanSquare,
    title: 'Pipeline Board',
    description:
      '8-stage Kanban from New to Link Live. Drag, drop, and move fast.',
  },
  {
    icon: Mail,
    title: 'Email Templates',
    description:
      'Write once, reuse forever. Variables like {{name}} and {{domain}} fill in automatically.',
  },
  {
    icon: BellRing,
    title: 'Follow-up Sequences',
    description:
      'Set automatic reminders or send follow-up emails when there\'s no reply.',
  },
  {
    icon: CheckSquare,
    title: 'Task Reminders',
    description: 'Daily list of what\'s due today and what\'s overdue.',
  },
  {
    icon: Link2,
    title: 'Won Links Tracker',
    description: 'Log every link, its cost, and check it\'s still live.',
  },
  {
    icon: Sparkles,
    title: 'AI Features',
    description:
      'AI email writer, reply sorter, and prospect scorer. You approve before anything sends.',
  },
]

export default function Features() {
  return (
    <>
      {/* ── Page Hero ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-5">
            Everything you need to close more links
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No spreadsheets. No forgotten follow-ups. No missed links.
          </p>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────────────────── */}
      <section className="pb-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featureCards.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="flex gap-5 p-6 border border-gray-100 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 w-11 h-11 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-indigo-700">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Start your free trial
          </h2>
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
