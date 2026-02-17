import { useEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import LandingPage from '../pages/LandingPage'
import PricingPage from '../pages/PricingPage'
import PrivacyPage from '../pages/PrivacyPage'
import TermsPage from '../pages/TermsPage'
import ContactPage from '../pages/ContactPage'
import AboutPage from '../pages/AboutPage'
import FounderPage from '../pages/FounderPage'
import FeaturesPage from '../pages/FeaturesPage'
import FaqPage from '../pages/FaqPage'
import LoginPage from '../pages/LoginPage'
import AdminLoginPage from '../pages/AdminLoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import VerifyEmailPage from '../pages/VerifyEmailPage'
import OnboardingPage from '../pages/OnboardingPage'
import DashboardPage from '../pages/DashboardPage'
import ClientsPage from '../pages/ClientsPage'
import ClientDetailsPage from '../pages/ClientDetailsPage'
import TransactionsPage from '../pages/TransactionsPage'
import TransactionDetailPage from '../pages/TransactionDetailPage'
import EditTransactionPage from '../pages/EditTransactionPage'
import ExportSharePage from '../pages/ExportSharePage'
import OfferIntakePage from '../pages/OfferIntakePage'
import PermissionsPage from '../pages/PermissionsPage'
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
    // Show landing page for unauthenticated visitors at root /
    if (location.pathname === '/') {
      return <LandingPage />
    }
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
    return <Navigate to="/admin/login" replace />
  }

  const user = data.data?.user
  if (!user?.role || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <ScrollToTop />,
    children: [
  {
    path: '/welcome',
    element: <Navigate to="/" replace />,
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
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/founder',
    element: <FounderPage />,
  },
  {
    path: '/features',
    element: <FeaturesPage />,
  },
  {
    path: '/faq',
    element: <FaqPage />,
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
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
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
        path: 'transactions/:id/export',
        element: <ExportSharePage />,
      },
      {
        path: 'transactions/:id/access',
        element: <PermissionsPage />,
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
  // D35: Public offer intake page (no auth required)
  {
    path: '/offer/:token',
    element: <OfferIntakePage />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
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
    ],
  },
])
