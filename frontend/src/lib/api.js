const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, { token, method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.detail
      ? Array.isArray(data.detail)
        ? data.detail.map((d) => d.msg).join(' ')
        : data.detail
      : 'Something went wrong. Please try again.'
    throw new Error(message)
  }
  return data
}

export const api = {
  me: (token) => request('/api/me', { token }),
  checkUsername: (username) => request(`/api/username-check/${encodeURIComponent(username)}`),
  onboard: (token, payload) => request('/api/onboarding', { token, method: 'POST', body: payload }),
  updateProfile: (token, payload) => request('/api/profile', { token, method: 'PATCH', body: payload }),
  submitTestAttempt: (token, payload) => request('/api/test-attempts', { token, method: 'POST', body: payload }),
  listTestAttempts: (token) => request('/api/test-attempts', { token }),
}
