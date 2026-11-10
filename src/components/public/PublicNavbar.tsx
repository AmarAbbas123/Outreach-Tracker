import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Link2, Menu, X } from 'lucide-react'

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-indigo-600 font-medium'
      : 'text-gray-600 hover:text-gray-900 transition-colors font-medium'

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <Link2 className="w-5 h-5" />
            <span className="text-gray-900">OutreachTracker</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/features" className={navLinkClass}>Features</NavLink>
            <NavLink to="/pricing" className={navLinkClass}>Pricing</NavLink>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4">
          <NavLink
            to="/features"
            className={navLinkClass}
            onClick={() => setMobileOpen(false)}
          >
            Features
          </NavLink>
          <NavLink
            to="/pricing"
            className={navLinkClass}
            onClick={() => setMobileOpen(false)}
          >
            Pricing
          </NavLink>
          <hr className="border-gray-100" />
          <Link
            to="/login"
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  )
}
