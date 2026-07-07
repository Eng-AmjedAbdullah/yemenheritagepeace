const router = require('express').Router()
const db = require('../lib/db')
const auth = require('../middleware/auth')
const { deleteFile } = require('../lib/storage')

const VALID_TYPES = ['photo', 'video']
const MAX_COLLECTION_IMAGES = 50

const messages = {
  ar: {
    serverError: 'خطأ في الخادم',
    notFound: 'غير موجود',
    titleRequired: 'العنوان مطلوب',
    imageRequired: 'صورة المعرض مطلوبة',
    videoRequired: 'رابط الفيديو مطلوب',
    itemRequired: 'يجب إضافة عنصر واحد على الأقل',
    maxImages: `الحد الأقصى ${MAX_COLLECTION_IMAGES} صورة في المجموعة الواحدة`,
    allImagesRequired: 'كل الصور يجب أن تحتوي على رابط صورة',
    allVideosRequired: 'كل الفيديوهات يجب أن تحتوي على رابط فيديو',
    created: 'تمت الإضافة',
    updated: 'تم التحديث',
    deleted: 'تم الحذف',
    collectionCreated: 'تمت إضافة المجموعة بنجاح',
    collectionUpdated: 'تم تحديث المجموعة بنجاح',
    collectionDeleted: 'تم حذف المجموعة',
  },
  en: {
    serverError: 'Server error',
    notFound: 'Not found',
    titleRequired: 'Title is required',
    imageRequired: 'Gallery image is required',
    videoRequired: 'Video URL is required',
    itemRequired: 'At least one item is required',
    maxImages: `Maximum ${MAX_COLLECTION_IMAGES} images are allowed in one collection`,
    allImagesRequired: 'Every photo item must have an image URL',
    allVideosRequired: 'Every video item must have a video URL',
    created: 'Created successfully',
    updated: 'Updated successfully',
    deleted: 'Deleted successfully',
    collectionCreated: 'Collection created successfully',
    collectionUpdated: 'Collection updated successfully',
    collectionDeleted: 'Collection deleted successfully',
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

function normalizeBoolean(value) {
  return value === true || value === 1 || value === '1'
}

function cleanText(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function normalizeType(value) {
  return VALID_TYPES.includes(value) ? value : 'photo'
}

function validatePayload(body, req) {
  const title = cleanText(body.title)
  const type = normalizeType(body.type)

  if (!title) {
    return { error: msg(req, 'titleRequired') }
  }

  if (type === 'photo' && !cleanText(body.image_url)) {
    return { error: msg(req, 'imageRequired') }
  }

  if (type === 'video' && !cleanText(body.video_url)) {
    return { error: msg(req, 'videoRequired') }
  }

  return null
}

function validateCollectionPayload(collection, items, req) {
  const title = cleanText(collection.title)
  const type = normalizeType(collection.type)

  if (!title) {
    return { error: msg(req, 'titleRequired') }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: msg(req, 'itemRequired') }
  }

  if (type === 'photo' && items.length > MAX_COLLECTION_IMAGES) {
    return { error: msg(req, 'maxImages') }
  }

  if (type === 'photo' && items.some((item) => !cleanText(item.image_url))) {
    return { error: msg(req, 'allImagesRequired') }
  }

  if (type === 'video' && items.some((item) => !cleanText(item.video_url))) {
    return { error: msg(req, 'allVideosRequired') }
  }

  return null
}

async function getCollectionsByType(type, publicOnly = true) {
  const collectionWhere = publicOnly
    ? 'WHERE type = ? AND is_active = 1'
    : 'WHERE type = ?'

  const itemWhere = publicOnly ? 'AND is_active = 1' : ''

  const [collections] = await db.query(
    `
    SELECT *
    FROM gallery_collections
    ${collectionWhere}
    ORDER BY sort_order ASC, created_at DESC
    `,
    [type]
  )

  if (!collections.length) return []

  const ids = collections.map((collection) => collection.id)

  const [items] = await db.query(
    `
    SELECT *
    FROM gallery_items
    WHERE collection_id IN (?)
    ${itemWhere}
    ORDER BY sort_order ASC, created_at ASC
    `,
    [ids]
  )

  const grouped = new Map()

  collections.forEach((collection) => {
    grouped.set(collection.id, {
      ...collection,
      items: [],
    })
  })

  items.forEach((item) => {
    if (grouped.has(item.collection_id)) {
      grouped.get(item.collection_id).items.push(item)
    }
  })

  return Array.from(grouped.values()).filter((collection) => {
    return publicOnly ? collection.items.length > 0 : true
  })
}

// Public photo collections
router.get('/photo-collections', async (req, res) => {
  try {
    const rows = await getCollectionsByType('photo', true)
    res.json(rows)
  } catch (error) {
    console.error('Photo collections error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Public video collections
router.get('/video-collections', async (req, res) => {
  try {
    const rows = await getCollectionsByType('video', true)
    res.json(rows)
  } catch (error) {
    console.error('Video collections error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Public photos - old flat endpoint kept for compatibility
router.get('/photos', async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT *
      FROM gallery_items
      WHERE type = 'photo' AND is_active = 1
      ORDER BY sort_order ASC, created_at DESC
      `
    )

    res.json(rows)
  } catch (error) {
    console.error('Gallery photos error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Public videos - old flat endpoint kept for compatibility
router.get('/videos', async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT *
      FROM gallery_items
      WHERE type = 'video' AND is_active = 1
      ORDER BY sort_order ASC, created_at DESC
      `
    )

    res.json(rows)
  } catch (error) {
    console.error('Gallery videos error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Admin all collections
router.get('/collections/all', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        c.*,
        COALESCE(counter.items_count, 0) AS items_count
      FROM gallery_collections c
      LEFT JOIN (
        SELECT collection_id, COUNT(*) AS items_count
        FROM gallery_items
        WHERE collection_id IS NOT NULL
        GROUP BY collection_id
      ) counter ON counter.collection_id = c.id
      ORDER BY c.sort_order ASC, c.created_at DESC
      `
    )

    res.json(rows)
  } catch (error) {
    console.error('Gallery collections all error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Admin single collection with items
router.get('/collections/:id', auth, async (req, res) => {
  try {
    const [collections] = await db.query(
      'SELECT * FROM gallery_collections WHERE id = ?',
      [req.params.id]
    )

    if (!collections.length) {
      return res.status(404).json({ error: msg(req, 'notFound') })
    }

    const [items] = await db.query(
      `
      SELECT *
      FROM gallery_items
      WHERE collection_id = ?
      ORDER BY sort_order ASC, created_at ASC
      `,
      [req.params.id]
    )

    res.json({
      ...collections[0],
      items,
    })
  } catch (error) {
    console.error('Gallery collection single error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Admin create collection with many images/videos
router.post('/collections', auth, async (req, res) => {
  const connection = await db.getConnection()

  try {
    const collection = req.body.collection || {}
    const items = Array.isArray(req.body.items) ? req.body.items : []
    const type = normalizeType(collection.type)

    const validation = validateCollectionPayload(
      { ...collection, type },
      items,
      req
    )

    if (validation) {
      return res.status(400).json({ error: validation.error })
    }

    await connection.beginTransaction()

    const title = cleanText(collection.title)
    const titleEn = cleanText(collection.title_en)
    const description = cleanText(collection.description)
    const descriptionEn = cleanText(collection.description_en)

    const coverUrl =
      cleanText(collection.cover_url) ||
      cleanText(items[0]?.thumbnail_url) ||
      cleanText(items[0]?.image_url) ||
      null

    const [collectionResult] = await connection.query(
      `
      INSERT INTO gallery_collections
      (
        title,
        title_en,
        description,
        description_en,
        type,
        cover_url,
        sort_order,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        titleEn,
        description,
        descriptionEn,
        type,
        coverUrl,
        Number(collection.sort_order) || 0,
        normalizeBoolean(collection.is_active) ? 1 : 0,
      ]
    )

    const collectionId = collectionResult.insertId

    const values = items.map((item, index) => [
      collectionId,
      cleanText(item.title) || title,
      cleanText(item.title_en) || titleEn,
      cleanText(item.description) || description,
      cleanText(item.description_en) || descriptionEn,
      type,
      cleanText(item.image_url),
      cleanText(item.thumbnail_url),
      cleanText(item.video_url),
      Number(item.sort_order) || index + 1,
      normalizeBoolean(item.is_active) ? 1 : 0,
    ])

    await connection.query(
      `
      INSERT INTO gallery_items
      (
        collection_id,
        title,
        title_en,
        description,
        description_en,
        type,
        image_url,
        thumbnail_url,
        video_url,
        sort_order,
        is_active
      )
      VALUES ?
      `,
      [values]
    )

    await connection.commit()

    res.status(201).json({
      id: collectionId,
      message: msg(req, 'collectionCreated'),
    })
  } catch (error) {
    await connection.rollback()
    console.error('Create gallery collection error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  } finally {
    connection.release()
  }
})

// Admin update collection metadata only
router.put('/collections/:id', auth, async (req, res) => {
  try {
    const title = cleanText(req.body.title)

    if (!title) {
      return res.status(400).json({ error: msg(req, 'titleRequired') })
    }

    const type = normalizeType(req.body.type)

    await db.query(
      `
      UPDATE gallery_collections
      SET
        title = ?,
        title_en = ?,
        description = ?,
        description_en = ?,
        type = ?,
        cover_url = ?,
        sort_order = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        title,
        cleanText(req.body.title_en),
        cleanText(req.body.description),
        cleanText(req.body.description_en),
        type,
        cleanText(req.body.cover_url),
        Number(req.body.sort_order) || 0,
        normalizeBoolean(req.body.is_active) ? 1 : 0,
        req.params.id,
      ]
    )

    res.json({ message: msg(req, 'collectionUpdated') })
  } catch (error) {
    console.error('Update gallery collection error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Admin delete collection with all items
router.delete('/collections/:id', auth, async (req, res) => {
  try {
    const [collections] = await db.query(
      'SELECT cover_url FROM gallery_collections WHERE id = ?',
      [req.params.id]
    )

    if (!collections.length) {
      return res.status(404).json({ error: msg(req, 'notFound') })
    }

    const [items] = await db.query(
      `
      SELECT image_url, thumbnail_url
      FROM gallery_items
      WHERE collection_id = ?
      `,
      [req.params.id]
    )

    const urls = [
      collections[0].cover_url,
      ...items.map((item) => item.image_url),
      ...items.map((item) => item.thumbnail_url),
    ].filter(Boolean)

    await db.query('DELETE FROM gallery_collections WHERE id = ?', [req.params.id])

    await Promise.all(
      [...new Set(urls)].map((url) => deleteFile(url).catch(() => {}))
    )

    res.json({ message: msg(req, 'collectionDeleted') })
  } catch (error) {
    console.error('Delete gallery collection error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Admin all flat items - old endpoint kept for compatibility
router.get('/all', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT *
      FROM gallery_items
      ORDER BY sort_order ASC, created_at DESC
      `
    )

    res.json(rows)
  } catch (error) {
    console.error('Gallery all error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Admin single flat item - old endpoint kept for compatibility
router.get('/admin/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM gallery_items WHERE id = ?',
      [req.params.id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: msg(req, 'notFound') })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('Gallery single error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Admin create flat item - old endpoint kept for compatibility
router.post('/', auth, async (req, res) => {
  try {
    const validation = validatePayload(req.body, req)

    if (validation) {
      return res.status(400).json({ error: validation.error })
    }

    const type = normalizeType(req.body.type)

    const [result] = await db.query(
      `
      INSERT INTO gallery_items
      (
        collection_id,
        title,
        title_en,
        description,
        description_en,
        type,
        image_url,
        thumbnail_url,
        video_url,
        sort_order,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.body.collection_id ? Number(req.body.collection_id) : null,
        cleanText(req.body.title),
        cleanText(req.body.title_en),
        cleanText(req.body.description),
        cleanText(req.body.description_en),
        type,
        cleanText(req.body.image_url),
        cleanText(req.body.thumbnail_url),
        cleanText(req.body.video_url),
        Number(req.body.sort_order) || 0,
        normalizeBoolean(req.body.is_active) ? 1 : 0,
      ]
    )

    res.status(201).json({
      id: result.insertId,
      message: msg(req, 'created'),
    })
  } catch (error) {
    console.error('Gallery create error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Admin update flat item - old endpoint kept for compatibility
router.put('/:id', auth, async (req, res) => {
  try {
    const validation = validatePayload(req.body, req)

    if (validation) {
      return res.status(400).json({ error: validation.error })
    }

    const type = normalizeType(req.body.type)

    await db.query(
      `
      UPDATE gallery_items
      SET
        collection_id = ?,
        title = ?,
        title_en = ?,
        description = ?,
        description_en = ?,
        type = ?,
        image_url = ?,
        thumbnail_url = ?,
        video_url = ?,
        sort_order = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        req.body.collection_id ? Number(req.body.collection_id) : null,
        cleanText(req.body.title),
        cleanText(req.body.title_en),
        cleanText(req.body.description),
        cleanText(req.body.description_en),
        type,
        cleanText(req.body.image_url),
        cleanText(req.body.thumbnail_url),
        cleanText(req.body.video_url),
        Number(req.body.sort_order) || 0,
        normalizeBoolean(req.body.is_active) ? 1 : 0,
        req.params.id,
      ]
    )

    res.json({ message: msg(req, 'updated') })
  } catch (error) {
    console.error('Gallery update error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Admin delete flat item - old endpoint kept for compatibility
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT image_url, thumbnail_url FROM gallery_items WHERE id = ?',
      [req.params.id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: msg(req, 'notFound') })
    }

    const item = rows[0]

    if (item.image_url) {
      await deleteFile(item.image_url).catch(() => {})
    }

    if (item.thumbnail_url && item.thumbnail_url !== item.image_url) {
      await deleteFile(item.thumbnail_url).catch(() => {})
    }

    await db.query('DELETE FROM gallery_items WHERE id = ?', [req.params.id])

    res.json({ message: msg(req, 'deleted') })
  } catch (error) {
    console.error('Gallery delete error:', error)
    res.status(500).json({ error: msg(req, 'serverError') })
  }
})

module.exports = router
