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
import EditTransactionPage from '../pages/EditTransactionPage'
import SettingsPage from '../pages/SettingsPage'
import AccountPage from '../pages/AccountPage'
import Layout from '../components/Layout'
import AdminLayout from '../components/AdminLayout'
import {
  AdminDashboardPage,
  AdminSubscribersPage,
  AdminActivityPage,
  AdminSystemPage,
  AdminPlansPage,
} from '../pages/admin'

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
  // Superadmins skip onboarding - they go directly to their destination
  const isSuperadmin = user?.role === 'superadmin'
  if (!skipOnboardingCheck && user && !user.onboardingCompleted && !isSuperadmin && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

// Admin route - requires admin or superadmin role
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">{/* Silent loading */}</div>
  }

  if (!data?.success) {
    return <Navigate to="/login" replace />
  }

  const user = data.data?.user
  if (!user?.role || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <Navigate to="/" replace />
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
        path: 'transactions/new',
        element: <EditTransactionPage />,
      },
      {
        path: 'transactions/:id',
        element: <TransactionDetailPage />,
      },
      {
        path: 'transactions/:id/edit',
        element: <EditTransactionPage />,
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
  // Admin routes
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: 'subscribers',
        element: <AdminSubscribersPage />,
      },
      {
        path: 'activity',
        element: <AdminActivityPage />,
      },
      {
        path: 'system',
        element: <AdminSystemPage />,
      },
      {
        path: 'plans',
        element: <AdminPlansPage />,
      },
    ],
  },
])
