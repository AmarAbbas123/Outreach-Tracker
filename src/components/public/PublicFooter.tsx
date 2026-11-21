import { Link } from 'react-router-dom'
import { Link2, Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react'

interface FooterLink {
  label: string
  href: string
  badge?: string
  external?: boolean
}

interface FooterColumn {
  heading: string
  links: FooterLink[]
}

const columns: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Autonomous Scraper', href: '/features', badge: 'AI 2.0' },
      { label: 'Data Cleaning Studio', href: '/features' },
      { label: 'Outreach CRM & Kanban', href: '/features' },
      { label: 'Pricing Plans', href: '/pricing' },
      { label: 'Release Notes', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Support', href: '/contact' },
      { label: 'Careers', href: '/about', badge: 'Hiring' },
      { label: 'Customer Stories', href: '#' },
      { label: 'Security & Ethics', href: '/about' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Link Building Guide', href: '#' },
      { label: 'SSRF & Polite Crawling', href: '/about' },
      { label: 'API Documentation', href: '#' },
      { label: 'Community Forum', href: '#' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Robots.txt Policy', href: '#' },
      { label: 'Cookie Preferences', href: '#' },
    ],
  },
]

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 overflow-hidden relative">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl pt-20 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 pb-16 border-b border-slate-900">
          {/* Brand & Value statement */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
                <Link2 className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Outreach<span className="text-indigo-400">Tracker</span>
              </span>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The all-in-one autonomous outreach engine. Scrape verified contacts, clean messy lead lists with natural language AI, and manage high-conversion backlink pipelines.
            </p>

            {/* Live operational badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Scraping & AI Systems Operational</span>
            </div>

            <div className="pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                <span>Start Free Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Links Columns */}
          {columns.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {col.heading}
              </h3>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
                      >
                        {link.label}
                        {link.badge && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
                      >
                        {link.label}
                        {link.badge && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} OutreachTracker Inc. All rights reserved.</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              SSRF & Rate-Limit Protected
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-slate-400">Designed with passion for link acquisition pros</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
