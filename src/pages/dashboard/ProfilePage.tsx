import { useEffect, useState } from 'react'
import { Upload, LogOut, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import LogoutModal from '@/components/LogoutModal'
import type { UserProfile } from '@/types'

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const [form, setForm] = useState<Partial<UserProfile>>({})
  const [saving, setSaving] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  useEffect(() => {
    if (profile) setForm(profile)
  }, [profile])

  const save = async () => {
    if (!user) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        company: form.company,
        job_title: form.job_title,
        persona: form.persona,
        preferences: form.preferences || { space_types: [], notifications: true },
        onboarded: true,
      })
      .eq('id', user.id)
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Profile saved.')
  }

  const uploadAvatar = async (file: File) => {
    if (!user) return
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (uploadError) {
      toast.error(uploadError.message)
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const { error } = await supabase.from('user_profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
    if (error) toast.error(error.message)
    else {
      setForm((current) => ({ ...current, avatar_url: data.publicUrl }))
      toast.success('Avatar updated.')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-sky-100 pb-6">
        <h1 className="mb-2 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Profile</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#1E90FF]">Account, avatar, and workspace preferences</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-sky-100 bg-white p-6 text-center shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
          <img src={form.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.full_name || user?.email || 'Valedesk')}`} alt="Avatar" className="mx-auto h-32 w-32 rounded-3xl border border-sky-100 object-cover" />
          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-sky-200 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]">
            <Upload className="h-4 w-4" /> Upload
            <input type="file" accept="image/*" hidden onChange={(event) => event.target.files?.[0] && uploadAvatar(event.target.files[0])} />
          </label>
          <Button onClick={() => setShowLogout(true)} variant="outline" className="mt-4 w-full rounded-full border-sky-200 text-[10px] font-black uppercase tracking-widest"><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
        </aside>

        <main className="rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_16px_44px_rgba(30,144,255,0.07)]">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Full Name<Input value={form.full_name || ''} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></label>
            <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Email<Input value={user?.email || ''} readOnly /></label>
            <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Phone<Input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
            <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Company<Input value={form.company || ''} onChange={(event) => setForm({ ...form, company: event.target.value })} /></label>
            <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Job Title<Input value={form.job_title || ''} onChange={(event) => setForm({ ...form, job_title: event.target.value })} /></label>
            <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-[#061B3A]/50">Persona
              <select value={form.persona || ''} onChange={(event) => setForm({ ...form, persona: event.target.value as UserProfile['persona'] })} className="h-10 w-full rounded-md border border-sky-100 bg-white px-3 text-sm normal-case tracking-normal">
                <option value="">Choose persona</option>
                <option value="individual">Individual</option>
                <option value="team_lead">Team Lead</option>
                <option value="event_organiser">Event Organiser</option>
              </select>
            </label>
          </div>
          <Button disabled={saving} onClick={save} className="mt-8 h-12 rounded-full bg-[#1E90FF] px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0B5ED7]"><Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save Profile'}</Button>
        </main>
      </div>

      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} onConfirm={() => { setShowLogout(false); signOut() }} />
    </div>
  )
}
