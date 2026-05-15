import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, CalendarDays, Users, BarChart3, Megaphone, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout() {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Room Management', path: '/admin/rooms', icon: Building2 },
    { name: 'Bookings', path: '/admin/bookings', icon: CalendarDays },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F8FF] font-sans text-[#061B3A]">
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-sky-300/15 bg-[#061B3A] text-white md:flex">
        <div className="flex h-20 items-center border-b border-white/10 p-6">
          <Link to="/" className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1E90FF]">
              <span className="h-2 w-2 bg-white" />
            </span>
            Valedesk <span className="ml-2 rounded-full border border-sky-300/25 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-sky-200">Admin</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 py-8">
          <p className="mb-6 px-3 text-[10px] font-black uppercase tracking-widest text-sky-200/55">System Navigation</p>
          <nav className="space-y-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path || '#'}
                  className={`flex items-center gap-4 rounded-2xl px-3 py-2 transition-colors ${
                    isActive ? 'bg-[#1E90FF] text-white shadow-[0_14px_34px_rgba(30,144,255,0.25)]' : 'text-white/45 hover:bg-white/7 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <button onClick={signOut} className="flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-4 text-white/45 transition-colors hover:bg-white/7 hover:text-white">
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#F4F8FF] valedesk-light-grid">
        <div className="mx-auto max-w-7xl p-6 md:p-8 lg:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
