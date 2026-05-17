import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, User as UserIcon, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [nearBottom, setNearBottom] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { dark, toggle } = useDarkMode();

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const bottomDistance = document.documentElement.scrollHeight - (y + window.innerHeight);
      setScrolled(y > 20);
      setNearBottom(bottomDistance < 260 && y > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClass = nearBottom
    ? 'mx-auto max-w-7xl mt-3 rounded-full bg-[#061B3A]/80 border border-white/10 py-2.5 shadow-[0_8px_32px_rgba(6,27,58,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl'
    : scrolled
      ? 'mx-auto max-w-7xl mt-3 rounded-full bg-white/60 border border-white/40 py-2.5 shadow-[0_8px_32px_rgba(30,144,255,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl'
      : 'bg-transparent border-b border-transparent py-6';

  const darkMode = nearBottom;
  const textClass = darkMode ? 'text-white' : scrolled ? 'text-[#061B3A]' : 'text-white';
  const mutedClass = darkMode ? 'text-white/55 hover:text-white' : scrolled ? 'text-[#061B3A]/55 hover:text-[#1E90FF]' : 'text-white/62 hover:text-white';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${navClass}`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between h-full">
        
        <Link to="/" className={`${textClass} font-black uppercase tracking-tighter text-3xl flex items-center gap-2 transition-colors`}>
          <span className="w-6 h-6 bg-[#1E90FF] rounded-md flex items-center justify-center shadow-[0_0_24px_rgba(30,144,255,0.45)]">
            <span className="w-2 h-2 bg-white rounded-none" />
          </span>
          Valedesk
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#spaces" className={`text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2 border-transparent hover:border-[#1E90FF] pb-1 ${mutedClass}`}>Spaces</a>
          <a href="#features" className={`text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2 border-transparent hover:border-[#1E90FF] pb-1 ${mutedClass}`}>About</a>
          <a href="#reviews" className={`text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2 border-transparent hover:border-[#1E90FF] pb-1 ${mutedClass}`}>Reviews</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className={`flex items-center justify-center h-8 w-8 rounded-full transition-all ${dark ? 'bg-white/10 text-sky-300 hover:bg-white/20' : scrolled ? 'bg-sky-50 text-[#061B3A]/50 hover:text-[#1E90FF]' : 'bg-white/10 text-white/60 hover:text-white'}`}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <>
              <div className={`flex items-center gap-2 mr-2 ${textClass}`}>
                <UserIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{profile?.full_name || user.email}</span>
              </div>
              <Link to={profile?.role === 'admin' ? '/admin' : '/dashboard'}>
                <Button className="rounded-full bg-[#1E90FF] hover:bg-[#0B5ED7] text-white px-6 text-[10px] font-bold uppercase tracking-widest shadow-[0_10px_28px_rgba(30,144,255,0.30)]">My Dashboard</Button>
              </Link>
              <Button onClick={signOut} variant="ghost" className={`text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-500/10 hover:text-red-500 ${textClass}`}>Sign Out</Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" className={`text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#1E90FF]/10 hover:text-[#1E90FF] ${textClass}`}>Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button className="rounded-full bg-[#1E90FF] hover:bg-[#0B5ED7] text-white px-6 text-[10px] font-bold uppercase tracking-widest shadow-[0_10px_28px_rgba(30,144,255,0.30)]">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button 
          className={`md:hidden p-2 ${textClass}`}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-white valedesk-light-grid p-6 flex flex-col items-center justify-center"
          >
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
              <span className="text-[#061B3A] font-black uppercase tracking-tighter text-3xl flex items-center gap-2">
                <span className="w-6 h-6 bg-[#1E90FF] rounded-md flex items-center justify-center">
                  <span className="w-2 h-2 bg-white" />
                </span>
                Valedesk
              </span>
              <button className="text-[#061B3A] p-2 border border-sky-200 hover:bg-sky-50 rounded-full" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation menu">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col gap-8 text-center mt-20">
              <a href="#spaces" onClick={() => setMobileMenuOpen(false)} className="text-[#061B3A]/55 hover:text-[#1E90FF] text-lg font-black uppercase tracking-widest">Spaces</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-[#061B3A]/55 hover:text-[#1E90FF] text-lg font-black uppercase tracking-widest">About</a>
              <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="text-[#061B3A]/55 hover:text-[#1E90FF] text-lg font-black uppercase tracking-widest">Reviews</a>
            </div>

            <div className="mt-auto w-full max-w-sm flex flex-col gap-4">
              {user ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-[#061B3A] mb-2">
                    <UserIcon className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-widest">{profile?.full_name || user.email}</span>
                  </div>
                  <Link to={profile?.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#1E90FF] text-white hover:bg-[#0B5ED7] rounded-full text-xs font-bold uppercase tracking-widest">My Dashboard</Button>
                  </Link>
                  <Button onClick={() => { signOut(); setMobileMenuOpen(false); }} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-full text-xs font-bold uppercase tracking-widest">Sign Out</Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-sky-200 text-[#061B3A] hover:bg-sky-50 rounded-full text-xs font-bold uppercase tracking-widest">Sign In</Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#1E90FF] text-white hover:bg-[#0B5ED7] rounded-full text-xs font-bold uppercase tracking-widest">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
