const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function getToken() {
  return localStorage.getItem('yhpo_token')
}

function getLang() {
  return localStorage.getItem('yhpo_lang') || document.documentElement.lang || 'ar'
}

function clearAdminSession() {
  localStorage.removeItem('yhpo_token')
  localStorage.removeItem('yhpo_admin')
}

function isAdminRoute() {
  return window.location.pathname.startsWith('/admin')
}

function redirectToAdminLogin() {
  if (!isAdminRoute()) return
  if (window.location.pathname === '/admin/login') return

  clearAdminSession()
  window.location.replace('/admin/login')
}

function getFallbackError(status) {
  return getLang() === 'en'
    ? `Request failed with status ${status}`
    : `فشل الطلب برمز الحالة ${status}`
}

function getSessionExpiredMessage() {
  return getLang() === 'en' ? 'Session expired' : 'انتهت الجلسة'
}

async function request(method, path, body = null, isFormData = false) {
  const headers = {}
  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Important: backend uses this to return Arabic/English messages
  headers['Accept-Language'] = getLang()

  // Do not set Content-Type manually for FormData
  // Browser must set multipart/form-data boundary automatically
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

  if (res.status === 401) {
    redirectToAdminLogin()
    throw new Error(data.error || data.message || getSessionExpiredMessage())
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || getFallbackError(res.status))
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

  uploadMany(files, folder = 'general') {
    const form = new FormData()

    Array.from(files).forEach((file) => {
      form.append('files', file)
    })

    form.append('folder', folder)

    return request('POST', '/upload/multiple', form, true)
  },

  deleteUploadedFile(url) {
    return request('DELETE', '/upload', { url })
  },
}

export default api
