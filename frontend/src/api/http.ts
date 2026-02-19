const API_URL = import.meta.env.VITE_API_URL || ''
const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://ofra.ca'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
    retryAfter?: number
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok && response.status >= 500) {
    throw new Error(`Server error: ${response.status}`)
  }

  // Handle 204 No Content (e.g., DELETE responses)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return { success: true, data: {} as T }
  }

  const json = await response.json()

  // SiteMode redirects — redirect to marketing site for maintenance/coming_soon
  if (!json.success && json.error?.code === 'E_MAINTENANCE' && !window.location.pathname.startsWith('/maintenance')) {
    window.location.href = `${MARKETING_URL}/maintenance`
    return json
  }
  if (!json.success && json.error?.code === 'E_COMING_SOON' && !window.location.pathname.startsWith('/coming-soon')) {
    window.location.href = `${MARKETING_URL}/coming-soon`
    return json
  }

  return json
}

export const http = {
  get: <T = any>(endpoint: string, options?: { params?: Record<string, any> }) => {
    let url = endpoint
    if (options?.params) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      }
      const queryString = searchParams.toString()
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString
      }
    }
    return apiRequest<T>(url, { method: 'GET' })
  },

  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
}
