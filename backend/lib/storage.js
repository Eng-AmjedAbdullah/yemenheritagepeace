const crypto =
  require('crypto')

const path =
  require('path')

const fs =
  require('fs')

const supabase =
  require('./supabase')

const BUCKET =
  process.env.SUPABASE_BUCKET

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  ''
).replace(/\/$/, '')

const SUPABASE_PUBLIC_BASE_URL = (
  process.env
    .SUPABASE_PUBLIC_BASE_URL ||
  `${SUPABASE_URL}/storage/v1/object/public`
).replace(/\/$/, '')

const LEGACY_UPLOADS_DIR =
  path.resolve(
    __dirname,
    '..',
    'uploads'
  )

const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',

  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogv',
  'video/quicktime': '.mov',
  'video/x-m4v': '.m4v',
  'video/x-matroska': '.mkv',
  'video/mkv': '.mkv',
}

function ensureStorageConfiguration() {
  if (!BUCKET) {
    throw new Error(
      'Missing SUPABASE_BUCKET'
    )
  }

  if (!SUPABASE_URL) {
    throw new Error(
      'Missing SUPABASE_URL'
    )
  }
}

function sanitizeFolder(
  folder = 'general'
) {
  const value =
    String(
      folder || 'general'
    )
      .replace(
        /\\/g,
        '/'
      )
      .replace(
        /[^a-zA-Z0-9/_-]/g,
        '_'
      )
      .replace(
        /\/+/g,
        '/'
      )
      .replace(
        /^\/+|\/+$/g,
        ''
      )

  return value || 'general'
}

function sanitizeExtension(
  extension
) {
  const value =
    String(
      extension || ''
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9.]/g,
        ''
      )

  if (
    !value ||
    value === '.'
  ) {
    return ''
  }

  return value.startsWith('.')
    ? value
    : `.${value}`
}

function buildObjectPath(
  folder,
  originalName = 'file',
  mimeType = ''
) {
  const safeFolder =
    sanitizeFolder(folder)

  const originalExtension =
    sanitizeExtension(
      path.extname(
        originalName || ''
      )
    )

  const mimeExtension =
    sanitizeExtension(
      MIME_EXTENSIONS[
        mimeType
      ]
    )

  const extension =
    originalExtension ||
    mimeExtension ||
    '.bin'

  const timestamp =
    Date.now()

  const uniqueId =
    crypto.randomUUID()

  return (
    `${safeFolder}/` +
    `${timestamp}_${uniqueId}` +
    `${extension}`
  )
}

function getPublicUrl(
  objectPath
) {
  const {
    data,
  } =
    supabase.storage
      .from(BUCKET)
      .getPublicUrl(
        objectPath
      )

  if (!data?.publicUrl) {
    throw new Error(
      'Storage did not return a public URL'
    )
  }

  return data.publicUrl
}

async function uploadBuffer({
  buffer,
  mimeType,
  folder,
  originalName,
}) {
  ensureStorageConfiguration()

  if (!buffer) {
    throw new Error(
      'No file buffer provided'
    )
  }

  const objectPath =
    buildObjectPath(
      folder,
      originalName,
      mimeType
    )

  const {
    error,
  } =
    await supabase.storage
      .from(BUCKET)
      .upload(
        objectPath,
        buffer,
        {
          contentType:
            mimeType ||
            'application/octet-stream',

          upsert: false,

          cacheControl:
            mimeType?.startsWith(
              'video/'
            )
              ? '86400'
              : '3600',
        }
      )

  if (error) {
    throw error
  }

  return {
    path:
      objectPath,

    url:
      getPublicUrl(
        objectPath
      ),
  }
}

/*
 * Creates a temporary signed upload URL.
 *
 * Only the generated object path and metadata
 * are handled by this backend process.
 *
 * The browser uploads the actual video directly
 * to Storage.
 */
async function createSignedUpload({
  mimeType,
  folder,
  originalName,
}) {
  ensureStorageConfiguration()

  if (!originalName) {
    throw new Error(
      'Original file name is required'
    )
  }

  const objectPath =
    buildObjectPath(
      folder,
      originalName,
      mimeType
    )

  const {
    data,
    error,
  } =
    await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(
        objectPath,
        {
          upsert: false,
        }
      )

  if (error) {
    throw error
  }

  /*
   * signedUrl is the current property name.
   * signedURL is kept as a compatibility fallback.
   */
  const signedUrl =
    data?.signedUrl ||
    data?.signedURL

  const token =
    data?.token ||
    null

  if (!signedUrl) {
    throw new Error(
      'Storage did not return a signed upload URL'
    )
  }

  return {
    path:
      data?.path ||
      objectPath,

    signedUrl,

    token,

    url:
      getPublicUrl(
        objectPath
      ),
  }
}

function stripQueryAndHash(
  value
) {
  return String(
    value || ''
  )
    .split('#')[0]
    .split('?')[0]
}

function extractSupabasePathFromUrl(
  fileUrl
) {
  if (!fileUrl || !BUCKET) {
    return null
  }

  const value =
    stripQueryAndHash(
      String(
        fileUrl
      ).trim()
    )

  const publicPrefix =
    `${SUPABASE_PUBLIC_BASE_URL}/${BUCKET}/`

  if (
    value.startsWith(
      publicPrefix
    )
  ) {
    return decodeURIComponent(
      value.slice(
        publicPrefix.length
      )
    )
  }

  const fallbackPrefix =
    `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

  if (
    value.startsWith(
      fallbackPrefix
    )
  ) {
    return decodeURIComponent(
      value.slice(
        fallbackPrefix.length
      )
    )
  }

  return null
}

async function deleteLegacyLocalFile(
  publicUrl
) {
  try {
    if (!publicUrl) {
      return false
    }

    const cleanUrl =
      stripQueryAndHash(
        publicUrl
      )

    let relativePath =
      cleanUrl

    try {
      const parsed =
        new URL(cleanUrl)

      relativePath =
        parsed.pathname
    } catch {
      relativePath =
        cleanUrl.replace(
          /^https?:\/\/[^/]+/,
          ''
        )
    }

    if (
      !relativePath.startsWith(
        '/uploads/'
      )
    ) {
      return false
    }

    const localRelativePath =
      relativePath.replace(
        /^\/uploads\//,
        ''
      )

    const absolutePath =
      path.resolve(
        LEGACY_UPLOADS_DIR,
        localRelativePath
      )

    /*
     * Prevent deletion outside the uploads folder.
     */
    if (
      absolutePath !==
        LEGACY_UPLOADS_DIR &&
      !absolutePath.startsWith(
        `${LEGACY_UPLOADS_DIR}${path.sep}`
      )
    ) {
      throw new Error(
        'Invalid legacy upload path'
      )
    }

    if (
      !fs.existsSync(
        absolutePath
      )
    ) {
      return false
    }

    await fs.promises.unlink(
      absolutePath
    )

    return true
  } catch (error) {
    console.error(
      'Legacy local delete error:',
      error.message
    )

    throw error
  }
}

async function deleteFile(
  fileUrl
) {
  if (!fileUrl) {
    return {
      deleted: false,
    }
  }

  ensureStorageConfiguration()

  const supabasePath =
    extractSupabasePathFromUrl(
      fileUrl
    )

  if (supabasePath) {
    const {
      error,
    } =
      await supabase.storage
        .from(BUCKET)
        .remove([
          supabasePath,
        ])

    if (error) {
      throw error
    }

    return {
      deleted: true,
      type: 'storage',
      path:
        supabasePath,
    }
  }

  const deletedLegacy =
    await deleteLegacyLocalFile(
      fileUrl
    )

  return {
    deleted:
      deletedLegacy,

    type:
      deletedLegacy
        ? 'legacy'
        : 'unknown',
  }
}

module.exports = {
  uploadBuffer,
  createSignedUpload,
  deleteFile,
  extractSupabasePathFromUrl,
  buildObjectPath,
}
