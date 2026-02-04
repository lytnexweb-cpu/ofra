import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import ReturnBanner from '../ReturnBanner'

const STORAGE_KEY = 'ofra-lastSeenAt'

describe('ReturnBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0))
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is visible when lastSeenAt is older than 24h (AC3)', () => {
    // Set lastSeenAt to 25h ago
    const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000)
    localStorage.setItem(STORAGE_KEY, String(twentyFiveHoursAgo))

    renderWithProviders(<ReturnBanner />)

    expect(screen.getByTestId('return-banner')).toBeInTheDocument()
    expect(screen.getByText('Welcome back! Here\'s what changed since your last visit.')).toBeInTheDocument()
  })

  it('is hidden when lastSeenAt is less than 24h (AC4)', () => {
    // Set lastSeenAt to 1h ago
    const oneHourAgo = Date.now() - (1 * 60 * 60 * 1000)
    localStorage.setItem(STORAGE_KEY, String(oneHourAgo))

    renderWithProviders(<ReturnBanner />)

    expect(screen.queryByTestId('return-banner')).not.toBeInTheDocument()
  })

  it('is hidden when no lastSeenAt in localStorage', () => {
    // No localStorage entry = first visit
    renderWithProviders(<ReturnBanner />)

    expect(screen.queryByTestId('return-banner')).not.toBeInTheDocument()
  })

  it('dismiss button hides the banner', () => {
    const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000)
    localStorage.setItem(STORAGE_KEY, String(twentyFiveHoursAgo))

    renderWithProviders(<ReturnBanner />)
    expect(screen.getByTestId('return-banner')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('return-banner-dismiss'))

    expect(screen.queryByTestId('return-banner')).not.toBeInTheDocument()
  })

  it('updates lastSeenAt in localStorage on render', () => {
    renderWithProviders(<ReturnBanner />)

    const stored = localStorage.getItem(STORAGE_KEY)
    expect(stored).toBeTruthy()
    expect(Number(stored)).toBeGreaterThan(0)
  })

  it('has no WCAG 2.1 AA accessibility violations when visible', async () => {
    const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000)
    localStorage.setItem(STORAGE_KEY, String(twentyFiveHoursAgo))

    const { container } = renderWithProviders(<ReturnBanner />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
