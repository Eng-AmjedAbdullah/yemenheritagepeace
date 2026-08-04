const sharp = require('sharp')

const OPTIMIZABLE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

function getThumbnailResize(folder = '') {
  const normalizedFolder = String(folder).toLowerCase()

  // صور الأخبار والفعاليات تظهر غالبًا كبطاقات أفقية.
  if (
    normalizedFolder.includes('news') ||
    normalizedFolder.includes('events') ||
    normalizedFolder.includes('hero')
  ) {
    return {
      width: 640,
      height: 360,
      fit: 'cover',
      position: 'attention',
      withoutEnlargement: true,
    }
  }

  // لا نقص الشعارات والصور العامة إجباريًا.
  return {
    width: 640,
    height: 640,
    fit: 'inside',
    withoutEnlargement: true,
  }
}

async function createImageVariants({
  buffer,
  mimeType,
  folder,
}) {
  if (!buffer) {
    throw new Error('Image buffer is required')
  }

  if (!OPTIMIZABLE_IMAGE_TYPES.has(mimeType)) {
    return null
  }

  const baseImage = sharp(buffer).rotate()

  const [optimizedBuffer, thumbnailBuffer] =
    await Promise.all([
      baseImage
        .clone()
        .resize({
          width: 1600,
          height: 1600,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: 78,
          effort: 4,
        })
        .toBuffer(),

      baseImage
        .clone()
        .resize(getThumbnailResize(folder))
        .webp({
          quality: 74,
          effort: 4,
        })
        .toBuffer(),
    ])

  return {
    optimized: {
      buffer: optimizedBuffer,
      mimeType: 'image/webp',
      originalName: 'optimized.webp',
      size: optimizedBuffer.length,
    },

    thumbnail: {
      buffer: thumbnailBuffer,
      mimeType: 'image/webp',
      originalName: 'thumbnail.webp',
      size: thumbnailBuffer.length,
    },
  }
}

module.exports = {
  createImageVariants,
}