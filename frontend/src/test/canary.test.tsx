import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { renderWithProviders } from './helpers'

function DummyComponent() {
  return (
    <main>
      <h1>Canary</h1>
      <button data-testid="canary-btn" type="button">
        Click me
      </button>
    </main>
  )
}

describe('Test infrastructure canary', () => {
  it('renders with providers and finds elements by data-testid', () => {
    const { getByTestId } = renderWithProviders(<DummyComponent />)
    expect(getByTestId('canary-btn')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(<DummyComponent />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
