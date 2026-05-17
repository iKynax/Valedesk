import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, BarChart3, CalendarDays, Building2, Users,
  Megaphone, Settings, LogOut, ArrowLeft, Bell, Menu, X, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'motion/react'

const NAV_ITEMS = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Bookings', path: '/admin/bookings', icon: CalendarDays },
  { name: 'Rooms', path: '/admin/rooms', icon: Building2 },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Promotions', path: '/admin/promotions', icon: Megaphone },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
]

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])
  return (
    <span className="text-xs font-medium text-[#94A3B8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {time.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
      {' · '}
      {time.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, profile } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Auto-collapse on smaller screens
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 1280) setCollapsed(true)
      else setCollapsed(false)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  // Close mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const currentPage = NAV_ITEMS.find(item =>
    item.path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(item.path)
  )

  const handleSignOut = async () => {
    sessionStorage.removeItem('valedesk_admin_access')
    sessionStorage.removeItem('valedesk_admin_auth')
    await signOut()
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`flex h-16 items-center border-b border-white/8 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]">
            <span className="h-2 w-2 bg-white" />
          </span>
          {!collapsed && (
            <span className="flex items-center gap-2 text-lg font-black uppercase tracking-tighter" style={{ fontFamily: 'Syne, sans-serif' }}>
              Valedesk
              <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Admin</span>
            </span>
          )}
        </Link>
      </div>

      {/* Admin Info */}
      {!collapsed && profile && (
        <div className="border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/20 text-sm font-bold text-[#2563EB]">
              {(profile.full_name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{profile.full_name || 'Admin'}</p>
              <p className="truncate text-xs text-[#94A3B8]">Administrator</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className={`mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#94A3B8]/50 ${collapsed ? 'text-center' : 'px-3'}`}>
          {collapsed ? '•••' : 'Navigation'}
        </p>
        <div className="space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.path}
                title={collapsed ? item.name : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#2563EB]/15 text-[#60A5FA] border border-[#2563EB]/30'
                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-white border border-transparent'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-[#60A5FA]' : ''}`} />
                {!collapsed && <span>{item.name}</span>}
                {collapsed && (
                  <div className="pointer-events-none absolute left-full z-50 ml-3 hidden rounded-lg bg-[#0F1E35] px-3 py-1.5 text-xs font-medium text-white shadow-xl group-hover:block">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/8 px-3 py-3 space-y-1">
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#94A3B8] transition-all hover:bg-white/5 hover:text-white ${collapsed ? 'justify-center' : ''}`}
        >
          <ArrowLeft className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Back to Dashboard</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#94A3B8] transition-all hover:bg-red-500/10 hover:text-red-400 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#050B18]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden flex-col border-r border-white/8 bg-[#0A1628] transition-all duration-300 md:flex ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[#0A1628] shadow-2xl md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/8 bg-[#0A1628]/80 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-[#94A3B8] hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              {currentPage?.name || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <button className="relative text-[#94A3B8] hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#2563EB]" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/20 text-xs font-bold text-[#2563EB]">
              {(profile?.full_name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
