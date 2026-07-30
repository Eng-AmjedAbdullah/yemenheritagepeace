const router = require('express').Router()

const db = require('../lib/db')
const auth = require('../middleware/auth')
const { deleteFile } = require('../lib/storage')

const VALID_TYPES = ['photo', 'video']
const MAX_COLLECTION_IMAGES = 50
const MAX_COLLECTION_VIDEOS = 20

const messages = {
  ar: {
    serverError: 'خطأ في الخادم',
    notFound: 'غير موجود',
    titleRequired: 'العنوان مطلوب',
    imageRequired: 'صورة المعرض مطلوبة',
    videoRequired: 'رابط الفيديو مطلوب',
    itemRequired: 'يجب إضافة عنصر واحد على الأقل',
    maxImages: `الحد الأقصى ${MAX_COLLECTION_IMAGES} صورة في المجموعة الواحدة`,
    maxVideos: `الحد الأقصى ${MAX_COLLECTION_VIDEOS} فيديو في المجموعة الواحدة`,
    allImagesRequired: 'كل الصور يجب أن تحتوي على رابط صورة',
    allVideosRequired: 'كل الفيديوهات يجب أن تحتوي على رابط فيديو',
    invalidMediaUrl: 'رابط الوسائط غير صحيح',
    created: 'تمت الإضافة',
    updated: 'تم التحديث',
    deleted: 'تم الحذف',
    collectionCreated: 'تمت إضافة المجموعة بنجاح',
    collectionUpdated: 'تم تحديث المجموعة بنجاح',
    collectionDeleted: 'تم حذف المجموعة',
    itemsAdded: 'تمت إضافة العناصر بنجاح',
    itemDeleted: 'تم حذف العنصر',
  },
  en: {
    serverError: 'Server error',
    notFound: 'Not found',
    titleRequired: 'Title is required',
    imageRequired: 'Gallery image is required',
    videoRequired: 'Video URL is required',
    itemRequired: 'At least one item is required',
    maxImages: `Maximum ${MAX_COLLECTION_IMAGES} images are allowed in one collection`,
    maxVideos: `Maximum ${MAX_COLLECTION_VIDEOS} videos are allowed in one collection`,
    allImagesRequired: 'Every photo item must have an image URL',
    allVideosRequired: 'Every video item must have a video URL',
    invalidMediaUrl: 'Media URL is invalid',
    created: 'Created successfully',
    updated: 'Updated successfully',
    deleted: 'Deleted successfully',
    collectionCreated: 'Collection created successfully',
    collectionUpdated: 'Collection updated successfully',
    collectionDeleted: 'Collection deleted successfully',
    itemsAdded: 'Items added successfully',
    itemDeleted: 'Item deleted successfully',
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

function isValidHttpUrl(value) {
  const cleaned = cleanText(value)
  if (!cleaned) return false

  try {
    const parsed = new URL(cleaned)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeType(value) {
  return VALID_TYPES.includes(value) ? value : 'photo'
}

function normalizeCollectionId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function cleanCollectionPayload(body = {}) {
  return {
    title: cleanText(body.title),
    title_en: cleanText(body.title_en),
    type: normalizeType(body.type),
    cover_url: cleanText(body.cover_url),
    sort_order: Number(body.sort_order) || 0,
    is_active: normalizeBoolean(body.is_active) ? 1 : 0,
  }
}

function cleanItemPayload(item = {}, fallback = {}) {
  return {
    title: cleanText(item.title) || fallback.title,
    title_en: cleanText(item.title_en) || fallback.title_en,
    type: normalizeType(item.type || fallback.type),
    image_url: cleanText(item.image_url),
    thumbnail_url: cleanText(item.thumbnail_url),
    video_url: cleanText(item.video_url),
    sort_order: Number(item.sort_order) || fallback.sort_order || 0,
    is_active: normalizeBoolean(item.is_active) ? 1 : 0,
  }
}

function validateItems(type, items, req) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: msg(req, 'itemRequired') }
  }

  if (type === 'photo' && items.length > MAX_COLLECTION_IMAGES) {
    return { error: msg(req, 'maxImages') }
  }

  if (type === 'video' && items.length > MAX_COLLECTION_VIDEOS) {
    return { error: msg(req, 'maxVideos') }
  }

  if (type === 'photo' && items.some((item) => !cleanText(item.image_url))) {
    return { error: msg(req, 'allImagesRequired') }
  }

  if (type === 'video' && items.some((item) => !cleanText(item.video_url))) {
    return { error: msg(req, 'allVideosRequired') }
  }

  const urls = items.flatMap((item) => [
    item.image_url,
    item.thumbnail_url,
    item.video_url,
  ]).filter(Boolean)

  if (urls.some((url) => !isValidHttpUrl(url))) {
    return { error: msg(req, 'invalidMediaUrl') }
  }

  return null
}

async function attachItems(collections, publicOnly = true) {
  if (!collections.length) return []

  const collectionIds = collections.map((collection) => collection.id)
  const activeClause = publicOnly ? 'AND gi.is_active = 1' : ''

  const [items] = await db.query(
    `
      SELECT
        gi.id,
        gi.collection_id,
        gi.title,
        gi.title_en,
        gi.type,
        gi.image_url,
        gi.thumbnail_url,
        gi.video_url,
        gi.sort_order,
        gi.is_active,
        gi.created_at,
        gi.updated_at
      FROM gallery_items gi
      WHERE gi.collection_id IN (?)
        ${activeClause}
      ORDER BY gi.sort_order ASC, gi.created_at ASC
    `,
    [collectionIds]
  )

  const grouped = new Map(
    collections.map((collection) => [
      collection.id,
      {
        ...collection,
        items: [],
      },
    ])
  )

  items.forEach((item) => {
    grouped.get(item.collection_id)?.items.push(item)
  })

  return Array.from(grouped.values()).filter((collection) => {
    return publicOnly ? collection.items.length > 0 : true
  })
}

async function getCollections({ type = null, publicOnly = true, eventId = null } = {}) {
  const conditions = []
  const params = []
  let join = ''

  if (eventId) {
    join = `
      INNER JOIN event_gallery_collections egc
        ON egc.collection_id = gc.id
    `
    conditions.push('egc.event_id = ?')
    params.push(eventId)
  }

  if (type) {
    conditions.push('gc.type = ?')
    params.push(type)
  }

  if (publicOnly) {
    conditions.push('gc.is_active = 1')
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const [collections] = await db.query(
    `
      SELECT DISTINCT
        gc.id,
        gc.title,
        gc.title_en,
        gc.type,
        gc.cover_url,
        gc.sort_order,
        gc.is_active,
        gc.created_at,
        gc.updated_at
      FROM gallery_collections gc
      ${join}
      ${where}
      ORDER BY gc.sort_order ASC, gc.created_at DESC
    `,
    params
  )

  return attachItems(collections, publicOnly)
}

async function insertItems(connection, collectionId, collection, items) {
  const values = items.map((item, index) => {
    const clean = cleanItemPayload(item, {
      title: collection.title,
      title_en: collection.title_en,
      type: collection.type,
      sort_order: index + 1,
    })

    return [
      collectionId,
      clean.title,
      clean.title_en,
      null,
      null,
      collection.type,
      clean.image_url,
      clean.thumbnail_url,
      clean.video_url,
      clean.sort_order || index + 1,
      clean.is_active,
    ]
  })

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
}

// Public collection endpoints.
router.get('/photo-collections', async (req, res) => {
  try {
    return res.json(
      await getCollections({
        type: 'photo',
        publicOnly: true,
      })
    )
  } catch (error) {
    console.error('Photo collections error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

router.get('/video-collections', async (req, res) => {
  try {
    return res.json(
      await getCollections({
        type: 'video',
        publicOnly: true,
      })
    )
  } catch (error) {
    console.error('Video collections error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

router.get('/event/:eventId', async (req, res) => {
  try {
    const eventId = normalizeCollectionId(req.params.eventId)

    if (!eventId) {
      return res.status(400).json({ error: msg(req, 'notFound') })
    }

    return res.json(
      await getCollections({
        publicOnly: true,
        eventId,
      })
    )
  } catch (error) {
    console.error('Event gallery collections error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Old public flat endpoints remain for backward compatibility.
router.get('/photos', async (req, res) => {
  try {
    const [rows] = await db.query(
      `
        SELECT
          id,
          collection_id,
          title,
          title_en,
          type,
          image_url,
          thumbnail_url,
          video_url,
          sort_order,
          is_active,
          created_at,
          updated_at
        FROM gallery_items
        WHERE type = 'photo' AND is_active = 1
        ORDER BY sort_order ASC, created_at DESC
      `
    )
    return res.json(rows)
  } catch (error) {
    console.error('Gallery photos error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

router.get('/videos', async (req, res) => {
  try {
    const [rows] = await db.query(
      `
        SELECT
          id,
          collection_id,
          title,
          title_en,
          type,
          image_url,
          thumbnail_url,
          video_url,
          sort_order,
          is_active,
          created_at,
          updated_at
        FROM gallery_items
        WHERE type = 'video' AND is_active = 1
        ORDER BY sort_order ASC, created_at DESC
      `
    )
    return res.json(rows)
  } catch (error) {
    console.error('Gallery videos error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Admin collection endpoints.
router.get('/collections/all', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
        SELECT
          gc.id,
          gc.title,
          gc.title_en,
          gc.type,
          gc.cover_url,
          gc.sort_order,
          gc.is_active,
          gc.created_at,
          gc.updated_at,
          COALESCE(item_counter.items_count, 0) AS items_count,
          COALESCE(event_counter.events_count, 0) AS events_count
        FROM gallery_collections gc
        LEFT JOIN (
          SELECT collection_id, COUNT(*) AS items_count
          FROM gallery_items
          WHERE collection_id IS NOT NULL
          GROUP BY collection_id
        ) item_counter ON item_counter.collection_id = gc.id
        LEFT JOIN (
          SELECT collection_id, COUNT(*) AS events_count
          FROM event_gallery_collections
          GROUP BY collection_id
        ) event_counter ON event_counter.collection_id = gc.id
        ORDER BY gc.sort_order ASC, gc.created_at DESC
      `
    )

    return res.json(rows)
  } catch (error) {
    console.error('Gallery collections all error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

router.get('/collections/:id', auth, async (req, res) => {
  try {
    const [collections] = await db.query(
      `SELECT
          id,
          title,
          title_en,
          type,
          cover_url,
          sort_order,
          is_active,
          created_at,
          updated_at
        FROM gallery_collections
        WHERE id = ?`,
      [req.params.id]
    )

    if (!collections.length) {
      return res.status(404).json({ error: msg(req, 'notFound') })
    }

    const [items] = await db.query(
      `
        SELECT
          id,
          collection_id,
          title,
          title_en,
          type,
          image_url,
          thumbnail_url,
          video_url,
          sort_order,
          is_active,
          created_at,
          updated_at
        FROM gallery_items
        WHERE collection_id = ?
        ORDER BY sort_order ASC, created_at ASC
      `,
      [req.params.id]
    )

    const [events] = await db.query(
      `
        SELECT e.id, e.title, e.title_en, e.event_date
        FROM events e
        INNER JOIN event_gallery_collections egc ON egc.event_id = e.id
        WHERE egc.collection_id = ?
        ORDER BY e.event_date DESC
      `,
      [req.params.id]
    )

    return res.json({
      ...collections[0],
      items,
      events,
    })
  } catch (error) {
    console.error('Gallery collection single error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

router.post('/collections', auth, async (req, res) => {
  const connection = await db.getConnection()

  try {
    const collection = cleanCollectionPayload(req.body.collection || {})
    const items = Array.isArray(req.body.items) ? req.body.items : []

    if (!collection.title) {
      return res.status(400).json({ error: msg(req, 'titleRequired') })
    }

    if (collection.cover_url && !isValidHttpUrl(collection.cover_url)) {
      return res.status(400).json({ error: msg(req, 'invalidMediaUrl') })
    }

    const validation = validateItems(collection.type, items, req)
    if (validation) {
      return res.status(400).json({ error: validation.error })
    }

    await connection.beginTransaction()

    const firstItem = items[0] || {}
    const coverUrl =
      collection.cover_url ||
      cleanText(firstItem.thumbnail_url) ||
      cleanText(firstItem.image_url) ||
      null

    const [result] = await connection.query(
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
        VALUES (?, ?, NULL, NULL, ?, ?, ?, ?)
      `,
      [
        collection.title,
        collection.title_en,
        collection.type,
        coverUrl,
        collection.sort_order,
        collection.is_active,
      ]
    )

    await insertItems(connection, result.insertId, collection, items)
    await connection.commit()

    return res.status(201).json({
      id: result.insertId,
      message: msg(req, 'collectionCreated'),
    })
  } catch (error) {
    await connection.rollback()
    console.error('Create gallery collection error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  } finally {
    connection.release()
  }
})

router.put('/collections/:id', auth, async (req, res) => {
  try {
    const collection = cleanCollectionPayload(req.body)

    if (!collection.title) {
      return res.status(400).json({ error: msg(req, 'titleRequired') })
    }

    if (collection.cover_url && !isValidHttpUrl(collection.cover_url)) {
      return res.status(400).json({ error: msg(req, 'invalidMediaUrl') })
    }

    const [existing] = await db.query(
      'SELECT id, type FROM gallery_collections WHERE id = ?',
      [req.params.id]
    )

    if (!existing.length) {
      return res.status(404).json({ error: msg(req, 'notFound') })
    }

    await db.query(
      `
        UPDATE gallery_collections
        SET
          title = ?,
          title_en = ?,
          description = NULL,
          description_en = NULL,
          type = ?,
          cover_url = ?,
          sort_order = ?,
          is_active = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        collection.title,
        collection.title_en,
        existing[0].type,
        collection.cover_url,
        collection.sort_order,
        collection.is_active,
        req.params.id,
      ]
    )

    return res.json({ message: msg(req, 'collectionUpdated') })
  } catch (error) {
    console.error('Update gallery collection error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

router.post('/collections/:id/items', auth, async (req, res) => {
  const connection = await db.getConnection()

  try {
    const [collections] = await connection.query(
      'SELECT id, title, title_en, type, cover_url, sort_order, is_active FROM gallery_collections WHERE id = ?',
      [req.params.id]
    )

    if (!collections.length) {
      return res.status(404).json({ error: msg(req, 'notFound') })
    }

    const collection = cleanCollectionPayload(collections[0])
    const items = Array.isArray(req.body.items) ? req.body.items : []
    const validation = validateItems(collection.type, items, req)

    if (validation) {
      return res.status(400).json({ error: validation.error })
    }

    await connection.beginTransaction()
    await insertItems(connection, req.params.id, collection, items)

    if (!collection.cover_url) {
      const first = items[0] || {}
      const coverUrl = cleanText(first.thumbnail_url) || cleanText(first.image_url)

      if (coverUrl) {
        await connection.query(
          'UPDATE gallery_collections SET cover_url = ? WHERE id = ?',
          [coverUrl, req.params.id]
        )
      }
    }

    await connection.commit()
    return res.status(201).json({ message: msg(req, 'itemsAdded') })
  } catch (error) {
    await connection.rollback()
    console.error('Add gallery collection items error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  } finally {
    connection.release()
  }
})

router.delete('/items/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
        SELECT image_url, thumbnail_url, video_url
        FROM gallery_items
        WHERE id = ?
      `,
      [req.params.id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: msg(req, 'notFound') })
    }

    await db.query('DELETE FROM gallery_items WHERE id = ?', [req.params.id])

    const urls = [rows[0].image_url, rows[0].thumbnail_url, rows[0].video_url]
      .filter(Boolean)
      .filter((url) => String(url).includes('/storage/v1/object/public/'))

    await Promise.all(
      [...new Set(urls)].map((url) => deleteFile(url).catch(() => {}))
    )

    return res.json({ message: msg(req, 'itemDeleted') })
  } catch (error) {
    console.error('Delete gallery item error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

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
        SELECT image_url, thumbnail_url, video_url
        FROM gallery_items
        WHERE collection_id = ?
      `,
      [req.params.id]
    )

    await db.query(
      'DELETE FROM event_gallery_collections WHERE collection_id = ?',
      [req.params.id]
    )
    await db.query('DELETE FROM gallery_items WHERE collection_id = ?', [req.params.id])
    await db.query('DELETE FROM gallery_collections WHERE id = ?', [req.params.id])

    const urls = [
      collections[0].cover_url,
      ...items.flatMap((item) => [
        item.image_url,
        item.thumbnail_url,
        item.video_url,
      ]),
    ]
      .filter(Boolean)
      .filter((url) => String(url).includes('/storage/v1/object/public/'))

    await Promise.all(
      [...new Set(urls)].map((url) => deleteFile(url).catch(() => {}))
    )

    return res.json({ message: msg(req, 'collectionDeleted') })
  } catch (error) {
    console.error('Delete gallery collection error:', error)
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

// Flat admin endpoints retained for compatibility with older clients.
router.get('/all', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        collection_id,
        title,
        title_en,
        type,
        image_url,
        thumbnail_url,
        video_url,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM gallery_items
      ORDER BY sort_order ASC, created_at DESC`
    )
    return res.json(rows)
  } catch (error) {
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

router.get('/admin/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        collection_id,
        title,
        title_en,
        type,
        image_url,
        thumbnail_url,
        video_url,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM gallery_items
      WHERE id = ?`,
      [req.params.id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: msg(req, 'notFound') })
    }

    return res.json(rows[0])
  } catch (error) {
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const item = cleanItemPayload(req.body, {
      type: normalizeType(req.body.type),
    })

    if (!item.title) {
      return res.status(400).json({ error: msg(req, 'titleRequired') })
    }

    if (item.type === 'photo' && !item.image_url) {
      return res.status(400).json({ error: msg(req, 'imageRequired') })
    }

    if (item.type === 'video' && !item.video_url) {
      return res.status(400).json({ error: msg(req, 'videoRequired') })
    }

    const itemUrls = [item.image_url, item.thumbnail_url, item.video_url].filter(Boolean)
    if (itemUrls.some((url) => !isValidHttpUrl(url))) {
      return res.status(400).json({ error: msg(req, 'invalidMediaUrl') })
    }

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
        VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizeCollectionId(req.body.collection_id),
        item.title,
        item.title_en,
        item.type,
        item.image_url,
        item.thumbnail_url,
        item.video_url,
        item.sort_order,
        item.is_active,
      ]
    )

    return res.status(201).json({
      id: result.insertId,
      message: msg(req, 'created'),
    })
  } catch (error) {
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const item = cleanItemPayload(req.body, {
      type: normalizeType(req.body.type),
    })

    if (!item.title) {
      return res.status(400).json({ error: msg(req, 'titleRequired') })
    }

    if (item.type === 'photo' && !item.image_url) {
      return res.status(400).json({ error: msg(req, 'imageRequired') })
    }

    if (item.type === 'video' && !item.video_url) {
      return res.status(400).json({ error: msg(req, 'videoRequired') })
    }

    const itemUrls = [item.image_url, item.thumbnail_url, item.video_url].filter(Boolean)
    if (itemUrls.some((url) => !isValidHttpUrl(url))) {
      return res.status(400).json({ error: msg(req, 'invalidMediaUrl') })
    }

    await db.query(
      `
        UPDATE gallery_items
        SET
          collection_id = ?,
          title = ?,
          title_en = ?,
          description = NULL,
          description_en = NULL,
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
        normalizeCollectionId(req.body.collection_id),
        item.title,
        item.title_en,
        item.type,
        item.image_url,
        item.thumbnail_url,
        item.video_url,
        item.sort_order,
        item.is_active,
        req.params.id,
      ]
    )

    return res.json({ message: msg(req, 'updated') })
  } catch (error) {
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT image_url, thumbnail_url, video_url FROM gallery_items WHERE id = ?',
      [req.params.id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: msg(req, 'notFound') })
    }

    await db.query('DELETE FROM gallery_items WHERE id = ?', [req.params.id])

    const urls = [rows[0].image_url, rows[0].thumbnail_url, rows[0].video_url]
      .filter(Boolean)
      .filter((url) => String(url).includes('/storage/v1/object/public/'))

    await Promise.all(
      [...new Set(urls)].map((url) => deleteFile(url).catch(() => {}))
    )

    return res.json({ message: msg(req, 'deleted') })
  } catch (error) {
    return res.status(500).json({ error: msg(req, 'serverError') })
  }
})

module.exports = router
