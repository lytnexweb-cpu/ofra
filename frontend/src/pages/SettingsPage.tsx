import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { profileApi, type UpdateProfileInfoRequest } from '../api/profile.api'
import ChangePasswordForm from '../components/ChangePasswordForm'
import ChangeEmailForm from '../components/ChangeEmailForm'

type TabType = 'password' | 'email' | 'profile' | 'signature'

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
  useState(() => {
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
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('password')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔒 Password
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ✉️ Email
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👤 Profile
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'signature'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ✍️ Email Signature
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl">
        {activeTab === 'password' && (
          <div className="space-y-6">
            <ChangePasswordForm />

            {/* Logout All Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign Out Everywhere</h2>
              <p className="text-gray-600 mb-4">
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
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>

            {successMessage && (
              <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="555-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Agency</label>
                <input
                  type="text"
                  value={profileForm.agency}
                  onChange={(e) => setProfileForm({ ...profileForm, agency: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your Real Estate Agency"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  License Number
                </label>
                <input
                  type="text"
                  value={profileForm.licenseNumber}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, licenseNumber: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="ABC-12345"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-4">
                  Regional Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (25/12/2025)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (12/25/2025)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <select
                      value={profileForm.timezone}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, timezone: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Email Signature
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Customize the signature that appears in automated emails sent to clients.
            </p>

            {successMessage && (
              <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSignatureSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Custom Signature
                </label>
                <textarea
                  rows={5}
                  value={signatureForm.emailSignature}
                  onChange={(e) =>
                    setSignatureForm({ ...signatureForm, emailSignature: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Best regards,&#10;John Doe&#10;Real Estate Broker&#10;Phone: 555-1234&#10;www.mybroker.com"
                />
                <p className="mt-2 text-xs text-gray-500">
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
      </div>
    </div>
  )
}
