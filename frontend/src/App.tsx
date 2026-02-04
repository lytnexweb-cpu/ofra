import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LanguageSync />
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
