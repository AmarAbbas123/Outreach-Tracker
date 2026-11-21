import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  Sparkles,
  ShieldAlert,
} from 'lucide-react'

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Us',
    description: 'Direct email for sales, demos, or general inquiries.',
    contact: 'support@outreachtracker.io',
    action: 'mailto:support@outreachtracker.io',
  },
  {
    icon: MessageSquare,
    title: 'Sales & Enterprise',
    description: 'Looking for custom agency plans or high-volume API limits?',
    contact: 'sales@outreachtracker.io',
    action: 'mailto:sales@outreachtracker.io',
  },
  {
    icon: MapPin,
    title: 'Global Headquarters',
    description: 'Operating globally with core presence in:',
    contact: 'San Francisco, CA & London, UK',
    action: '#',
  },
  {
    icon: Clock,
    title: 'Response Time',
    description: 'Our customer success team responds within:',
    contact: '< 2 Hours (24/7 on weekdays)',
    action: '#',
  },
]

const faqs = [
  {
    q: 'How does the AI Web Scraper find verified contacts?',
    a: 'Our crawler scans target websites, autonomously explores relevant subpages (like /about, /team, or /contact), and extracts public email addresses, phone numbers, and social profiles while respecting robots.txt politeness and SSRF safety.',
  },
  {
    q: 'Can I import my existing Excel or CSV spreadsheets?',
    a: 'Yes! You can upload any CSV or XLSX file into our AI Data Cleaning Studio. You can then standardize columns, merge duplicates, and transform data using natural language prompts.',
  },
  {
    q: 'Do you offer a free trial or starter plan?',
    a: 'Yes, our Free Starter Plan lets you explore the platform, run up to 50 scrape queries, and track link prospects without entering any credit card information.',
  },
  {
    q: 'Can multiple team members collaborate on the same client campaign?',
    a: 'Absolutely. Pro and Agency plans support multi-user workspaces with role-based access, client segregations, and shared email templates.',
  },
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    inquiryType: 'sales',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Simulate instant safe submission
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 800)
  }

  return (
    <div className="bg-white">
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative py-20 bg-gradient-to-b from-indigo-50/70 via-white to-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative container mx-auto px-6 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-indigo-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            We’d Love to Hear From You
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4 tracking-tight">
            Get in touch with the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              OutreachTracker team
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Have questions about our AI Web Scraper, Data Cleaning Studio, or Enterprise pricing? Reach out to us anytime.
          </p>
        </div>
      </section>

      {/* ─── Contact Info Cards ──────────────────────────────────────────────── */}
      <section className="py-6 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.title}
                  className="bg-gray-50/80 p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{m.title}</h3>
                  <p className="text-gray-500 text-xs mb-3">{m.description}</p>
                  <p className="text-sm font-semibold text-indigo-600 break-words">{m.contact}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Main Form & Details ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left: Contact Form */}
            <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a direct message</h2>
              <p className="text-gray-500 text-sm mb-8">
                Fill out the form below and an outreach specialist will reply within 2 business hours.
              </p>

              {submitted ? (
                <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900">Message Delivered!</h3>
                  <p className="text-emerald-700 text-sm max-w-md mx-auto">
                    Thank you for reaching out, <strong>{formData.name || 'there'}</strong>. We have received your inquiry regarding <strong>{formData.inquiryType}</strong> and will follow up shortly at <strong>{formData.email}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setFormData({ name: '', email: '', subject: '', inquiryType: 'sales', message: '' })
                    }}
                    className="mt-4 inline-block text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 px-4 py-2 rounded-lg hover:bg-emerald-50"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Sarah Connor"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="sarah@company.com"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Inquiry Topic
                      </label>
                      <select
                        value={formData.inquiryType}
                        onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      >
                        <option value="sales">Sales & Product Demo</option>
                        <option value="support">Technical Support</option>
                        <option value="billing">Billing & Agency Plans</option>
                        <option value="feedback">Feature Request / Feedback</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g. Scraper volume requirements"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      How Can We Help? *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your outreach targets, domain volume, or technical questions..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-50"
                  >
                    {submitting ? (
                      'Sending message...'
                    ) : (
                      <>
                        Send Message <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right: Guarantee & Direct Contacts */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-8 rounded-3xl shadow-md">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Operational Status
                </div>
                <h3 className="text-xl font-bold mb-3">All Crawling & AI Services Operational</h3>
                <p className="text-indigo-200 text-sm leading-relaxed mb-6">
                  Our crawler clusters, DNS resolution servers, and Gemini extraction pipelines are actively running with 99.98% historical uptime.
                </p>
                <div className="border-t border-indigo-800/80 pt-4 text-xs text-indigo-300 flex justify-between">
                  <span>Current API Latency: <strong>48ms</strong></span>
                  <span>Active Scrape Tasks: <strong>Healthy</strong></span>
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 space-y-4">
                <h4 className="font-bold text-gray-900 text-base">Why Contact Us?</h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    Custom scraping recipe consultation for tricky javascript sites
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    Dedicated IP pools and high-volume limits for link agencies
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    Assistance importing historical spreadsheets and campaigns
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Frequently Asked Questions ───────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={faq.q}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
