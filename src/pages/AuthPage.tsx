import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

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
      // Redirect to where they came from, or dashboard/admin
      const from = (location.state as any)?.from
      const target = from || (profile?.role === 'admin' ? '/admin' : '/dashboard')
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
          <Link to="/" className="flex items-center gap-2 text-3xl font-black uppercase tracking-tighter text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1E90FF] shadow-[0_0_28px_rgba(30,144,255,0.45)]">
              <span className="h-2 w-2 bg-white" />
            </span>
            Valedesk
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

      <div className="relative flex flex-1 items-center justify-center bg-[#F4F8FF] p-6 valedesk-light-grid">
        <div className="absolute left-6 top-6 md:hidden">
          <Link to="/" className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter text-[#061B3A]">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1E90FF]">
              <span className="h-2 w-2 bg-white" />
            </span>
            Valedesk
          </Link>
        </div>

        <div className="w-full max-w-[410px] rounded-3xl border border-sky-100 bg-white/88 p-6 shadow-[0_24px_70px_rgba(30,144,255,0.12)] backdrop-blur sm:p-8">
          {!configured && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-relaxed text-amber-800">
              Add your Supabase URL and anon key to `.env.local` to enable real sign in.
            </div>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-10 grid h-12 w-full grid-cols-2 rounded-full border border-sky-100 bg-sky-50 p-1">
              <TabsTrigger value="signin" className="rounded-full text-xs font-black uppercase tracking-widest data-[state=active]:bg-[#1E90FF] data-[state=active]:text-white data-[state=active]:shadow-none">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full text-xs font-black uppercase tracking-widest data-[state=active]:bg-[#1E90FF] data-[state=active]:text-white data-[state=active]:shadow-none">Sign Up</TabsTrigger>
            </TabsList>

              <TabsContent value="signin" className="mt-0">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <div className="mb-8 text-center">
                    <h1 className="mb-2 text-4xl font-black uppercase tracking-tighter">Welcome Back</h1>
                    <p className="text-xs font-black uppercase tracking-widest text-[#061B3A]/42">Enter your details to access your dashboard</p>
                  </div>

                  <form className="space-y-6" onSubmit={submitSignIn}>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/58">Email Address</label>
                      <Input type="email" required value={signIn.email} onChange={(event) => setSignIn({ ...signIn, email: event.target.value })} placeholder="you@company.com" className="h-12 rounded-xl border-sky-100 bg-white focus-visible:ring-[#1E90FF] focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/58">Password</label>
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF] hover:underline">Forgot?</a>
                      </div>
                      <Input type="password" required value={signIn.password} onChange={(event) => setSignIn({ ...signIn, password: event.target.value })} placeholder="********" className="h-12 rounded-xl border-sky-100 bg-white focus-visible:ring-[#1E90FF] focus-visible:ring-offset-0" />
                    </div>
                    <Button type="submit" disabled={loading || !configured} className="h-14 w-full rounded-full bg-[#1E90FF] text-xs font-black uppercase tracking-widest text-white shadow-[0_14px_34px_rgba(30,144,255,0.28)] hover:bg-[#0B5ED7]">
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>

                  <div className="mt-8 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/35 before:h-px before:flex-1 before:bg-sky-100 after:h-px after:flex-1 after:bg-sky-100">
                    OR CONTINUE WITH
                  </div>

                    <Button type="button" disabled={!configured} onClick={google} variant="outline" className="mt-8 flex h-14 w-full items-center gap-2 rounded-full border-sky-200 text-xs font-black uppercase tracking-widest text-[#061B3A] hover:bg-sky-50">
                      Google
                    </Button>
                </motion.div>
              </TabsContent>

              <TabsContent value="signup" key="signup" className="mt-0">
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <div className="mb-8 text-center">
                    <h1 className="mb-2 text-4xl font-black uppercase tracking-tighter">Create Account</h1>
                    <p className="text-xs font-black uppercase tracking-widest text-[#061B3A]/42">Join Valedesk to start booking spaces</p>
                  </div>

                  <form className="space-y-6" onSubmit={submitSignUp}>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/58">Full Name</label>
                      <Input type="text" required value={signUp.name} onChange={(event) => setSignUp({ ...signUp, name: event.target.value })} placeholder="John Doe" className="h-12 rounded-xl border-sky-100 bg-white focus-visible:ring-[#1E90FF] focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/58">Email Address</label>
                      <Input type="email" required value={signUp.email} onChange={(event) => setSignUp({ ...signUp, email: event.target.value })} placeholder="you@company.com" className="h-12 rounded-xl border-sky-100 bg-white focus-visible:ring-[#1E90FF] focus-visible:ring-offset-0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#061B3A]/58">Password</label>
                      <Input type="password" required minLength={8} value={signUp.password} onChange={(event) => setSignUp({ ...signUp, password: event.target.value })} placeholder="********" className="h-12 rounded-xl border-sky-100 bg-white focus-visible:ring-[#1E90FF] focus-visible:ring-offset-0" />
                    </div>
                    <Button type="submit" disabled={loading || !configured} className="h-14 w-full rounded-full bg-[#1E90FF] text-xs font-black uppercase tracking-widest text-white shadow-[0_14px_34px_rgba(30,144,255,0.28)] hover:bg-[#0B5ED7]">
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                  </form>

                  <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-[#061B3A]/38">
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
