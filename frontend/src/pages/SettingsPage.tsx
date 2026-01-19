import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { profileApi, type UpdateProfileInfoRequest } from '../api/profile.api'
import { useTheme } from '../contexts/ThemeContext'
import ChangePasswordForm from '../components/ChangePasswordForm'
import ChangeEmailForm from '../components/ChangeEmailForm'

type TabType = 'password' | 'email' | 'profile' | 'signature' | 'appearance'

export default function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('password')

  // Get current user data
  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  })

  const user = userData?.data?.user
  const currentEmail = user?.email || ''

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    agency: user?.agency || '',
    licenseNumber: user?.licenseNumber || '',
    dateFormat: (user?.dateFormat as 'DD/MM/YYYY' | 'MM/DD/YYYY') || 'DD/MM/YYYY',
    timezone: user?.timezone || 'America/Toronto',
  })

  // Signature form state
  const [signatureForm, setSignatureForm] = useState({
    emailSignature: user?.emailSignature || '',
  })

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfileInfo,
    onSuccess: (response) => {
      if (response.success && response.data) {
        setSuccessMessage(response.data.message)
        setErrorMessage('')
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        // Clear message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.error?.message || 'Failed to update profile')
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
    if (
      window.confirm(
        'Are you sure you want to sign out from all devices? You will be redirected to the login page.'
      )
    ) {
      logoutAllMutation.mutate()
    }
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: UpdateProfileInfoRequest = {
      fullName: profileForm.fullName || undefined,
      phone: profileForm.phone || undefined,
      agency: profileForm.agency || undefined,
      licenseNumber: profileForm.licenseNumber || undefined,
      dateFormat: profileForm.dateFormat,
      timezone: profileForm.timezone,
    }
    updateProfileMutation.mutate(data)
  }

  const handleSignatureSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: UpdateProfileInfoRequest = {
      emailSignature: signatureForm.emailSignature || undefined,
    }
    updateProfileMutation.mutate(data)
  }

  // Update form state when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        agency: user.agency || '',
        licenseNumber: user.licenseNumber || '',
        dateFormat: (user.dateFormat as 'DD/MM/YYYY' | 'MM/DD/YYYY') || 'DD/MM/YYYY',
        timezone: user.timezone || 'America/Toronto',
      })
      setSignatureForm({
        emailSignature: user.emailSignature || '',
      })
    }
  }, [user])

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('password')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            🔒 Password
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            ✉️ Email
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            👤 Profile
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'signature'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            ✍️ Email Signature
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            🎨 Appearance
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl">
        {activeTab === 'password' && (
          <div className="space-y-6">
            <ChangePasswordForm />

            {/* Logout All Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sign Out Everywhere</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sign out from all devices and sessions. You will be redirected to the login page.
              </p>
              <button
                onClick={handleLogoutAll}
                disabled={logoutAllMutation.isPending}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logoutAllMutation.isPending ? 'Signing out...' : 'Sign Out Everywhere'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'email' && <ChangeEmailForm currentEmail={currentEmail} />}

        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>

            {successMessage && (
              <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4">
                <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4">
                <p className="text-sm text-red-800 dark:text-red-300">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="555-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agency</label>
                <input
                  type="text"
                  value={profileForm.agency}
                  onChange={(e) => setProfileForm({ ...profileForm, agency: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your Real Estate Agency"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  License Number
                </label>
                <input
                  type="text"
                  value={profileForm.licenseNumber}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, licenseNumber: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="ABC-12345"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                  Regional Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date Format
                    </label>
                    <select
                      value={profileForm.dateFormat}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          dateFormat: e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY',
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (25/12/2025)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (12/25/2025)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Timezone
                    </label>
                    <select
                      value={profileForm.timezone}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, timezone: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="America/Toronto">America/Toronto (EST/EDT)</option>
                      <option value="America/Montreal">America/Montreal (EST/EDT)</option>
                      <option value="America/Vancouver">America/Vancouver (PST/PDT)</option>
                      <option value="America/Edmonton">America/Edmonton (MST/MDT)</option>
                      <option value="America/Winnipeg">America/Winnipeg (CST/CDT)</option>
                      <option value="America/Halifax">America/Halifax (AST/ADT)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'signature' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Email Signature
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Customize the signature that appears in automated emails sent to clients.
            </p>

            {successMessage && (
              <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4">
                <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4">
                <p className="text-sm text-red-800 dark:text-red-300">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSignatureSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Custom Signature
                </label>
                <textarea
                  rows={5}
                  value={signatureForm.emailSignature}
                  onChange={(e) =>
                    setSignatureForm({ ...signatureForm, emailSignature: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Best regards,&#10;John Doe&#10;Real Estate Broker&#10;Phone: 555-1234&#10;www.mybroker.com"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  If empty, a default signature with your name will be used.
                </p>
              </div>

              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProfileMutation.isPending ? 'Updating...' : 'Update Signature'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'appearance' && <AppearanceTab />}
      </div>
    </div>
  )
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme()

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      description: 'Always use light mode',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      description: 'Always use dark mode',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
    {
      value: 'system' as const,
      label: 'System',
      description: 'Follow your system settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Appearance
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Choose how Ofra looks on your device.
      </p>

      <div className="space-y-3">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
              theme === option.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                theme === option.value
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {option.icon}
            </div>
            <div className="flex-1 text-left">
              <p
                className={`font-medium ${
                  theme === option.value
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {option.label}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {option.description}
              </p>
            </div>
            {theme === option.value && (
              <svg
                className="w-5 h-5 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
