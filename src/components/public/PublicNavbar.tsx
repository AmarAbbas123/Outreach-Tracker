import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Link2, Menu, X, Sparkles, ArrowRight } from 'lucide-react'

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-all px-3 py-1.5 rounded-full ${
      isActive
        ? 'text-indigo-600 font-semibold bg-indigo-50/80'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
    }`

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'
          : 'bg-white/70 backdrop-blur-md border-b border-slate-200/40'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Link2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white ring-1 ring-emerald-500/20" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                  Outreach<span className="text-indigo-600">Tracker</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  AI 2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight -mt-1 hidden sm:block">
                Autonomous Link Acquisition
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-50/80 p-1.5 rounded-full border border-slate-200/60 shadow-inner">
            <NavLink to="/features" className={navLinkClass}>
              Features
            </NavLink>
            <NavLink to="/pricing" className={navLinkClass}>
              Pricing
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About Us
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact Us
            </NavLink>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-slate-600 hover:text-slate-900 font-medium text-sm px-4 py-2 rounded-xl hover:bg-slate-100/60 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="group relative inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-indigo-500/20 transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Start Free Trial
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            className="md:hidden p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/60"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl px-6 py-6 space-y-4 shadow-xl">
          <div className="flex flex-col space-y-1">
            <NavLink
              to="/features"
              className="px-4 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              Features
            </NavLink>
            <NavLink
              to="/pricing"
              className="px-4 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              Pricing
            </NavLink>
            <NavLink
              to="/about"
              className="px-4 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              About Us
            </NavLink>
            <NavLink
              to="/contact"
              className="px-4 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              Contact Us
            </NavLink>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              to="/login"
              className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="w-full text-center py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              Start Free Trial →
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
