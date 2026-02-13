import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/helpers'
import { mockFetch } from '../../test/setup'
import NotificationBell from '../NotificationBell'

/**
 * NotificationBell Component — Tests (RED)
 *
 * These tests define the expected behavior of the notification bell UI.
 * They will FAIL until the component is implemented.
 *
 * Component: frontend/src/components/NotificationBell.tsx
 * API: frontend/src/api/notifications.api.ts
 */

// Minimal Response-like object for fetch mock (apiRequest reads headers.get)
function jsonResponse(body: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  })
}

// Helper to mock the notifications API responses
function mockNotificationsApi(overrides?: {
  unreadCount?: number
  notifications?: Array<{
    id: number
    type: string
    icon: string
    severity: string
    title: string
    body?: string | null
    link?: string | null
    emailRecipients?: string[] | null
    readAt: string | null
    createdAt: string
  }>
}) {
  const unreadCount = overrides?.unreadCount ?? 0
  const notifications = overrides?.notifications ?? []

  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/notifications/unread-count')) {
      return jsonResponse({ success: true, data: { count: unreadCount } })
    }

    if (url.includes('/api/notifications/read-all')) {
      return jsonResponse({ success: true })
    }

    if (url.match(/\/api\/notifications\/\d+\/read/)) {
      return jsonResponse({ success: true })
    }

    if (url.includes('/api/notifications')) {
      return jsonResponse({
        success: true,
        data: {
          notifications,
          meta: { total: notifications.length, currentPage: 1, lastPage: 1 },
        },
      })
    }

    // Default: auth/me mock
    return jsonResponse({
      user: { id: 1, email: 'test@test.com', fullName: 'Test User', language: 'en' },
    })
  })
}

const sampleNotifications = [
  {
    id: 1,
    type: 'deadline_warning',
    icon: '⏰',
    severity: 'warning',
    title: 'Deadline in 48h',
    body: 'Inspection — Transaction Dupont',
    link: '/transactions/1',
    emailRecipients: null,
    readAt: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  },
  {
    id: 2,
    type: 'step_advanced',
    icon: '✅',
    severity: 'info',
    title: 'Step "Offer accepted" completed',
    body: 'Transaction Leblanc',
    link: '/transactions/2',
    emailRecipients: ['Me Tremblay (lawyer)', 'Marie Dupont (client)'],
    readAt: null,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
  },
  {
    id: 3,
    type: 'blocking_alert',
    icon: '⚠️',
    severity: 'urgent',
    title: 'URGENT — Blocking condition overdue',
    body: 'Financing — Transaction Martin',
    link: '/transactions/3',
    emailRecipients: null,
    readAt: null,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5h ago
  },
]

describe('NotificationBell', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  // ──────────────────────────────────────────────
  // Rendering
  // ──────────────────────────────────────────────

  it('renders a bell button with notifications aria-label', async () => {
    mockNotificationsApi({ unreadCount: 0 })
    renderWithProviders(<NotificationBell />)

    const button = await screen.findByRole('button', { name: /notifications/i })
    expect(button).toBeInTheDocument()
  })

  it('shows badge with unread count when > 0', async () => {
    mockNotificationsApi({ unreadCount: 5 })
    renderWithProviders(<NotificationBell />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  it('does not show badge when unread count is 0', async () => {
    mockNotificationsApi({ unreadCount: 0 })
    renderWithProviders(<NotificationBell />)

    // Wait for data to load, then check no badge
    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })

  it('shows 9+ when unread count exceeds 9', async () => {
    mockNotificationsApi({ unreadCount: 15 })
    renderWithProviders(<NotificationBell />)

    await waitFor(() => {
      expect(screen.getByText('9+')).toBeInTheDocument()
    })
  })

  // ──────────────────────────────────────────────
  // Dropdown behavior
  // ──────────────────────────────────────────────

  it('opens dropdown with notification list on click', async () => {
    const user = userEvent.setup()
    mockNotificationsApi({
      unreadCount: 3,
      notifications: sampleNotifications,
    })

    renderWithProviders(<NotificationBell />)

    const button = await screen.findByRole('button', { name: /notifications/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Deadline in 48h')).toBeInTheDocument()
      expect(screen.getByText('Step "Offer accepted" completed')).toBeInTheDocument()
      expect(screen.getByText('URGENT — Blocking condition overdue')).toBeInTheDocument()
    })
  })

  it('shows email recipients in notification body', async () => {
    const user = userEvent.setup()
    mockNotificationsApi({
      unreadCount: 1,
      notifications: [sampleNotifications[1]], // The one with email recipients
    })

    renderWithProviders(<NotificationBell />)

    const button = await screen.findByRole('button', { name: /notifications/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Me Tremblay/)).toBeInTheDocument()
      expect(screen.getByText(/Marie Dupont/)).toBeInTheDocument()
    })
  })

  it('shows empty state when no notifications', async () => {
    const user = userEvent.setup()
    mockNotificationsApi({
      unreadCount: 0,
      notifications: [],
    })

    renderWithProviders(<NotificationBell />)

    const button = await screen.findByRole('button', { name: /notifications/i })
    await user.click(button)

    await waitFor(() => {
      // Should show some empty state message
      expect(screen.getByText(/no notification/i)).toBeInTheDocument()
    })
  })

  // ──────────────────────────────────────────────
  // Urgent notification styling
  // ──────────────────────────────────────────────

  it('applies urgent styling to blocking condition alerts', async () => {
    const user = userEvent.setup()
    mockNotificationsApi({
      unreadCount: 1,
      notifications: [sampleNotifications[2]], // urgent severity
    })

    renderWithProviders(<NotificationBell />)

    const button = await screen.findByRole('button', { name: /notifications/i })
    await user.click(button)

    await waitFor(() => {
      const urgentNotif = screen.getByText('URGENT — Blocking condition overdue')
      // The parent container should have urgent styling (red background)
      const container = urgentNotif.closest('[data-severity="urgent"]') ||
        urgentNotif.closest('.bg-red-50') ||
        urgentNotif.closest('[class*="urgent"]')
      expect(container).toBeInTheDocument()
    })
  })

  // ──────────────────────────────────────────────
  // Mark as read
  // ──────────────────────────────────────────────

  it('calls mark-all-read API when "Mark all read" button is clicked', async () => {
    const user = userEvent.setup()
    mockNotificationsApi({
      unreadCount: 3,
      notifications: sampleNotifications,
    })

    renderWithProviders(<NotificationBell />)

    const button = await screen.findByRole('button', { name: /notifications/i })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Deadline in 48h')).toBeInTheDocument()
    })

    const markAllButton = screen.getByRole('button', { name: /mark all/i })
    await user.click(markAllButton)

    // Verify the API was called
    await waitFor(() => {
      const calls = mockFetch.mock.calls
      const readAllCall = calls.find(
        (call: any[]) => call[0]?.includes('/api/notifications/read-all')
      )
      expect(readAllCall).toBeDefined()
    })
  })
})
