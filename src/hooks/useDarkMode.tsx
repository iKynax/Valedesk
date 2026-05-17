import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface DarkModeContextType {
  dark: boolean
  toggle: () => void
}

const DarkModeContext = createContext<DarkModeContextType>({ dark: false, toggle: () => {} })

const STORAGE_KEY = 'valedesk-dark-mode'

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      // Default to light if no preference saved
      return stored === null ? false : stored === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, dark.toString())
    if (dark) {
      document.documentElement.classList.add('vd-dark')
    } else {
      document.documentElement.classList.remove('vd-dark')
    }
  }, [dark])

  return (
    <DarkModeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  return useContext(DarkModeContext)
}
