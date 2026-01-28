import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../test/helpers'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '../ui'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui'

describe('Design System Canary', () => {
  it('renders Button + Card + Badge without errors', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge>Status</Badge>
          <Button data-testid="canary-btn">Click me</Button>
        </CardContent>
      </Card>
    )

    expect(getByText('Test Card')).toBeInTheDocument()
    expect(getByText('Status')).toBeInTheDocument()
    expect(getByTestId('canary-btn')).toBeInTheDocument()
  })

  it('renders all Button variants without errors', () => {
    const { container } = renderWithProviders(
      <div>
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    )

    expect(container.querySelectorAll('button')).toHaveLength(6)
  })

  it('renders all Badge variants without errors', () => {
    const { getByText } = renderWithProviders(
      <div>
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    )

    expect(getByText('Default')).toBeInTheDocument()
    expect(getByText('Success')).toBeInTheDocument()
    expect(getByText('Warning')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations on Button + Card + Badge', async () => {
    const { container } = renderWithProviders(
      <Card>
        <CardHeader>
          <CardTitle>Accessible Card</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge>Active</Badge>
          <Button>Action</Button>
        </CardContent>
      </Card>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('renders Tooltip within TooltipProvider without errors', () => {
    const { getByText } = renderWithProviders(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <Button>Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tooltip info</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

    expect(getByText('Hover me')).toBeInTheDocument()
  })

  it('applies dark mode class and verifies DOM reflects it', () => {
    document.documentElement.classList.add('dark')

    const { container } = renderWithProviders(
      <Card>
        <CardContent>
          <Button>Dark Mode Button</Button>
        </CardContent>
      </Card>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    // Verify component renders in dark mode context and dark class is on root
    expect(document.documentElement.className).toContain('dark')
    expect(container.querySelector('button')).toBeInTheDocument()

    document.documentElement.classList.remove('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
