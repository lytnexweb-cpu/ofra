import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/auth.api'
import { profileApi, type UpdateProfileInfoRequest } from '../api/profile.api'
import { subscriptionApi } from '../api/subscription.api'
import { stripeApi } from '../api/stripe.api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import ChangeEmailForm from '../components/ChangeEmailForm'
import {
  User,
  Shield,
  Phone,
  Building2,
  BadgeCheck,
  FileSignature,
  LogOut,
  Check,
  AlertCircle,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CreditCard,
  HardHat,
  Infinity,
  Loader2,
  XCircle,
} from 'lucide-react'
import { toast } from '../hooks/use-toast'

type TabType = 'profile' | 'security' | 'subscription'

export default function AccountPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // Get current user data
  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  const user = userData?.data?.user

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    agency: '',
    licenseNumber: '',
    emailSignature: '',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showChangeEmail, setShowChangeEmail] = useState(false)

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfileInfo,
    onSuccess: (response) => {
      if (response.success && response.data) {
        setSuccessMessage(t('settings.updateSuccess'))
        setErrorMessage('')
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    },
    onError: () => {
      setErrorMessage(t('settings.updateError'))
      setSuccessMessage('')
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: (response) => {
      if (response.success) {
        setSuccessMessage(t('settings.updateSuccess'))
        setErrorMessage('')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage(response.error?.message || t('settings.updateError'))
      }
    },
    onError: () => {
      setErrorMessage(t('settings.updateError'))
      setSuccessMessage('')
    },
  })

  // Logout all mutation
  const logoutAllMutation = useMutation({
    mutationFn: profileApi.logoutAll,
    onSuccess: () => {
      navigate('/login')
    },
  })

  const handleLogoutAll = () => {
    if (window.confirm(t('account.security.logoutAllDescription'))) {
      logoutAllMutation.mutate()
    }
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    const data: UpdateProfileInfoRequest = {
      fullName: profileForm.fullName || undefined,
      phone: profileForm.phone || undefined,
      agency: profileForm.agency || undefined,
      licenseNumber: profileForm.licenseNumber || undefined,
      emailSignature: profileForm.emailSignature || undefined,
    }
    updateProfileMutation.mutate(data)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage(t('auth.passwordMismatch'))
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setErrorMessage(t('auth.passwordTooShort'))
      return
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      newPasswordConfirmation: passwordForm.confirmPassword,
    })
  }

  // Update form state when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        agency: user.agency || '',
        licenseNumber: user.licenseNumber || '',
        emailSignature: user.emailSignature || '',
      })
    }
  }, [user])

  // K2: Subscription data
  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.get,
    staleTime: 2 * 60 * 1000,
  })
  const sub = subData?.data

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: stripeApi.cancel,
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: t('account.subscription.cancelSuccess'), variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['subscription'] })
      } else {
        toast({ title: res.error?.message || t('common.error'), variant: 'destructive' })
      }
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const tabs = [
    { id: 'profile' as const, label: t('account.tabs.profile'), icon: User },
    { id: 'security' as const, label: t('account.tabs.security'), icon: Shield },
    { id: 'subscription' as const, label: t('account.tabs.subscription'), icon: CreditCard },
  ]

  // Get initials for avatar
  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div data-testid="account-page">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-stone-900"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('account.title')}
        </h1>
        <p className="mt-1 text-stone-500">{t('account.subtitle')}</p>
      </div>

      {/* Profile Card with Avatar */}
      <div className="mb-6 bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white bg-primary"
        >
          {initials}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{user?.fullName || '—'}</h2>
          <p className="text-sm text-stone-500">{user?.email || '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-stone-200">
        <nav className="-mb-px flex gap-6" aria-label={t('common.tabNavigation')}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSuccessMessage('')
                  setErrorMessage('')
                }}
                className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-emerald-50 border-l-4 border-emerald-500 p-4">
          <Check className="w-5 h-5 text-emerald-600" />
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border-l-4 border-red-500 p-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-2xl">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-stone-900 mb-6">
                {t('account.profile.title')}
              </h2>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                    <User className="w-4 h-4 text-stone-400" />
                    {t('account.profile.fullName')}
                  </label>
                  <Input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                      <Mail className="w-4 h-4 text-stone-400" />
                      {t('account.profile.email')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowChangeEmail(!showChangeEmail)}
                      className="text-xs font-medium text-[#1e3a5f] hover:underline"
                    >
                      {showChangeEmail ? t('addOffer.cancel') : t('account.security.changeEmail')}
                    </button>
                  </div>
                  {showChangeEmail ? (
                    <ChangeEmailForm
                      currentEmail={user?.email || ''}
                      onSuccess={() => setShowChangeEmail(false)}
                    />
                  ) : (
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-stone-50 text-stone-500"
                    />
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                    <Phone className="w-4 h-4 text-stone-400" />
                    {t('account.profile.phone')}
                  </label>
                  <Input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="506-555-1234"
                  />
                </div>

                {/* Agency */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                    <Building2 className="w-4 h-4 text-stone-400" />
                    {t('account.profile.agency')}
                  </label>
                  <Input
                    type="text"
                    value={profileForm.agency}
                    onChange={(e) => setProfileForm({ ...profileForm, agency: e.target.value })}
                    placeholder="Royal LePage Atlantic"
                  />
                </div>

                {/* License Number */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                    <BadgeCheck className="w-4 h-4 text-stone-400" />
                    {t('account.profile.licenseNumber')}
                  </label>
                  <Input
                    type="text"
                    value={profileForm.licenseNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                    placeholder="NB-12345"
                  />
                </div>

                {/* Email Signature */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                    <FileSignature className="w-4 h-4 text-stone-400" />
                    {t('account.profile.emailSignature')}
                  </label>
                  <textarea
                    rows={4}
                    value={profileForm.emailSignature}
                    onChange={(e) => setProfileForm({ ...profileForm, emailSignature: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow resize-none"
                    placeholder={t('account.profile.signaturePlaceholder')}
                  />
                  <p className="mt-2 text-xs text-stone-500">
                    {t('account.profile.signatureHint')}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {updateProfileMutation.isPending ? t('account.saving') : t('account.save')}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-stone-900 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-stone-400" />
                {t('account.security.changePassword')}
              </h2>
              <p className="text-sm text-stone-500 mb-6">{t('account.security.passwordHint')}</p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    {t('account.security.currentPassword')}
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    {t('account.security.newPassword')}
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    {t('account.security.confirmPassword')}
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {changePasswordMutation.isPending ? t('account.saving') : t('account.security.changePassword')}
                </Button>
              </form>
            </div>

            {/* Logout All */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-stone-900 mb-2 flex items-center gap-2">
                <LogOut className="w-5 h-5 text-stone-400" />
                {t('account.security.logoutAll')}
              </h2>
              <p className="text-stone-500 text-sm mb-4">
                {t('account.security.logoutAllDescription')}
              </p>
              <Button
                variant="destructive"
                onClick={handleLogoutAll}
                disabled={logoutAllMutation.isPending}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                {logoutAllMutation.isPending
                  ? t('account.security.loggingOut')
                  : t('account.security.logoutAllButton')}
              </Button>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {subLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : sub ? (
              <>
                {/* Current Plan */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-stone-400" />
                      {t('account.subscription.currentPlan')}
                    </h2>
                    {sub.billing.isFounder && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                        <HardHat className="w-3.5 h-3.5" />
                        {t('account.subscription.founder')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-primary">
                      {sub.plan?.name ?? t('account.subscription.noPlan')}
                    </span>
                    <span className="text-sm text-stone-500 capitalize">
                      ({t(`account.subscription.${sub.billing.cycle}`)})
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mb-4">
                    {t(`account.subscription.status.${sub.billing.subscriptionStatus}`)}
                  </p>

                  <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                    {t('account.subscription.changePlan')}
                  </Button>
                </div>

                {/* Usage */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-stone-900 mb-4">
                    {t('account.subscription.usage')}
                  </h2>

                  <div className="space-y-4">
                    {/* Transactions usage */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-stone-600">
                          {t('account.subscription.activeTransactions')}
                        </span>
                        <span className="font-medium text-stone-900">
                          {sub.usage.activeTransactions}
                          {sub.usage.maxTransactions !== null
                            ? ` / ${sub.usage.maxTransactions}`
                            : <span className="inline-flex items-center gap-0.5 ml-1 text-stone-400">/ <Infinity className="w-3.5 h-3.5" /></span>
                          }
                        </span>
                      </div>
                      {sub.usage.maxTransactions !== null && (
                        <div className="w-full bg-stone-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              sub.usage.activeTransactions > sub.usage.maxTransactions
                                ? 'bg-red-500'
                                : sub.usage.activeTransactions >= sub.usage.maxTransactions * 0.8
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (sub.usage.activeTransactions / sub.usage.maxTransactions) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Storage usage */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-stone-600">
                          {t('account.subscription.storage')}
                        </span>
                        <span className="font-medium text-stone-900">
                          {sub.usage.storageUsedGb.toFixed(1)} / {sub.usage.maxStorageGb} Go
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            sub.usage.maxStorageGb > 0 && sub.usage.storageUsedGb / sub.usage.maxStorageGb > 0.8
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${sub.usage.maxStorageGb > 0 ? Math.min(100, (sub.usage.storageUsedGb / sub.usage.maxStorageGb) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grace Period Warning */}
                {sub.grace.active && (
                  <div className={`rounded-xl p-4 border ${
                    (sub.grace.daysRemaining ?? 0) <= 0
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      (sub.grace.daysRemaining ?? 0) <= 0 ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {(sub.grace.daysRemaining ?? 0) <= 0
                        ? t('account.subscription.graceExpired')
                        : t('account.subscription.graceWarning', { days: sub.grace.daysRemaining })
                      }
                    </p>
                  </div>
                )}

                {/* Cancel subscription */}
                {sub.billing.subscriptionStatus === 'active' && sub.plan && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-2 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-stone-400" />
                      {t('account.subscription.cancelTitle')}
                    </h2>
                    <p className="text-sm text-stone-500 mb-4">
                      {t('account.subscription.cancelDesc')}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(t('account.subscription.cancelConfirm'))) {
                          cancelMutation.mutate()
                        }
                      }}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {t('account.subscription.cancelButton')}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center text-stone-500">
                {t('account.subscription.noPlan')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
