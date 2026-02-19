import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/sentry'
import './i18n'
import App from './App.tsx'

// D62: Clean up legacy dark mode storage
localStorage.removeItem('ofra-theme')
document.documentElement.classList.remove('dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
