import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

interface ThemeContextType {
  theme: 'light'
  resolvedTheme: 'light'
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Force light mode only
  return (
    <ThemeContext.Provider value={{ theme: 'light', resolvedTheme: 'light', setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
