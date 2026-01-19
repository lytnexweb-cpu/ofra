import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api/profile.api'

interface ChangeEmailFormProps {
  currentEmail: string
  onSuccess?: () => void
}

export default function ChangeEmailForm({ currentEmail, onSuccess }: ChangeEmailFormProps) {
  const [email, setEmail] = useState(currentEmail)
  const [currentPassword, setCurrentPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const queryClient = useQueryClient()

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (response) => {
      if (response.success && response.data) {
        setSuccessMessage(response.data.message)
        setErrorMessage('')
        setCurrentPassword('') // Clear password field
        // Invalidate auth query to refresh user data
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        onSuccess?.()
      } else {
        setErrorMessage(response.error?.message || 'Failed to update email')
        setSuccessMessage('')
      }
    },
    onError: () => {
      setErrorMessage('Network error. Please check your connection and try again.')
      setSuccessMessage('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    // Client-side validation
    if (email === currentEmail) {
      setErrorMessage('New email is the same as current email')
      return
    }

    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      return
    }

    updateProfileMutation.mutate({
      email,
      currentPassword,
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Change Email</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded">
            {errorMessage}
          </div>
        )}

        {/* Current Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Email</label>
          <input
            type="email"
            value={currentEmail}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          />
        </div>

        {/* New Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={updateProfileMutation.isPending}
          />
        </div>

        {/* Current Password (for security) */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={updateProfileMutation.isPending}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Required to confirm your identity</p>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateProfileMutation.isPending ? 'Updating Email...' : 'Update Email'}
          </button>
        </div>
      </form>
    </div>
  )
}
