const router = require('express').Router()
const multer = require('multer')
const path = require('path')

const auth = require('../middleware/auth')

const {
  uploadBuffer,
  createSignedUpload,
  deleteFile,
} = require('../lib/storage')

const {
  createImageVariants,
} = require('../lib/image-processing')

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 250 * 1024 * 1024
const MAX_LEGACY_VIDEO_SIZE = 25 * 1024 * 1024

/*
 * الصور تمر عبر ذاكرة Render قبل معالجتها بواسطة Sharp.
 * تقليل العدد إلى 10 يحمي الخادم من استهلاك الذاكرة المرتفع.
 */
const MAX_IMAGES = 10
const MAX_MEDIA_FILES = 10

const VIDEO_MIME_BY_EXTENSION = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.ogv': 'video/ogg',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.mkv': 'video/x-matroska',
}

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-m4v',
  'video/x-matroska',
  'video/mkv',
])

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

    imageTooLarge:
      'حجم الصورة كبير جدًا. الحد الأقصى 10MB لكل صورة',

    videoTooLarge:
      'حجم الفيديو كبير جدًا. الحد الأقصى 250MB لكل فيديو',

    legacyVideoTooLarge:
      'رفع الفيديو عبر الخادم يدعم الملفات حتى 25MB فقط. استخدم الرفع المباشر للفيديوهات الكبيرة.',

    tooManyImages:
      `الحد الأقصى ${MAX_IMAGES} صور في المرة الواحدة`,

    tooManyMedia:
      `الحد الأقصى ${MAX_MEDIA_FILES} ملفات فيديو في المرة الواحدة`,

    uploadError:
      'حدث خطأ أثناء رفع الملفات',

    invalidVideoMetadata:
      'بيانات ملف الفيديو غير صحيحة',

    unsupportedVideo:
      'صيغة ملف الفيديو غير مدعومة',

    signedUploadFailed:
      'تعذر تجهيز رابط رفع الفيديو',

    signedUploadMissing:
      'لم تُرجع خدمة التخزين بيانات رفع موقّع صالحة',

    storageLimit:
      'حجم الملف يتجاوز الحد المسموح به في إعدادات التخزين',

    storagePermission:
      'خدمة التخزين رفضت إنشاء رابط الرفع. تحقق من الصلاحيات.',
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

    imageTooLarge:
      'Image is too large. Maximum size is 10MB per image',

    videoTooLarge:
      'Video is too large. Maximum size is 250MB per video',

    legacyVideoTooLarge:
      'Backend video uploads support files up to 25MB only. Use direct upload for large videos.',

    tooManyImages:
      `Maximum ${MAX_IMAGES} images are allowed at once`,

    tooManyMedia:
      `Maximum ${MAX_MEDIA_FILES} video files are allowed at once`,

    uploadError:
      'An error occurred while uploading files',

    invalidVideoMetadata:
      'Invalid video file information',

    unsupportedVideo:
      'Unsupported video file format',

    signedUploadFailed:
      'Unable to prepare the video upload URL',

    signedUploadMissing:
      'Storage did not return valid signed-upload information',

    storageLimit:
      'The file exceeds the configured storage file-size limit',

    storagePermission:
      'Storage refused to create the upload URL. Check permissions.',
  },
}

function getLang(req) {
  const header = String(
    req.headers['accept-language'] || ''
  ).toLowerCase()

  return header.startsWith('en')
    ? 'en'
    : 'ar'
}

function msg(req, key) {
  const lang = getLang(req)

  return (
    messages[lang][key] ||
    messages.ar[key] ||
    key
  )
}

function cleanText(value) {
  return String(value || '').trim()
}

function cleanFileSize(value) {
  const size = Number(value)

  return Number.isFinite(size)
    ? size
    : 0
}

function sanitizeFolder(folder = 'general') {
  return (
    String(folder || 'general')
      .replace(/\\/g, '/')
      .replace(/[^a-zA-Z0-9/_-]/g, '_')
      .replace(/\/+/g, '/')
      .replace(/^\/+|\/+$/g, '') ||
    'general'
  )
}

function getExtension(fileName) {
  return path
    .extname(String(fileName || ''))
    .toLowerCase()
}

function normalizeVideoMimeType(
  originalName,
  mimeType
) {
  const cleanMime = cleanText(
    mimeType
  ).toLowerCase()

  if (
    ALLOWED_VIDEO_TYPES.has(
      cleanMime
    )
  ) {
    return cleanMime
  }

  return (
    VIDEO_MIME_BY_EXTENSION[
      getExtension(originalName)
    ] || null
  )
}

function isImage(file) {
  return Boolean(
    file?.mimetype?.startsWith(
      'image/'
    )
  )
}

function isVideo(file) {
  const normalizedType =
    normalizeVideoMimeType(
      file?.originalname,
      file?.mimetype
    )

  if (!normalizedType) {
    return false
  }

  file.mimetype = normalizedType

  return true
}

function getSafeErrorMessage(error) {
  return cleanText(
    error?.message
  )
    .replace(/\s+/g, ' ')
    .slice(0, 300)
}

function getStorageErrorStatus(error) {
  const explicitStatus = Number(
    error?.statusCode ||
    error?.status
  )

  if (
    Number.isFinite(
      explicitStatus
    ) &&
    explicitStatus >= 400
  ) {
    return explicitStatus
  }

  const message = String(
    error?.message || ''
  ).toLowerCase()

  if (
    message.includes('too large') ||
    message.includes('file size') ||
    message.includes('payload')
  ) {
    return 413
  }

  if (
    message.includes('unauthorized') ||
    message.includes('permission') ||
    message.includes('policy')
  ) {
    return 403
  }

  return 500
}

const imageUpload = multer({
  storage:
    multer.memoryStorage(),

  limits: {
    fileSize:
      MAX_IMAGE_SIZE,

    files:
      MAX_IMAGES,
  },

  fileFilter(
    req,
    file,
    callback
  ) {
    const accepted =
      isImage(file)

    callback(
      accepted
        ? null
        : new Error(
            'ONLY_IMAGES_ALLOWED'
          ),
      accepted
    )
  },
})

/*
 * هذه المسارات موجودة للتوافق فقط.
 *
 * الفيديوهات الكبيرة يجب أن تستخدم:
 *
 * /media/signed
 *
 * حتى لا تمر عبر ذاكرة Render.
 */
const mediaUpload = multer({
  storage:
    multer.memoryStorage(),

  limits: {
    fileSize:
      MAX_LEGACY_VIDEO_SIZE,

    files:
      MAX_MEDIA_FILES,
  },

  fileFilter(
    req,
    file,
    callback
  ) {
    const accepted =
      isVideo(file)

    callback(
      accepted
        ? null
        : new Error(
            'ONLY_VIDEOS_ALLOWED'
          ),
      accepted
    )
  },
})

async function deleteUploadedUrls(
  urls
) {
  const uniqueUrls = [
    ...new Set(
      urls.filter(Boolean)
    ),
  ]

  if (!uniqueUrls.length) {
    return
  }

  await Promise.allSettled(
    uniqueUrls.map(
      (url) =>
        deleteFile(url)
    )
  )
}

/*
 * أنواع الصور التالية سيتم ضغطها:
 *
 * JPEG
 * PNG
 * WebP
 *
 * ويتم إنشاء:
 *
 * 1. صورة WebP كاملة محسنة.
 * 2. صورة WebP مصغرة.
 *
 * GIF وSVG والفيديوهات يتم رفعها بدون تحويل.
 */
async function uploadProcessedFile({
  file,
  folder,
}) {
  const variants =
    await createImageVariants({
      buffer:
        file.buffer,

      mimeType:
        file.mimetype,

      folder,
    })

  /*
   * إذا لم يُرجع image-processing نسخًا،
   * يتم رفع الملف الأصلي كما هو.
   *
   * يحدث هذا مع GIF وSVG والفيديو.
   */
  if (!variants) {
    const uploaded =
      await uploadBuffer({
        buffer:
          file.buffer,

        mimeType:
          file.mimetype,

        folder,

        originalName:
          file.originalname,
      })

    return {
      url:
        uploaded.url,

      path:
        uploaded.path,

      thumbnail_url:
        null,

      thumbnail_path:
        null,

      original_mime_type:
        file.mimetype,

      mime_type:
        file.mimetype,

      original_size:
        file.size,

      size:
        file.size,

      thumbnail_size:
        0,

      optimized:
        false,
    }
  }

  let optimizedUpload =
    null

  let thumbnailUpload =
    null

  try {
    /*
     * رفع النسخة الكاملة المحسنة.
     */
    optimizedUpload =
      await uploadBuffer({
        buffer:
          variants.optimized.buffer,

        mimeType:
          variants.optimized.mimeType,

        folder:
          `${folder}/originals`,

        originalName:
          variants.optimized.originalName,
      })

    /*
     * رفع النسخة المصغرة.
     */
    thumbnailUpload =
      await uploadBuffer({
        buffer:
          variants.thumbnail.buffer,

        mimeType:
          variants.thumbnail.mimeType,

        folder:
          `${folder}/thumbnails`,

        originalName:
          variants.thumbnail.originalName,
      })

    return {
      url:
        optimizedUpload.url,

      path:
        optimizedUpload.path,

      thumbnail_url:
        thumbnailUpload.url,

      thumbnail_path:
        thumbnailUpload.path,

      original_mime_type:
        file.mimetype,

      mime_type:
        variants.optimized.mimeType,

      original_size:
        file.size,

      size:
        variants.optimized.size,

      thumbnail_size:
        variants.thumbnail.size,

      optimized:
        true,
    }
  } catch (error) {
    /*
     * إذا نجح رفع ملف وفشل الثاني،
     * يتم حذف أي ملفات تم رفعها.
     */
    await deleteUploadedUrls([
      optimizedUpload?.url,
      thumbnailUpload?.url,
    ])

    throw error
  }
}

async function uploadOne(
  req,
  res
) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({
          error:
            msg(
              req,
              'noFile'
            ),
        })
    }

    const folder =
      sanitizeFolder(
        req.body?.folder
      )

    const result =
      await uploadProcessedFile({
        file:
          req.file,

        folder,
      })

    return res.json({
      success:
        true,

      url:
        result.url,

      path:
        result.path,

      thumbnail_url:
        result.thumbnail_url,

      thumbnail_path:
        result.thumbnail_path,

      original_name:
        req.file.originalname,

      original_mime_type:
        result.original_mime_type,

      mime_type:
        result.mime_type,

      original_size:
        result.original_size,

      size:
        result.size,

      thumbnail_size:
        result.thumbnail_size,

      optimized:
        result.optimized,
    })
  } catch (error) {
    console.error(
      'Upload failed:',
      error
    )

    const status =
      getStorageErrorStatus(
        error
      )

    const details =
      getSafeErrorMessage(
        error
      )

    return res
      .status(status)
      .json({
        error:
          status === 413
            ? msg(
                req,
                'storageLimit'
              )
            : `${msg(
                req,
                'uploadFailed'
              )}${
                details
                  ? `: ${details}`
                  : ''
              }`,
      })
  }
}

async function uploadMany(
  req,
  res
) {
  const uploadedFiles =
    []

  try {
    const files =
      req.files || []

    if (!files.length) {
      return res
        .status(400)
        .json({
          error:
            msg(
              req,
              'noFiles'
            ),
        })
    }

    const folder =
      sanitizeFolder(
        req.body?.folder
      )

    /*
     * المعالجة متسلسلة وليست متوازية
     * لتقليل استهلاك الذاكرة والمعالج.
     */
    for (
      const file
      of files
    ) {
      const result =
        await uploadProcessedFile({
          file,
          folder,
        })

      uploadedFiles.push({
        url:
          result.url,

        path:
          result.path,

        thumbnail_url:
          result.thumbnail_url,

        thumbnail_path:
          result.thumbnail_path,

        original_name:
          file.originalname,

        original_mime_type:
          result.original_mime_type,

        mime_type:
          result.mime_type,

        original_size:
          result.original_size,

        size:
          result.size,

        thumbnail_size:
          result.thumbnail_size,

        optimized:
          result.optimized,
      })
    }

    return res.json({
      success:
        true,

      count:
        uploadedFiles.length,

      files:
        uploadedFiles,
    })
  } catch (error) {
    console.error(
      'Multiple upload failed:',
      error
    )

    /*
     * حذف الصور الكاملة والمصغرة
     * التي تم رفعها قبل حدوث الخطأ.
     */
    await deleteUploadedUrls(
      uploadedFiles.flatMap(
        (file) => [
          file.url,
          file.thumbnail_url,
        ]
      )
    )

    const status =
      getStorageErrorStatus(
        error
      )

    const details =
      getSafeErrorMessage(
        error
      )

    return res
      .status(status)
      .json({
        error:
          status === 413
            ? msg(
                req,
                'storageLimit'
              )
            : `${msg(
                req,
                'multipleUploadFailed'
              )}${
                details
                  ? `: ${details}`
                  : ''
              }`,
      })
  }
}

/*
 * POST /api/upload/media/signed
 *
 * تصل إلى Express بيانات الفيديو فقط.
 *
 * المتصفح يرفع ملف الفيديو الحقيقي
 * مباشرة إلى Supabase باستخدام الرابط الموقّع.
 */
router.post(
  '/media/signed',
  auth,
  async (
    req,
    res
  ) => {
    try {
      const originalName =
        cleanText(
          req.body
            ?.original_name
        )

      const suppliedMimeType =
        cleanText(
          req.body
            ?.mime_type
        )

      const size =
        cleanFileSize(
          req.body?.size
        )

      const folder =
        sanitizeFolder(
          req.body?.folder ||
          'gallery/videos'
        )

      if (
        !originalName ||
        size <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              msg(
                req,
                'invalidVideoMetadata'
              ),
          })
      }

      const mimeType =
        normalizeVideoMimeType(
          originalName,
          suppliedMimeType
        )

      if (!mimeType) {
        return res
          .status(400)
          .json({
            error:
              msg(
                req,
                'unsupportedVideo'
              ),

            file:
              originalName,
          })
      }

      if (
        size >
        MAX_VIDEO_SIZE
      ) {
        return res
          .status(413)
          .json({
            error:
              msg(
                req,
                'videoTooLarge'
              ),

            maximum_bytes:
              MAX_VIDEO_SIZE,

            received_bytes:
              size,
          })
      }

      const result =
        await createSignedUpload({
          mimeType,
          folder,
          originalName,
        })

      if (
        !result?.signedUrl ||
        !result?.path ||
        !result?.url
      ) {
        return res
          .status(500)
          .json({
            error:
              msg(
                req,
                'signedUploadMissing'
              ),
          })
      }

      return res.json({
        success:
          true,

        signed_url:
          result.signedUrl,

        token:
          result.token ||
          null,

        path:
          result.path,

        url:
          result.url,

        original_name:
          originalName,

        mime_type:
          mimeType,

        size,
      })
    } catch (error) {
      console.error(
        'Create signed video upload error:',
        error
      )

      const status =
        getStorageErrorStatus(
          error
        )

      const details =
        getSafeErrorMessage(
          error
        )

      let errorMessage =
        msg(
          req,
          'signedUploadFailed'
        )

      if (
        status === 413
      ) {
        errorMessage =
          msg(
            req,
            'storageLimit'
          )
      } else if (
        status === 401 ||
        status === 403
      ) {
        errorMessage =
          msg(
            req,
            'storagePermission'
          )
      } else if (
        details
      ) {
        errorMessage +=
          `: ${details}`
      }

      return res
        .status(status)
        .json({
          error:
            errorMessage,
        })
    }
  }
)

router.post(
  '/',
  auth,
  imageUpload.single(
    'file'
  ),
  uploadOne
)

router.post(
  '/multiple',
  auth,
  imageUpload.array(
    'files',
    MAX_IMAGES
  ),
  uploadMany
)

router.post(
  '/media',
  auth,
  mediaUpload.single(
    'file'
  ),
  uploadOne
)

router.post(
  '/media/multiple',
  auth,
  mediaUpload.array(
    'files',
    MAX_MEDIA_FILES
  ),
  uploadMany
)

router.delete(
  '/',
  auth,
  async (
    req,
    res
  ) => {
    try {
      const url =
        cleanText(
          req.body?.url
        )

      const thumbnailUrl =
        cleanText(
          req.body
            ?.thumbnail_url
        )

      if (
        !url &&
        !thumbnailUrl
      ) {
        return res
          .status(400)
          .json({
            error:
              msg(
                req,
                'urlRequired'
              ),
          })
      }

      /*
       * حذف النسخة الكاملة والمصغرة.
       */
      await deleteUploadedUrls([
        url,
        thumbnailUrl,
      ])

      return res.json({
        success:
          true,
      })
    } catch (error) {
      console.error(
        'Delete failed:',
        error
      )

      const details =
        getSafeErrorMessage(
          error
        )

      return res
        .status(500)
        .json({
          error:
            `${msg(
              req,
              'deleteFailed'
            )}${
              details
                ? `: ${details}`
                : ''
            }`,
        })
    }
  }
)

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (!error) {
      return next()
    }

    console.error(
      'Upload middleware error:',
      error
    )

    const isMediaRoute =
      req.path.includes(
        '/media'
      )

    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        'LIMIT_FILE_SIZE'
      ) {
        return res
          .status(413)
          .json({
            error:
              msg(
                req,
                isMediaRoute
                  ? 'legacyVideoTooLarge'
                  : 'imageTooLarge'
              ),
          })
      }

      if (
        error.code ===
          'LIMIT_FILE_COUNT' ||
        error.code ===
          'LIMIT_UNEXPECTED_FILE'
      ) {
        return res
          .status(400)
          .json({
            error:
              msg(
                req,
                isMediaRoute
                  ? 'tooManyMedia'
                  : 'tooManyImages'
              ),
          })
      }

      return res
        .status(400)
        .json({
          error:
            msg(
              req,
              'uploadError'
            ),
        })
    }

    if (
      error.message ===
      'ONLY_IMAGES_ALLOWED'
    ) {
      return res
        .status(400)
        .json({
          error:
            msg(
              req,
              'onlyImages'
            ),
        })
    }

    if (
      error.message ===
      'ONLY_VIDEOS_ALLOWED'
    ) {
      return res
        .status(400)
        .json({
          error:
            msg(
              req,
              'onlyVideos'
            ),
        })
    }

    const details =
      getSafeErrorMessage(
        error
      )

    return res
      .status(500)
      .json({
        error:
          `${msg(
            req,
            'uploadError'
          )}${
            details
              ? `: ${details}`
              : ''
          }`,
      })
  }
)

module.exports = router