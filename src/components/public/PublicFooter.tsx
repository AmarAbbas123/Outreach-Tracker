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
    <footer className="bg-white text-gray-600 border-t border-gray-200/80 overflow-hidden relative">
      {/* Subtle top accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-16 sm:pt-20 pb-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 sm:gap-12 pb-16 border-b border-gray-100">
          {/* Brand & Value statement */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                <Link2 className="w-5 h-5" />
              </div>
              <span className="font-semibold text-xl text-gray-900 tracking-tight">
                Outreach<span className="text-indigo-600">Tracker</span>
              </span>
            </Link>

            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              The all-in-one autonomous outreach engine. Scrape verified contacts, clean messy lead lists with natural language AI, and manage high-conversion backlink pipelines.
            </p>

            {/* Live operational badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-xs text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium">All Scraping & AI Systems Operational</span>
            </div>

            <div className="pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-all shadow-2xs"
              >
                <span>Start Free Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Links Columns */}
          {columns.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-800">
                {col.heading}
              </h3>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-gray-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                      >
                        {link.label}
                        {link.badge && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-gray-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                      >
                        {link.label}
                        {link.badge && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
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
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} OutreachTracker Inc. All rights reserved.</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              SSRF & Rate-Limit Protected
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-gray-400">Designed with passion for link acquisition pros</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
