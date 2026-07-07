const router = require('express').Router()
const multer = require('multer')
const auth = require('../middleware/auth')
const { uploadBuffer, deleteFile } = require('../lib/storage')

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 50

const messages = {
  ar: {
    noFile: 'لم يتم رفع أي ملف',
    noFiles: 'لم يتم رفع أي ملفات',
    urlRequired: 'رابط الملف مطلوب',
    singleUploadFailed: 'فشل رفع الملف',
    multipleUploadFailed: 'فشل رفع الملفات',
    deleteFailed: 'فشل حذف الملف',
    onlyImages: 'يسمح برفع الصور فقط',
    fileTooLarge: 'حجم الصورة كبير جدًا. الحد الأقصى 10MB لكل صورة',
    tooManyFiles: `الحد الأقصى ${MAX_FILES} صورة في المرة الواحدة`,
    uploadError: 'حدث خطأ أثناء رفع الملفات',
  },
  en: {
    noFile: 'No file was uploaded',
    noFiles: 'No files were uploaded',
    urlRequired: 'File URL is required',
    singleUploadFailed: 'Failed to upload file',
    multipleUploadFailed: 'Failed to upload files',
    deleteFailed: 'Failed to delete file',
    onlyImages: 'Only image files are allowed',
    fileTooLarge: 'Image is too large. Maximum size is 10MB per image',
    tooManyFiles: `Maximum ${MAX_FILES} images are allowed at once`,
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter(req, file, cb) {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('ONLY_IMAGES_ALLOWED'))
    }
  },
})

// POST /api/upload
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: msg(req, 'noFile') })
    }

    const folder = sanitizeFolder(req.body.folder)

    const result = await uploadBuffer({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder,
      originalName: req.file.originalname,
    })

    res.json({
      url: result.url,
      path: result.path,
      original_name: req.file.originalname,
    })
  } catch (e) {
    console.error('Upload failed:', e)
    res.status(500).json({
      error: `${msg(req, 'singleUploadFailed')}: ${e.message}`,
    })
  }
})

// POST /api/upload/multiple
router.post('/multiple', auth, upload.array('files', MAX_FILES), async (req, res) => {
  try {
    const files = req.files || []

    if (!files.length) {
      return res.status(400).json({ error: msg(req, 'noFiles') })
    }

    if (files.length > MAX_FILES) {
      return res.status(400).json({ error: msg(req, 'tooManyFiles') })
    }

    const folder = sanitizeFolder(req.body.folder)

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const result = await uploadBuffer({
          buffer: file.buffer,
          mimeType: file.mimetype,
          folder,
          originalName: file.originalname,
        })

        return {
          url: result.url,
          path: result.path,
          original_name: file.originalname,
        }
      })
    )

    res.json({
      success: true,
      count: uploadedFiles.length,
      files: uploadedFiles,
    })
  } catch (e) {
    console.error('Multiple upload failed:', e)
    res.status(500).json({
      error: `${msg(req, 'multipleUploadFailed')}: ${e.message}`,
    })
  }
})

// DELETE /api/upload
router.delete('/', auth, async (req, res) => {
  try {
    const { url } = req.body || {}

    if (!url) {
      return res.status(400).json({ error: msg(req, 'urlRequired') })
    }

    await deleteFile(url)
    res.json({ success: true })
  } catch (e) {
    console.error('Delete failed:', e)
    res.status(500).json({ error: msg(req, 'deleteFailed') })
  }
})

router.use((err, req, res, next) => {
  if (!err) return next()

  console.error('Upload middleware error:', err)

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: msg(req, 'fileTooLarge') })
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: msg(req, 'tooManyFiles') })
    }

    return res.status(400).json({ error: msg(req, 'uploadError') })
  }

  if (err.message === 'ONLY_IMAGES_ALLOWED') {
    return res.status(400).json({ error: msg(req, 'onlyImages') })
  }

  return res.status(500).json({ error: msg(req, 'uploadError') })
})

module.exports = router
