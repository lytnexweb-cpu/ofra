import { useEffect } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import LandingPage from '../pages/LandingPage'
import PricingPage from '../pages/PricingPage'
import PrivacyPage from '../pages/PrivacyPage'
import TermsPage from '../pages/TermsPage'
import ContactPage from '../pages/ContactPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import OnboardingPage from '../pages/OnboardingPage'
import DashboardPage from '../pages/DashboardPage'
import ClientsPage from '../pages/ClientsPage'
import ClientDetailsPage from '../pages/ClientDetailsPage'
import TransactionsPage from '../pages/TransactionsPage'
import TransactionDetailPage from '../pages/TransactionDetailPage'
import SettingsPage from '../pages/SettingsPage'
import AccountPage from '../pages/AccountPage'
import Layout from '../components/Layout'

// D40: Protected route that also checks for onboarding
function ProtectedRoute({ children, skipOnboardingCheck = false }: { children: React.ReactNode; skipOnboardingCheck?: boolean }) {
  const location = useLocation()
  const { i18n } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Apply user's saved language preference (but NOT during onboarding - user is choosing!)
  const user = data?.data?.user
  useEffect(() => {
    // Don't override language choice during onboarding - the user is actively choosing
    if (skipOnboardingCheck) return

    // Only sync from backend if user has completed onboarding
    if (user?.onboardingCompleted && user?.language && user.language !== i18n.language) {
      i18n.changeLanguage(user.language)
    }
  }, [user?.language, user?.onboardingCompleted, i18n, skipOnboardingCheck])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">{/* Silent loading */}</div>
  }

  if (!data?.success) {
    return <Navigate to="/login" replace />
  }

  // D40: Redirect to onboarding if not completed (unless we're already on onboarding page)
  if (!skipOnboardingCheck && user && !user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/welcome',
    element: <LandingPage />,
  },
  {
    path: '/pricing',
    element: <PricingPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  // D40: Onboarding route (protected but outside main layout)
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute skipOnboardingCheck>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'clients',
        element: <ClientsPage />,
      },
      {
        path: 'clients/:id',
        element: <ClientDetailsPage />,
      },
      {
        path: 'transactions',
        element: <TransactionsPage />,
      },
      {
        path: 'transactions/:id',
        element: <TransactionDetailPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'account',
        element: <AccountPage />,
      },
    ],
  },
])
