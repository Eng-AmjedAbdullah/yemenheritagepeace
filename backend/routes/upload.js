const router = require('express').Router()
const multer = require('multer')

const auth = require('../middleware/auth')
const { uploadBuffer, deleteFile } = require('../lib/storage')

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 250 * 1024 * 1024
const MAX_IMAGES = 50
const MAX_MEDIA_FILES = 10

const messages = {
  ar: {
    noFile: 'لم يتم رفع أي ملف',
    noFiles: 'لم يتم رفع أي ملفات',
    urlRequired: 'رابط الملف مطلوب',
    uploadFailed: 'فشل رفع الملف',
    multipleUploadFailed: 'فشل رفع الملفات',
    deleteFailed: 'فشل حذف الملف',
    onlyImages: 'يسمح برفع الصور فقط',
    onlyVideos: 'يسمح برفع ملفات الفيديو فقط',
    imageTooLarge: 'حجم الصورة كبير جدًا. الحد الأقصى 10MB لكل صورة',
    videoTooLarge: 'حجم الفيديو كبير جدًا. الحد الأقصى 250MB لكل فيديو',
    tooManyImages: `الحد الأقصى ${MAX_IMAGES} صورة في المرة الواحدة`,
    tooManyMedia: `الحد الأقصى ${MAX_MEDIA_FILES} ملفات وسائط في المرة الواحدة`,
    uploadError: 'حدث خطأ أثناء رفع الملفات',
  },
  en: {
    noFile: 'No file was uploaded',
    noFiles: 'No files were uploaded',
    urlRequired: 'File URL is required',
    uploadFailed: 'Failed to upload file',
    multipleUploadFailed: 'Failed to upload files',
    deleteFailed: 'Failed to delete file',
    onlyImages: 'Only image files are allowed',
    onlyVideos: 'Only video files are allowed',
    imageTooLarge: 'Image is too large. Maximum size is 10MB per image',
    videoTooLarge: 'Video is too large. Maximum size is 250MB per video',
    tooManyImages: `Maximum ${MAX_IMAGES} images are allowed at once`,
    tooManyMedia: `Maximum ${MAX_MEDIA_FILES} media files are allowed at once`,
    uploadError: 'An error occurred while uploading files',
  },
}

function getLang(req) {
  const header = String(req.headers['accept-language'] || '').toLowerCase()
  return header.startsWith('en') ? 'en' : 'ar'
}

function msg(req, key) {
  const lang = getLang(req)
  return messages[lang][key] || messages.ar[key] || key
}

function sanitizeFolder(folder = 'general') {
  return String(folder || 'general').replace(/[^a-zA-Z0-9/_-]/g, '_')
}

function isImage(file) {
  return Boolean(file?.mimetype?.startsWith('image/'))
}

function isVideo(file) {
  return Boolean(file?.mimetype?.startsWith('video/'))
}

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: MAX_IMAGES,
  },
  fileFilter(req, file, callback) {
    callback(isImage(file) ? null : new Error('ONLY_IMAGES_ALLOWED'), isImage(file))
  },
})

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE,
    files: MAX_MEDIA_FILES,
  },
  fileFilter(req, file, callback) {
    const accepted = isVideo(file)
    callback(accepted ? null : new Error('ONLY_VIDEOS_ALLOWED'), accepted)
  },
})

async function uploadOne(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: msg(req, 'noFile') })
    }

    if (isImage(req.file) && req.file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: msg(req, 'imageTooLarge') })
    }

    const folder = sanitizeFolder(req.body.folder)
    const result = await uploadBuffer({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder,
      originalName: req.file.originalname,
    })

    return res.json({
      url: result.url,
      path: result.path,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
    })
  } catch (error) {
    console.error('Upload failed:', error)
    return res.status(500).json({
      error: `${msg(req, 'uploadFailed')}: ${error.message}`,
    })
  }
}

async function uploadMany(req, res) {
  try {
    const files = req.files || []

    if (!files.length) {
      return res.status(400).json({ error: msg(req, 'noFiles') })
    }

    const oversizedImage = files.some(
      (file) => isImage(file) && file.size > MAX_IMAGE_SIZE
    )

    if (oversizedImage) {
      return res.status(400).json({ error: msg(req, 'imageTooLarge') })
    }

    const folder = sanitizeFolder(req.body.folder)
    const uploadedFiles = []

    try {
      for (const file of files) {
        const result = await uploadBuffer({
          buffer: file.buffer,
          mimeType: file.mimetype,
          folder,
          originalName: file.originalname,
        })

        uploadedFiles.push({
          url: result.url,
          path: result.path,
          original_name: file.originalname,
          mime_type: file.mimetype,
          size: file.size,
        })
      }
    } catch (uploadError) {
      await Promise.all(
        uploadedFiles.map((file) => deleteFile(file.url).catch(() => {}))
      )
      throw uploadError
    }

    return res.json({
      success: true,
      count: uploadedFiles.length,
      files: uploadedFiles,
    })
  } catch (error) {
    console.error('Multiple upload failed:', error)
    return res.status(500).json({
      error: `${msg(req, 'multipleUploadFailed')}: ${error.message}`,
    })
  }
}

// Existing image-only endpoints remain compatible with ImageUpload.jsx.
router.post('/', auth, imageUpload.single('file'), uploadOne)
router.post('/multiple', auth, imageUpload.array('files', MAX_IMAGES), uploadMany)

// New endpoints accept video files and upload them to the same Supabase bucket.
// Images continue to use the existing image-only endpoints above.
router.post('/media', auth, mediaUpload.single('file'), uploadOne)
router.post(
  '/media/multiple',
  auth,
  mediaUpload.array('files', MAX_MEDIA_FILES),
  uploadMany
)

router.delete('/', auth, async (req, res) => {
  try {
    const { url } = req.body || {}

    if (!url) {
      return res.status(400).json({ error: msg(req, 'urlRequired') })
    }

    await deleteFile(url)
    return res.json({ success: true })
  } catch (error) {
    console.error('Delete failed:', error)
    return res.status(500).json({ error: msg(req, 'deleteFailed') })
  }
})

router.use((error, req, res, next) => {
  if (!error) return next()

  console.error('Upload middleware error:', error)

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      const isMediaRoute = req.path.includes('/media')
      return res.status(400).json({
        error: msg(req, isMediaRoute ? 'videoTooLarge' : 'imageTooLarge'),
      })
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      const isMediaRoute = req.path.includes('/media')
      return res.status(400).json({
        error: msg(req, isMediaRoute ? 'tooManyMedia' : 'tooManyImages'),
      })
    }

    return res.status(400).json({ error: msg(req, 'uploadError') })
  }

  if (error.message === 'ONLY_IMAGES_ALLOWED') {
    return res.status(400).json({ error: msg(req, 'onlyImages') })
  }

  if (error.message === 'ONLY_VIDEOS_ALLOWED') {
    return res.status(400).json({ error: msg(req, 'onlyVideos') })
  }

  return res.status(500).json({ error: msg(req, 'uploadError') })
})

module.exports = router
