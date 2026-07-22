const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

const supabase = require('./supabase')

const BUCKET = process.env.SUPABASE_BUCKET
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_PUBLIC_BASE_URL = (
  process.env.SUPABASE_PUBLIC_BASE_URL ||
  `${SUPABASE_URL}/storage/v1/object/public`
).replace(/\/$/, '')

const LEGACY_UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogv',
  'video/quicktime': '.mov',
  'video/x-matroska': '.mkv',
}

function sanitizeFolder(folder = 'general') {
  return String(folder || 'general').replace(/[^a-zA-Z0-9/_-]/g, '_')
}

function buildObjectPath(folder, originalName = 'file', mimeType = '') {
  const safeFolder = sanitizeFolder(folder)
  const originalExtension = path.extname(originalName || '').toLowerCase()
  const extension = originalExtension || MIME_EXTENSIONS[mimeType] || '.bin'

  return `${safeFolder}/${Date.now()}_${crypto.randomUUID()}${extension}`
}

async function uploadBuffer({ buffer, mimeType, folder, originalName }) {
  if (!buffer) throw new Error('No file buffer provided')
  if (!BUCKET) throw new Error('Missing SUPABASE_BUCKET')

  const objectPath = buildObjectPath(folder, originalName, mimeType)
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: mimeType || 'application/octet-stream',
    upsert: false,
    cacheControl: mimeType?.startsWith('video/') ? '86400' : '3600',
  })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)

  return {
    path: objectPath,
    url: data.publicUrl,
  }
}

function extractSupabasePathFromUrl(fileUrl) {
  if (!fileUrl) return null

  const value = String(fileUrl).trim()
  const publicPrefix = `${SUPABASE_PUBLIC_BASE_URL}/${BUCKET}/`

  if (value.startsWith(publicPrefix)) {
    return decodeURIComponent(value.slice(publicPrefix.length))
  }

  const fallbackPrefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

  if (value.startsWith(fallbackPrefix)) {
    return decodeURIComponent(value.slice(fallbackPrefix.length))
  }

  return null
}

async function deleteLegacyLocalFile(publicUrl) {
  try {
    if (!publicUrl) return

    const relativePath = String(publicUrl).replace(/^https?:\/\/[^/]+/, '')
    if (!relativePath.startsWith('/uploads/')) return

    const absolutePath = path.join(LEGACY_UPLOADS_DIR, '..', relativePath)
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath)
  } catch (error) {
    console.error('Legacy local delete error:', error.message)
  }
}

async function deleteFile(fileUrl) {
  if (!fileUrl) return

  const supabasePath = extractSupabasePathFromUrl(fileUrl)

  if (supabasePath) {
    const { error } = await supabase.storage.from(BUCKET).remove([supabasePath])

    if (error) {
      console.error('Supabase delete error:', error.message)
    }

    return
  }

  await deleteLegacyLocalFile(fileUrl)
}

module.exports = {
  uploadBuffer,
  deleteFile,
  extractSupabasePathFromUrl,
}
