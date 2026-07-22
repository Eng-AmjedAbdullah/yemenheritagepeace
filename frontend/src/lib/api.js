import {
  startGlobalLoading,
  stopGlobalLoading,
} from '../context/LoadingContext'

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function getToken() {
  return localStorage.getItem('yhpo_token')
}

function getLang() {
  return (
    localStorage.getItem('yhpo_lang') ||
    document.documentElement.lang ||
    'ar'
  )
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
  return getLang() === 'en'
    ? 'Session expired'
    : 'انتهت الجلسة'
}

function normalizeRequestOptions(options) {
  if (!options || typeof options !== 'object') {
    return {}
  }

  return options
}

async function request(
  method,
  path,
  body = null,
  isFormData = false,
  requestOptions = {}
) {
  const config = normalizeRequestOptions(requestOptions)

  const shouldUseGlobalLoading =
    config.globalLoading ?? method === 'GET'

  const loadingToken = shouldUseGlobalLoading
    ? startGlobalLoading(
        config.loadingLabel || `${method} ${path}`
      )
    : null

  try {
    const headers = {}
    const token = getToken()

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    // Backend uses this header to return Arabic/English messages.
    headers['Accept-Language'] = getLang()

    // Do not set Content-Type manually for FormData.
    // The browser must set the multipart boundary automatically.
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    const fetchOptions = {
      method,
      headers,
    }

    if (config.signal) {
      fetchOptions.signal = config.signal
    }

    if (body !== null && body !== undefined) {
      fetchOptions.body = isFormData
        ? body
        : JSON.stringify(body)
    }

    const normalizedPath = path.startsWith('/')
      ? path
      : `/${path}`

    const response = await fetch(
      `${BASE}/api${normalizedPath}`,
      fetchOptions
    )

    let data = {}
    const contentType =
      response.headers.get('content-type') || ''

    try {
      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        data = text ? { message: text } : {}
      }
    } catch {
      data = {}
    }

    if (response.status === 401) {
      redirectToAdminLogin()

      throw new Error(
        data.error ||
          data.message ||
          getSessionExpiredMessage()
      )
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          getFallbackError(response.status)
      )
    }

    return data
  } finally {
    if (loadingToken) {
      stopGlobalLoading(loadingToken)
    }
  }
}

export const api = {
  get(path, options = {}) {
    return request('GET', path, null, false, options)
  },

  post(path, body, options = {}) {
    return request('POST', path, body, false, options)
  },

  put(path, body, options = {}) {
    return request('PUT', path, body, false, options)
  },

  patch(path, body, options = {}) {
    return request('PATCH', path, body, false, options)
  },

  delete(path, body = null, options = {}) {
    return request('DELETE', path, body, false, options)
  },

  upload(file, folder = 'general', options = {}) {
    const form = new FormData()

    form.append('file', file)
    form.append('folder', folder)

    return request('POST', '/upload', form, true, options)
  },

  uploadMany(files, folder = 'general', options = {}) {
    const form = new FormData()

    Array.from(files).forEach((file) => {
      form.append('files', file)
    })

    form.append('folder', folder)

    return request(
      'POST',
      '/upload/multiple',
      form,
      true,
      options
    )
  },



  uploadMedia(file, folder = 'general', options = {}) {
    const form = new FormData()

    form.append('file', file)
    form.append('folder', folder)

    return request('POST', '/upload/media', form, true, options)
  },

  uploadManyMedia(files, folder = 'general', options = {}) {
    const form = new FormData()

    Array.from(files).forEach((file) => {
      form.append('files', file)
    })

    form.append('folder', folder)

    return request(
      'POST',
      '/upload/media/multiple',
      form,
      true,
      options
    )
  },

  deleteUploadedFile(url, options = {}) {
    return request(
      'DELETE',
      '/upload',
      { url },
      false,
      options
    )
  },
}

export default api
