import '@testing-library/jest-dom/vitest'
import * as matchers from 'vitest-axe/matchers'
import { expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi, beforeEach } from 'vitest'

// Register vitest-axe matchers (extend-expect.js is empty in vitest-axe 0.1.0)
expect.extend(matchers)

// Mock window.matchMedia (not supported in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Cleanup DOM after each test
afterEach(() => {
  cleanup()
})

// Mock fetch globally
export const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Reset mock before each test
beforeEach(() => {
  mockFetch.mockReset()
})
