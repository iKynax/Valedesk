import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

const CODE_LENGTH = 6

export default function AdminAccessPage() {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^[a-zA-Z0-9]?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)
    setError('')
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
    const newCode = [...code]
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i]
    }
    setCode(newCode)
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleSubmit = async () => {
    const entered = code.join('')
    if (entered.length < CODE_LENGTH) return
    setLoading(true)

    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 400))

    const validCode = import.meta.env.VITE_ADMIN_ACCESS_CODE || 'VDADM1'
    if (entered === validCode) {
      sessionStorage.setItem('valedesk_admin_access', 'true')
      navigate('/admin/auth')
    } else {
      setShake(true)
      setError('Invalid access code')
      setCode(Array(CODE_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
      setTimeout(() => setShake(false), 600)
    }
    setLoading(false)
  }

  const isFilled = code.every(c => c !== '')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050B18] p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/8 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-3xl border border-white/8 bg-[#0F1E35] p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex items-center gap-2 text-2xl font-black uppercase tracking-tighter text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
                <span className="h-2.5 w-2.5 bg-white" />
              </span>
              Valedesk
            </div>
            <ShieldCheck className="mb-4 h-10 w-10 text-[#2563EB]" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Admin Access
            </h1>
            <p className="mt-2 text-sm text-[#94A3B8]">Enter your access code to continue</p>
          </div>

          {/* Code Input */}
          <motion.div
            animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="mb-6 flex justify-center gap-3"
            onPaste={handlePaste}
          >
            {code.map((char, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                maxLength={1}
                value={char}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="h-14 w-12 rounded-xl border-2 border-white/10 bg-white/5 text-center text-xl font-bold text-white transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            ))}
          </motion.div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-center text-sm font-medium text-red-400"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isFilled || loading}
            className="w-full rounded-xl bg-[#2563EB] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying…
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </div>

        {/* Back link */}
        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-[#94A3B8] transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Valedesk
        </Link>
      </motion.div>
    </div>
  )
}
