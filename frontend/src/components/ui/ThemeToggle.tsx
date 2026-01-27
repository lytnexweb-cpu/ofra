import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const next = () => {
    const order = ['system', 'light', 'dark'] as const
    const idx = order.indexOf(theme)
    setTheme(order[(idx + 1) % order.length])
  }

  const icon = theme === 'dark'
    ? <Moon className="h-4 w-4" />
    : theme === 'light'
      ? <Sun className="h-4 w-4" />
      : <Monitor className="h-4 w-4" />

  const label = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'

  return (
    <button
      onClick={next}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={`Theme: ${label}. Click to change.`}
      data-testid="theme-toggle"
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  )
}
