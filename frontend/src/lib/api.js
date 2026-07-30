import {
  startGlobalLoading,
  stopGlobalLoading,
} from '../context/LoadingContext'

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const DEFAULT_UPLOAD_TIMEOUT = 45 * 60 * 1000

const VIDEO_MIME_TYPES = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'video/ogg',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  mkv: 'video/x-matroska',
}

function getToken() {
  return localStorage.getItem('yhpo_token')
}

function isAdminRoute() {
  return window.location.pathname.startsWith('/admin')
}

function getLang() {
  const adminLang = localStorage.getItem('admin_lang')
  const publicLang = localStorage.getItem('yhpo_lang')

  if (isAdminRoute() && (adminLang === 'ar' || adminLang === 'en')) {
    return adminLang
  }

  if (publicLang === 'ar' || publicLang === 'en') {
    return publicLang
  }

  return document.documentElement.lang || 'ar'
}

function clearAdminSession() {
  localStorage.removeItem('yhpo_token')
  localStorage.removeItem('yhpo_admin')
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

function normalizeRequestOptions(options) {
  return options && typeof options === 'object' ? options : {}
}

function createApiError(message, status = 0, data = {}) {
  const error = new Error(message)
  error.status = status
  error.data = data
  return error
}

async function readResponseData(response) {
  const contentType = response.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json')) {
      return await response.json()
    }

    const text = await response.text()
    return text ? { message: text } : {}
  } catch {
    return {}
  }
}

async function request(
  method,
  path,
  body = null,
  isFormData = false,
  requestOptions = {}
) {
  const config = normalizeRequestOptions(requestOptions)
  const shouldUseGlobalLoading = config.globalLoading ?? method === 'GET'

  const loadingToken = shouldUseGlobalLoading
    ? startGlobalLoading(config.loadingLabel || `${method} ${path}`)
    : null

  try {
    const headers = {}
    const token = getToken()

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    headers['Accept-Language'] = getLang()

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
      fetchOptions.body = isFormData ? body : JSON.stringify(body)
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const response = await fetch(`${BASE}/api${normalizedPath}`, fetchOptions)
    const data = await readResponseData(response)

    if (response.status === 401) {
      redirectToAdminLogin()

      throw createApiError(
        data.error || data.message || getSessionExpiredMessage(),
        response.status,
        data
      )
    }

    if (!response.ok) {
      throw createApiError(
        data.error || data.message || getFallbackError(response.status),
        response.status,
        data
      )
    }

    return data
  } catch (error) {
    if (error?.name === 'AbortError') throw error

    if (error instanceof TypeError && /fetch|network/i.test(error.message || '')) {
      throw createApiError(
        getLang() === 'en'
          ? 'Unable to connect to the server. Check your internet connection.'
          : 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.',
        0
      )
    }

    throw error
  } finally {
    if (loadingToken) {
      stopGlobalLoading(loadingToken)
    }
  }
}

function getFileExtension(fileName) {
  const cleanName = String(fileName || '')
    .toLowerCase()
    .split('?')[0]
    .split('#')[0]

  const segments = cleanName.split('.')
  return segments.length > 1 ? segments.pop() : ''
}

function inferVideoMimeType(file) {
  const providedType = String(file?.type || '').trim().toLowerCase()

  if (providedType.startsWith('video/')) {
    return providedType
  }

  return (
    VIDEO_MIME_TYPES[getFileExtension(file?.name)] ||
    providedType ||
    'application/octet-stream'
  )
}

function parseUploadResponse(responseText) {
  try {
    return JSON.parse(responseText || '{}')
  } catch {
    return responseText ? { message: responseText } : {}
  }
}

function signedUploadErrorMessage(status, responseText) {
  const data = parseUploadResponse(responseText)
  const returnedMessage = data.error || data.message

  if (returnedMessage) return String(returnedMessage)

  if (status === 401) {
    return getLang() === 'en'
      ? 'The signed upload URL expired. Start the upload again.'
      : 'انتهت صلاحية رابط الرفع. ابدأ عملية الرفع من جديد.'
  }

  if (status === 403) {
    return getLang() === 'en'
      ? 'Storage refused the upload. Check permissions.'
      : 'رفض التخزين عملية الرفع. تحقق من الصلاحيات.'
  }

  if (status === 413) {
    return getLang() === 'en'
      ? 'The video exceeds the storage file-size limit.'
      : 'حجم الفيديو يتجاوز الحد المسموح به في التخزين.'
  }

  if (status === 0) {
    return getLang() === 'en'
      ? 'The upload connection failed. Check your internet connection.'
      : 'فشل الاتصال أثناء الرفع. تحقق من الإنترنت.'
  }

  return getLang() === 'en'
    ? `Video upload failed with status ${status}.`
    : `فشل رفع الفيديو برمز الحالة ${status}.`
}

function createAbortError() {
  return new DOMException(
    getLang() === 'en' ? 'Video upload cancelled' : 'تم إلغاء رفع الفيديو',
    'AbortError'
  )
}

/*
 * Uploads directly to the signed Supabase Storage URL.
 * The video does not pass through the backend process memory.
 */
function uploadFileToSignedUrl(signedUrl, file, options = {}) {
  return new Promise((resolve, reject) => {
    if (!signedUrl) {
      reject(
        new Error(
          getLang() === 'en'
            ? 'The signed upload URL is missing.'
            : 'رابط الرفع الموقّع غير موجود.'
        )
      )
      return
    }

    if (!(file instanceof Blob)) {
      reject(
        new TypeError(
          getLang() === 'en'
            ? 'A valid video file is required.'
            : 'ملف فيديو صالح مطلوب.'
        )
      )
      return
    }

    if (options.signal?.aborted) {
      reject(createAbortError())
      return
    }

    const xhr = new XMLHttpRequest()
    const timeoutMs = Number(options.timeoutMs) || DEFAULT_UPLOAD_TIMEOUT
    let settled = false

    const abortHandler = () => xhr.abort()

    const cleanup = () => {
      options.signal?.removeEventListener('abort', abortHandler)
      xhr.upload.onprogress = null
      xhr.onload = null
      xhr.onerror = null
      xhr.ontimeout = null
      xhr.onabort = null
    }

    const resolveOnce = (value) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(value)
    }

    const rejectOnce = (error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    xhr.open('PUT', signedUrl, true)
    xhr.timeout = timeoutMs
    xhr.withCredentials = false

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return

      const percent = Math.min(
        100,
        Math.max(0, Math.round((event.loaded / event.total) * 100))
      )

      options.onProgress?.({
        loaded: event.loaded,
        total: event.total,
        percent,
      })
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.({
          loaded: file.size,
          total: file.size,
          percent: 100,
        })

        resolveOnce({ success: true })
        return
      }

      rejectOnce(
        createApiError(
          signedUploadErrorMessage(xhr.status, xhr.responseText),
          xhr.status,
          parseUploadResponse(xhr.responseText)
        )
      )
    }

    xhr.onerror = () => {
      rejectOnce(
        createApiError(
          signedUploadErrorMessage(0, xhr.responseText),
          0
        )
      )
    }

    xhr.ontimeout = () => {
      rejectOnce(
        createApiError(
          getLang() === 'en'
            ? 'The video upload timed out. Check your connection and try again.'
            : 'انتهت مهلة رفع الفيديو. تحقق من الاتصال ثم أعد المحاولة.',
          408
        )
      )
    }

    xhr.onabort = () => rejectOnce(createAbortError())

    options.signal?.addEventListener('abort', abortHandler, { once: true })

    const form = new FormData()
    form.append('cacheControl', String(options.cacheControl || '86400'))
    form.append('file', file, file.name || 'video')

    xhr.send(form)
  })
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

    Array.from(files || []).forEach((file) => {
      form.append('files', file)
    })

    form.append('folder', folder)

    return request('POST', '/upload/multiple', form, true, options)
  },

  uploadMedia(file, folder = 'general', options = {}) {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)

    return request('POST', '/upload/media', form, true, options)
  },

  uploadManyMedia(files, folder = 'general', options = {}) {
    const form = new FormData()

    Array.from(files || []).forEach((file) => {
      form.append('files', file)
    })

    form.append('folder', folder)

    return request('POST', '/upload/media/multiple', form, true, options)
  },

  async uploadSignedMedia(
    file,
    folder = 'gallery/videos',
    options = {}
  ) {
    if (!(file instanceof Blob)) {
      throw new TypeError(
        getLang() === 'en'
          ? 'A valid video file is required.'
          : 'ملف فيديو صالح مطلوب.'
      )
    }

    if (!file.size) {
      throw new Error(
        getLang() === 'en'
          ? 'The selected video file is empty.'
          : 'ملف الفيديو المحدد فارغ.'
      )
    }

    const originalName = file.name || `video-${Date.now()}`
    const mimeType = inferVideoMimeType(file)

    options.onProgress?.({
      loaded: 0,
      total: file.size,
      percent: 0,
    })

    const signedUpload = await request(
      'POST',
      '/upload/media/signed',
      {
        original_name: originalName,
        mime_type: mimeType,
        size: file.size,
        folder,
      },
      false,
      {
        globalLoading: false,
        signal: options.signal,
        loadingLabel: 'prepare-video-upload',
      }
    )

    if (
      !signedUpload?.signed_url ||
      !signedUpload?.path ||
      !signedUpload?.url
    ) {
      throw new Error(
        getLang() === 'en'
          ? 'The server did not return valid signed-upload information.'
          : 'لم يُرجع الخادم بيانات رفع موقّع صالحة.'
      )
    }

    await uploadFileToSignedUrl(signedUpload.signed_url, file, {
      signal: options.signal,
      timeoutMs: options.timeoutMs,
      cacheControl: options.cacheControl,
      onProgress: options.onProgress,
    })

    return {
      success: true,
      url: signedUpload.url,
      path: signedUpload.path,
      token: signedUpload.token || null,
      original_name: originalName,
      mime_type: mimeType,
      size: file.size,
    }
  },

  deleteUploadedFile(url, options = {}) {
    return request('DELETE', '/upload', { url }, false, options)
  },
}

export default api
