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
  ShieldCheck,
  Building,
  Check,
  ArrowRight,
} from 'lucide-react'

const contactMethods = [
  {
    icon: Mail,
    title: 'Customer Support',
    description: 'Direct email for account setup, scraper queries, or general assistance.',
    contact: 'support@outreachtracker.io',
    action: 'mailto:support@outreachtracker.io',
  },
  {
    icon: MessageSquare,
    title: 'Enterprise & Agency Sales',
    description: 'Looking for high-volume custom crawling plans or API limits?',
    contact: 'sales@outreachtracker.io',
    action: 'mailto:sales@outreachtracker.io',
  },
  {
    icon: Clock,
    title: 'Response SLA',
    description: 'Average resolution time for priority tickets:',
    contact: '< 2 Hours (24/7 coverage)',
    action: '#',
  },
  {
    icon: ShieldCheck,
    title: 'Security & Compliance',
    description: 'For vulnerability disclosures and crawler whitelisting requests:',
    contact: 'security@outreachtracker.io',
    action: 'mailto:security@outreachtracker.io',
  },
]

const faqs = [
  {
    q: 'How does the Autonomous AI Web Scraper find decision-maker emails?',
    a: 'Our crawler scans your target domain, autonomously traverses internal subpages (such as /team, /editorial, /about-us, or /contact), and extracts verified business emails and phone numbers. It filters out generic addresses like support@ or info@ when direct decision-makers are available.',
  },
  {
    q: 'Can I upload and clean my existing Excel or CSV spreadsheets?',
    a: 'Yes! The AI Data Cleaning Studio lets you upload any CSV or XLSX file. You can normalize names, remove domain blacklists, format titles, and standardize data using plain English prompts like "Capitalize names and extract clean domains".',
  },
  {
    q: 'Is there a free trial or starter plan available?',
    a: 'Yes, our Free Starter Plan allows you to discover prospects, run up to 50 AI scraper queries, and test pipeline workflows with zero credit card required.',
  },
  {
    q: 'How does continuous won-link verification work?',
    a: 'Once a prospect reaches the "Link Live" stage in your pipeline, our background verification engine periodically crawls the target publication URL to confirm that your backlink and designated anchor text remain active and DoFollow.',
  },
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    inquiryType: 'sales',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Simulate instant safe submission
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 700)
  }

  return (
    <div className="bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-indigo-200/40 via-purple-100/20 to-transparent blur-[120px] -z-10" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b0d_1px,transparent_1px),linear-gradient(to_bottom,#64748b0d_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative container mx-auto px-6 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-slate-200 shadow-sm text-xs font-semibold text-slate-800 mb-8 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Connect with our specialists</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1] mb-6">
            We are here to help you{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              scale your outreach.
            </span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Have questions about autonomous AI scraping, enterprise API limits, or migrating your agency from spreadsheets? We typically respond within two hours.
          </p>
        </div>
      </section>

      {/* ─── Contact Info Cards ──────────────────────────────────────────────── */}
      <section className="py-6">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.title}
                  className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-950 text-base mb-1">{m.title}</h3>
                    <p className="text-slate-500 text-xs mb-4 leading-relaxed">{m.description}</p>
                  </div>
                  <a
                    href={m.action}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 break-words flex items-center gap-1 group"
                  >
                    <span>{m.contact}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Main Form & FAQ Section ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left: Contact Form */}
            <div className="lg:col-span-7 bg-white p-8 md:p-12 rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-slate-950">Send us a direct message</h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Online & Active
                </span>
              </div>
              <p className="text-slate-500 text-sm mb-8">
                Fill in the details below and an outreach specialist will reply promptly.
              </p>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-950 mb-1">Message Received!</h3>
                  <p className="text-sm text-emerald-800 mb-6 max-w-md mx-auto">
                    Thank you, <strong>{formData.name || 'there'}</strong>. We have received your inquiry regarding{' '}
                    <span className="font-semibold">{formData.inquiryType}</span> and our team will reply to{' '}
                    <span className="underline font-semibold">{formData.email}</span> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setFormData({
                        name: '',
                        email: '',
                        company: '',
                        inquiryType: 'sales',
                        message: '',
                      })
                    }}
                    className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Inquiry Type Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      How can we help you?
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'sales', label: 'Agency / Sales' },
                        { id: 'support', label: 'Technical Help' },
                        { id: 'partnership', label: 'Partnership' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, inquiryType: t.id })}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                            formData.inquiryType === t.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Sarah Jenkins"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Work Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="sarah@agency.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Company / Agency Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="LinkForge Media"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tell us about your team size, outreach goals, or specific questions about the AI Scraper..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Sending message...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Message</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center">
                    We respect your privacy. No spam or third-party marketing, ever.
                  </p>
                </form>
              )}
            </div>

            {/* Right: FAQs and Direct Booking */}
            <div className="lg:col-span-5 space-y-6">
              {/* Instant Workspace Card */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white p-8 rounded-3xl border border-indigo-900/60 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Want to test it right now?</h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-6">
                    You do not need to wait for a demo call. Jump directly into our free sandbox and run your first 50 live scrape queries today.
                  </p>
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
                  >
                    <span>Launch Free Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Interactive Accordion FAQs */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Frequently Asked Questions</span>
                </h3>

                <div className="divide-y divide-slate-100">
                  {faqs.map((faq, index) => {
                    const isOpen = openFaq === index
                    return (
                      <div key={faq.q} className="py-3">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                          className="w-full flex items-center justify-between text-left gap-3 text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-indigo-600' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <p className="mt-2 text-xs text-slate-500 leading-relaxed animate-in fade-in">
                            {faq.a}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
