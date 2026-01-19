import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi, beforeEach } from 'vitest'

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
