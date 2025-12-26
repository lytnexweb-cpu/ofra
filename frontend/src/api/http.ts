const API_URL = import.meta.env.VITE_API_URL || ''

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
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

  return response.json()
}

export const http = {
  get: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'GET' }),

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
