import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, Heart, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { hasSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';
import LogoutModal from '@/components/LogoutModal';

export default function DashboardLayout() {
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load real unread notification count
  useEffect(() => {
    if (!user || !hasSupabaseConfig()) return;
    const supabase = createClient();

    // Initial load
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .then(({ count }) => {
        if (count !== null) setUnreadCount(count);
      });

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('sidebar-notif-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          // Re-fetch count on any change
          supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false)
            .then(({ count }) => {
              if (count !== null) setUnreadCount(count);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: Home },
    { name: 'Browse Spaces', path: '/dashboard/rooms', icon: Search },
    { name: 'My Bookings', path: '/dashboard/bookings', icon: Calendar },
    { name: 'Favourites', path: '/dashboard/favourites', icon: Heart },
    { name: 'Notifications', path: '/dashboard/notifications', icon: Bell, badge: unreadCount || undefined },
    { name: 'Profile', path: '/dashboard/profile', icon: User },
  ];

  const handleLogout = useCallback(() => {
    setShowLogout(false);
    signOut();
  }, [signOut]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F8FF] font-sans text-[#061B3A]">
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-sky-100 bg-white/90 shadow-[12px_0_40px_rgba(30,144,255,0.06)] md:flex">
        <div className="flex h-20 items-center border-b border-sky-100 bg-white px-8">
          <Link to="/" className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter text-[#061B3A]">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1E90FF]">
              <span className="h-2 w-2 bg-white" />
            </span>
            Valedesk
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-6 py-8">
          <p className="mb-6 text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Menu</p>
          <nav className="space-y-3">
            {navItems.map((item) => {
              const isActive = item.path ? location.pathname === item.path : false;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path || '#'}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2 transition-colors ${
                    isActive ? 'bg-sky-50 text-[#1E90FF]' : 'text-[#061B3A]/45 hover:bg-sky-50/70 hover:text-[#0B5ED7]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-[#1E90FF]' : 'text-[#061B3A]/40'}`} />
                    <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isActive ? 'bg-[#1E90FF] text-white' : 'bg-rose-100 text-rose-800'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-sky-100 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1E90FF] text-xs font-bold italic text-white shadow-[0_12px_24px_rgba(30,144,255,0.24)]">{(profile?.full_name || user?.email || 'VU').split(/[\s@]/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black uppercase">{profile?.full_name || user?.email || 'Valedesk User'}</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-[#061B3A]/42">{profile?.job_title || profile?.company || 'Member'}</p>
            </div>
            <button onClick={() => setShowLogout(true)} className="text-[#061B3A]/40 hover:text-[#1E90FF]">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-auto bg-[#F4F8FF] valedesk-light-grid">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-sky-100 bg-white px-6 md:hidden">
          <Link to="/" className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter text-[#061B3A]">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1E90FF]">
              <span className="h-1.5 w-1.5 bg-white" />
            </span>
            Valedesk
          </Link>
        </header>

        <div className="mx-auto w-full max-w-7xl flex-1 p-8 md:p-12">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
