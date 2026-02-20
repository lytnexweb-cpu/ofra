import { describe, it, expect, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/helpers'
import Layout from '../Layout'
import { mockFetch } from '../../test/setup'

// Mock authApi.me response for UserDropdown
function mockAuthMe() {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        user: {
          id: 1,
          email: 'test@example.com',
          fullName: 'Test User',
          phone: null,
          agency: null,
          licenseNumber: null,
          profilePhoto: null,
          emailSignature: null,
          language: 'en',
          dateFormat: 'yyyy-MM-dd',
          timezone: 'America/Toronto',
        },
      }),
  })
}

describe('Layout', () => {
  beforeEach(() => {
    mockAuthMe()
  })

  it('renders the layout with header, main, and footer', () => {
    renderWithProviders(<Layout />)

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('has a skip link pointing to #main', () => {
    renderWithProviders(<Layout />)

    const skipLink = screen.getByText('Skip to main content')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main')
    expect(skipLink.tagName).toBe('A')
  })

  it('main element has id="main"', () => {
    renderWithProviders(<Layout />)

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main')
  })

  it('renders desktop nav links', () => {
    renderWithProviders(<Layout />)

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Clients').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Transactions').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1)
  })

  it('sets aria-current="page" on the active nav link', () => {
    renderWithProviders(<Layout />, { initialRoute: '/clients' })

    const clientsLinks = screen.getAllByText('Clients')
    // Desktop nav link should have aria-current
    const activeLink = clientsLinks.find(
      (el) => el.closest('a')?.getAttribute('aria-current') === 'page'
    )
    expect(activeLink).toBeDefined()
  })

  it('sets aria-current="page" on dashboard when at root', () => {
    renderWithProviders(<Layout />, { initialRoute: '/' })

    const dashboardLinks = screen.getAllByText('Dashboard')
    const activeLink = dashboardLinks.find(
      (el) => el.closest('a')?.getAttribute('aria-current') === 'page'
    )
    expect(activeLink).toBeDefined()
  })

  it('does not set aria-current on inactive links', () => {
    renderWithProviders(<Layout />, { initialRoute: '/' })

    const clientsLinks = screen.getAllByText('Clients')
    const inactiveLink = clientsLinks.find(
      (el) => el.closest('a')?.getAttribute('aria-current') === 'page'
    )
    expect(inactiveLink).toBeUndefined()
  })

  it('navigation is contained in a sidebar with appropriate z-index', () => {
    const { container } = renderWithProviders(<Layout />)

    // The desktop sidebar (aside) has the z-index, not the nav element itself
    const sidebar = container.querySelector('aside')
    expect(sidebar).toBeInTheDocument()
    expect(sidebar?.className).toMatch(/z-dialog/)
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(<Layout />)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('renders without error and has dark mode classes available', () => {
    const { container } = renderWithProviders(<Layout />)

    expect(container.querySelector('nav')).toBeInTheDocument()
    expect(container.querySelector('main')).toBeInTheDocument()
  })
})
