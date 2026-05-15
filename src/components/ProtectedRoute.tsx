import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'

export default function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, profile, loading, configured } = useAuth()
  const location = useLocation()

  // When Supabase isn't configured at all, render children in demo mode
  if (!configured) return <>{children}</>

  // Wait for the auth check to complete before making access decisions
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F8FF]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E90FF] border-t-transparent" />
          <p className="text-sm font-black uppercase tracking-widest text-[#1E90FF]">Loading...</p>
        </div>
      </div>
    )
  }

  // No authenticated user — redirect to auth page, remembering where they came from
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />

  // Admin-only route guard
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
