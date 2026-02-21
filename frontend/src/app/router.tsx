import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import Layout from '../components/Layout'
import AdminLayout from '../components/AdminLayout'

const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://ofra.ca'

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('../pages/LoginPage'))
const AdminLoginPage = lazy(() => import('../pages/AdminLoginPage'))
const RegisterPage = lazy(() => import('../pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('../pages/VerifyEmailPage'))
const OnboardingPage = lazy(() => import('../pages/OnboardingPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const ClientsPage = lazy(() => import('../pages/ClientsPage'))
const ClientDetailsPage = lazy(() => import('../pages/ClientDetailsPage'))
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'))
const TransactionDetailPage = lazy(() => import('../pages/TransactionDetailPage'))
const EditTransactionPage = lazy(() => import('../pages/EditTransactionPage'))
const ExportSharePage = lazy(() => import('../pages/ExportSharePage'))
const OfferIntakePage = lazy(() => import('../pages/OfferIntakePage'))
const PermissionsPage = lazy(() => import('../pages/PermissionsPage'))
const ProsPage = lazy(() => import('../pages/ProsPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const AccountPage = lazy(() => import('../pages/AccountPage'))
const PricingPage = lazy(() => import('../pages/PricingPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

// Admin pages
const AdminPulsePage = lazy(() => import('../pages/admin/AdminPulsePage'))
const AdminGensPage = lazy(() => import('../pages/admin/AdminGensPage'))
const AdminConfigPage = lazy(() => import('../pages/admin/AdminConfigPage'))

function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen" role="status" aria-busy="true">
      <div className="animate-pulse text-muted-foreground text-sm">...</div>
    </div>
  )
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>
}

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
    return <PageLoading />
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
    return <PageLoading />
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
    document.getElementById('main')?.scrollTo(0, 0)
  }, [pathname])

  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <ScrollToTop />,
    children: [
  {
    path: '/login',
    element: <LazyPage><LoginPage /></LazyPage>,
  },
  {
    path: '/register',
    element: <LazyPage><RegisterPage /></LazyPage>,
  },
  {
    path: '/forgot-password',
    element: <LazyPage><ForgotPasswordPage /></LazyPage>,
  },
  {
    path: '/reset-password',
    element: <LazyPage><ResetPasswordPage /></LazyPage>,
  },
  {
    path: '/verify-email',
    element: <LazyPage><VerifyEmailPage /></LazyPage>,
  },
  // D40: Onboarding route (protected but outside main layout)
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute skipOnboardingCheck>
        <LazyPage><OnboardingPage /></LazyPage>
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
        element: <LazyPage><DashboardPage /></LazyPage>,
      },
      {
        path: 'clients',
        element: <LazyPage><ClientsPage /></LazyPage>,
      },
      {
        path: 'clients/:id',
        element: <LazyPage><ClientDetailsPage /></LazyPage>,
      },
      {
        path: 'transactions',
        element: <LazyPage><TransactionsPage /></LazyPage>,
      },
      {
        path: 'transactions/new',
        element: <LazyPage><EditTransactionPage /></LazyPage>,
      },
      {
        path: 'transactions/:id',
        element: <LazyPage><TransactionDetailPage /></LazyPage>,
      },
      {
        path: 'transactions/:id/edit',
        element: <LazyPage><EditTransactionPage /></LazyPage>,
      },
      {
        path: 'transactions/:id/export',
        element: <LazyPage><ExportSharePage /></LazyPage>,
      },
      {
        path: 'transactions/:id/access',
        element: <LazyPage><PermissionsPage /></LazyPage>,
      },
      {
        path: 'pros',
        element: <LazyPage><ProsPage /></LazyPage>,
      },
      {
        path: 'settings',
        element: <LazyPage><SettingsPage /></LazyPage>,
      },
      {
        path: 'account',
        element: <LazyPage><AccountPage /></LazyPage>,
      },
    ],
  },
  // Public pricing page (accessible without auth)
  {
    path: '/pricing',
    element: <LazyPage><PricingPage /></LazyPage>,
  },
  // D35: Public offer intake page (no auth required)
  {
    path: '/offer/:token',
    element: <LazyPage><OfferIntakePage /></LazyPage>,
  },
  {
    path: '/admin/login',
    element: <LazyPage><AdminLoginPage /></LazyPage>,
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
        element: <LazyPage><AdminPulsePage /></LazyPage>,
      },
      {
        path: 'gens',
        element: <LazyPage><AdminGensPage /></LazyPage>,
      },
      {
        path: 'config',
        element: <LazyPage><AdminConfigPage /></LazyPage>,
      },
    ],
  },
  // 404 catch-all
  {
    path: '*',
    element: <LazyPage><NotFoundPage /></LazyPage>,
  },
    ],
  },
])
