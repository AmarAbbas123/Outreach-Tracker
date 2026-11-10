import { Link2 } from 'lucide-react'

interface FooterColumn {
  heading: string
  links: { label: string }[]
}

const columns: FooterColumn[] = [
  {
    heading: 'Product',
    links: [{ label: 'Features' }, { label: 'Pricing' }, { label: 'Changelog' }],
  },
  {
    heading: 'Company',
    links: [{ label: 'About' }, { label: 'Blog' }, { label: 'Contact' }],
  },
  {
    heading: 'Legal',
    links: [{ label: 'Privacy' }, { label: 'Terms' }],
  },
]

export default function PublicFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-6 max-w-6xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg mb-3">
              <Link2 className="w-5 h-5" />
              <span className="text-gray-900">OutreachTracker</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Run smarter outreach, win more links.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">{col.heading}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-400 text-center">
            © 2026 OutreachTracker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
