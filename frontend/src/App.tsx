import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import Sentry from './lib/sentry'
import { queryClient } from './app/queryClient'
import { router } from './app/router'
import { ThemeProvider } from './contexts/ThemeContext'
import { TooltipProvider } from './components/ui/Tooltip'
import Toaster from './components/ui/Toaster'

function LanguageSync() {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  return null
}

function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-6">An unexpected error occurred. Please refresh the page.</p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Refresh
      </button>
    </div>
  )
}

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <LanguageSync />
            <RouterProvider router={router} />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  )
}

export default App
