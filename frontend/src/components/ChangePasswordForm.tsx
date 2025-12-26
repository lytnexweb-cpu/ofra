import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { profileApi } from '../api/profile.api'

interface ChangePasswordFormProps {
  onSuccess?: () => void
}

export default function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const changePasswordMutation = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: (response) => {
      if (response.success && response.data) {
        setSuccessMessage(response.data.message)
        setErrorMessage('')
        // Reset form
        setCurrentPassword('')
        setNewPassword('')
        setNewPasswordConfirmation('')
        onSuccess?.()
      } else {
        setErrorMessage(response.error?.message || 'Failed to change password')
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
    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long')
      return
    }

    if (newPassword !== newPasswordConfirmation) {
      setErrorMessage('New passwords do not match')
      return
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      newPasswordConfirmation,
    })
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {errorMessage}
          </div>
        )}

        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={changePasswordMutation.isPending}
          />
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={changePasswordMutation.isPending}
          />
          <p className="mt-1 text-sm text-gray-500">Minimum 8 characters</p>
        </div>

        {/* Confirm New Password */}
        <div>
          <label
            htmlFor="newPasswordConfirmation"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm New Password
          </label>
          <input
            type="password"
            id="newPasswordConfirmation"
            value={newPasswordConfirmation}
            onChange={(e) => setNewPasswordConfirmation(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={changePasswordMutation.isPending}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  )
}
