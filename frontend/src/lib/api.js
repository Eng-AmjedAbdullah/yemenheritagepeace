const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function clearAdminSession() {
  localStorage.removeItem('yhpo_token')
  localStorage.removeItem('yhpo_admin')
}

function getToken() {
  return localStorage.getItem('yhpo_token')
}

function isAdminRoute() {
  return window.location.pathname.startsWith('/admin')
}

function isAdminLoginRoute() {
  return window.location.pathname === '/admin/login'
}

function redirectToAdminLogin(reason = 'expired') {
  if (!isAdminRoute()) return
  if (isAdminLoginRoute()) return

  const currentPath = `${window.location.pathname}${window.location.search}`

  clearAdminSession()

  window.location.replace(
    `/admin/login?reason=${reason}&next=${encodeURIComponent(currentPath)}`
  )
}

async function request(method, path, body = null, isFormData = false) {
  const headers = {}
  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const options = {
    method,
    headers,
  }

  if (body !== null && body !== undefined) {
    options.body = isFormData ? body : JSON.stringify(body)
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const res = await fetch(`${BASE}/api${normalizedPath}`, options)

  let data = {}
  const contentType = res.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json')) {
      data = await res.json()
    } else {
      const text = await res.text()
      data = text ? { message: text } : {}
    }
  } catch {
    data = {}
  }

  /*
    Session expired / invalid token:
    Backend should return 401.
    Then we clear localStorage and redirect any /admin route to /admin/login.
  */
  if (res.status === 401) {
    redirectToAdminLogin('expired')

    throw new Error(
      data.error ||
        data.message ||
        'Session expired. Please login again.'
    )
  }

  if (!res.ok) {
    throw new Error(
      data.error ||
        data.message ||
        `Request failed with status ${res.status}`
    )
  }

  return data
}

export const api = {
  get(path) {
    return request('GET', path)
  },

  post(path, body) {
    return request('POST', path, body)
  },

  put(path, body) {
    return request('PUT', path, body)
  },

  patch(path, body) {
    return request('PATCH', path, body)
  },

  delete(path, body = null) {
    return request('DELETE', path, body)
  },

  upload(file, folder = 'general') {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)

    return request('POST', '/upload', form, true)
  },

  deleteUploadedFile(url) {
    return request('DELETE', '/upload', { url })
  },
}

export default api
