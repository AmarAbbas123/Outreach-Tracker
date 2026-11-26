import { useState } from 'react'
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiryType: 'sales',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 600)
  }

  return (
    <div className="bg-white text-gray-800">
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-10 sm:pt-20 sm:pb-14 text-center">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <span className="inline-block text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full mb-4">
            Contact Support & Sales
          </span>
          <h1 className="text-3xl sm:text-5xl font-semibold text-gray-900 tracking-tight leading-tight mb-4">
            We are here to help
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-lg mx-auto">
            Have questions about scraper recipes, agency plans, or account setup? We respond promptly.
          </p>

          {/* Quick Contact Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-gray-600">
            <a
              href="mailto:support@outreachtracker.io"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              <Mail size={13} className="text-indigo-600" />
              <span>support@outreachtracker.io</span>
            </a>
            <a
              href="mailto:sales@outreachtracker.io"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              <MessageSquare size={13} className="text-indigo-600" />
              <span>sales@outreachtracker.io</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Contact Form ────────────────────────────────────────────────────── */}
      <section className="pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-xl">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-2xs">
            {submitted ? (
              <div className="p-8 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center space-y-3 animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-emerald-900">Message Received!</h3>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
                  Thank you, <strong>{formData.name || 'there'}</strong>. We have received your message and an outreach specialist will reply to <strong>{formData.email}</strong> shortly.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setFormData({ name: '', email: '', inquiryType: 'sales', message: '' })
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-white border border-emerald-200 px-4 py-2 rounded-xl font-medium hover:bg-emerald-50/50 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Inquiry Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Inquiry Topic
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sales', label: 'Sales / Agency' },
                      { id: 'support', label: 'Tech Support' },
                      { id: 'other', label: 'General' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, inquiryType: t.id })}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors text-center ${
                          formData.inquiryType === t.id
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what you'd like to ask or achieve..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl font-medium text-xs shadow-2xs transition-colors disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
