import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import ValedeskLogo from '@/components/ValedeskLogo';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, configured, user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  const [signIn, setSignIn] = useState({ email: '', password: '' });
  const [signUp, setSignUp] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  // After signup, we don't want the auto-redirect to fire
  const [justSignedUp, setJustSignedUp] = useState(false);

  // If the user is already authenticated, redirect them away from the auth page
  useEffect(() => {
    if (authLoading || justSignedUp) return
    if (user) {
      // Wait for profile to be loaded before deciding where to redirect
      // This prevents admin users from being sent to /dashboard before their role is known
      if (!profile) return // profile still loading — wait for next render

      const from = (location.state as any)?.from
      const isAdmin = profile?.role === 'admin' || sessionStorage.getItem('valedesk_admin_auth') === 'true'
      const target = from || (isAdmin ? '/admin' : '/dashboard')
      navigate(target, { replace: true })
    }
  }, [authLoading, justSignedUp, user, profile, navigate, location.state])

  const submitSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await signInWithEmail(signIn.email, signIn.password);
      if (error) throw error;
      toast.success('Welcome back.');
      // The onAuthStateChange SIGNED_IN event will set user, which triggers
      // the useEffect redirect above. No need to navigate manually.
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const submitSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setJustSignedUp(true);
    try {
      const { data, error } = await signUpWithEmail(signUp.email, signUp.password, signUp.name);
      if (error) throw error;

      // Supabase may auto-confirm the user or require email verification.
      // If the user is auto-confirmed, data.session will be set.
      if (data.session) {
        // Auto-confirmed — the SIGNED_IN event will fire and handle redirect
        toast.success('Account created! Redirecting to dashboard...');
        setJustSignedUp(false); // allow the redirect
      } else {
        // Email confirmation required — ask user to check their email
        toast.success('Account created! Please check your email to verify your account, then sign in.');
        setActiveTab('signin');
        setSignUp({ name: '', email: '', password: '' });
        setJustSignedUp(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign up failed.');
      setJustSignedUp(false);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google sign in failed.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F8FF] font-sans text-[#061B3A] md:flex-row">
      <div className="relative hidden flex-1 overflow-hidden bg-[#061B3A] p-12 text-white md:flex md:flex-col">
        <div className="absolute inset-0 valedesk-grid opacity-65" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-[#1E90FF]/25 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          <Link to="/" className="flex items-center">
            <ValedeskLogo variant="dark" className="h-12" />
          </Link>

          <div className="max-w-md">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-white/8 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-100">
              <span className="status-dot status-dot-blue" />
              Booking access
            </div>
            <h2 className="mb-6 text-6xl font-black uppercase leading-none tracking-tighter lg:text-8xl">
              Your
              <br />
              space.
              <br />
              Your
              <br />
              flow.
            </h2>
            <p className="text-lg font-medium leading-relaxed text-white/62">Join forward-thinking teams bridging remote freedom with premium physical spaces.</p>
          </div>

          <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.055] p-8 backdrop-blur">
            <div className="mb-6 flex gap-1 text-xl text-[#38BDF8]">*****</div>
            <p className="mb-6 font-medium text-white/82">"The booking system is frictionless and the spaces are amazing. It transformed how our remote team collaborates."</p>
            <div className="flex items-center gap-4 border-t border-white/10 pt-6">
              <img src="https://i.pravatar.cc/100?img=9" alt="James K." className="h-10 w-10 rounded-full object-cover" />
              <div className="text-xs">
                <p className="font-black uppercase tracking-widest text-white">James K.</p>
                <p className="font-bold uppercase tracking-widest text-white/40">Engineering Lead</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-[#F4F8FF] p-6 valedesk-light-grid dark:bg-[#0A1628]">
        <div className="absolute left-6 top-6 md:hidden">
          <Link to="/" className="flex items-center">
            <ValedeskLogo variant="auto" className="h-10" />
          </Link>
        </div>

        <div className="w-full max-w-[410px] rounded-3xl border border-sky-100 bg-white/88 p-6 shadow-[0_24px_70px_rgba(30,144,255,0.12)] backdrop-blur sm:p-8 dark:border-white/10 dark:bg-[#0F1E35] dark:shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
          {!configured && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-relaxed text-amber-800">
              Add your Supabase URL and anon key to `.env.local` to enable real sign in.
            </div>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-10 grid h-12 w-full grid-cols-2 rounded-full border border-sky-100 bg-sky-50 p-1 dark:border-white/10 dark:bg-white/5">
              <TabsTrigger value="signin" className="rounded-full text-xs font-black uppercase tracking-widest" style={{ color: activeTab === 'signin' ? '#fff' : undefined, backgroundColor: activeTab === 'signin' ? '#1E90FF' : 'transparent', boxShadow: 'none' }}>Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full text-xs font-black uppercase tracking-widest" style={{ color: activeTab === 'signup' ? '#fff' : undefined, backgroundColor: activeTab === 'signup' ? '#1E90FF' : 'transparent', boxShadow: 'none' }}>Sign Up</TabsTrigger>
            </TabsList>

              <TabsContent value="signin" className="mt-0">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <div className="mb-8 text-center">
                    <h1 className="mb-2 text-4xl font-black uppercase tracking-tighter dark:text-white">Welcome Back</h1>
                    <p className="text-xs font-black uppercase tracking-widest text-[#061B3A]/42 dark:text-white/50">Enter your details to access your dashboard</p>
                  </div>

                  <form className="space-y-6" onSubmit={submitSignIn}>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/58 dark:text-white/60">Email Address</label>
                      <Input type="email" required value={signIn.email} onChange={(event) => setSignIn({ ...signIn, email: event.target.value })} placeholder="you@company.com" className="h-12 rounded-xl border-sky-100 bg-white focus-visible:ring-[#1E90FF] focus-visible:ring-offset-0 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/58 dark:text-white/60">Password</label>
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF] hover:underline">Forgot?</a>
                      </div>
                      <Input type="password" required value={signIn.password} onChange={(event) => setSignIn({ ...signIn, password: event.target.value })} placeholder="********" className="h-12 rounded-xl border-sky-100 bg-white focus-visible:ring-[#1E90FF] focus-visible:ring-offset-0 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30" />
                    </div>
                    <Button type="submit" disabled={loading || !configured} className="h-14 w-full rounded-full bg-[#1E90FF] text-xs font-black uppercase tracking-widest text-white shadow-[0_14px_34px_rgba(30,144,255,0.28)] hover:bg-[#0B5ED7]">
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>

                  <div className="mt-8 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/35 before:h-px before:flex-1 before:bg-sky-100 after:h-px after:flex-1 after:bg-sky-100 dark:text-white/35 dark:before:bg-white/10 dark:after:bg-white/10">
                    OR CONTINUE WITH
                  </div>

                    <Button type="button" disabled={!configured} onClick={google} variant="outline" className="mt-8 flex h-14 w-full items-center gap-3 rounded-full border-sky-200 text-xs font-black uppercase tracking-widest text-[#061B3A] hover:bg-sky-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5">
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.77z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Continue with Google
                    </Button>
                </motion.div>
              </TabsContent>

              <TabsContent value="signup" key="signup" className="mt-0">
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <div className="mb-8 text-center">
                    <h1 className="mb-2 text-4xl font-black uppercase tracking-tighter dark:text-white">Create Account</h1>
                    <p className="text-xs font-black uppercase tracking-widest text-[#061B3A]/42 dark:text-white/50">Join Valedesk to start booking spaces</p>
                  </div>

                  <form className="space-y-6" onSubmit={submitSignUp}>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/58 dark:text-white/60">Full Name</label>
                      <Input type="text" required value={signUp.name} onChange={(event) => setSignUp({ ...signUp, name: event.target.value })} placeholder="John Doe" className="h-12 rounded-xl border-sky-100 bg-white focus-visible:ring-[#1E90FF] focus-visible:ring-offset-0 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/58 dark:text-white/60">Email Address</label>
                      <Input type="email" required value={signUp.email} onChange={(event) => setSignUp({ ...signUp, email: event.target.value })} placeholder="you@company.com" className="h-12 rounded-xl border-sky-100 bg-white focus-visible:ring-[#1E90FF] focus-visible:ring-offset-0 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/58 dark:text-white/60">Password</label>
                      <Input type="password" required minLength={8} value={signUp.password} onChange={(event) => setSignUp({ ...signUp, password: event.target.value })} placeholder="********" className="h-12 rounded-xl border-sky-100 bg-white focus-visible:ring-[#1E90FF] focus-visible:ring-offset-0 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30" />
                    </div>
                    <Button type="submit" disabled={loading || !configured} className="h-14 w-full rounded-full bg-[#1E90FF] text-xs font-black uppercase tracking-widest text-white shadow-[0_14px_34px_rgba(30,144,255,0.28)] hover:bg-[#0B5ED7]">
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                  </form>

                  <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-[#061B3A]/38 dark:text-white/40">
                    By continuing, you agree to Valedesk's <a href="#" className="text-[#1E90FF] underline">Terms</a> and <a href="#" className="text-[#1E90FF] underline">Privacy Policy</a>.
                  </p>
                </motion.div>
              </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
