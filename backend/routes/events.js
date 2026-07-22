const router = require('express').Router()

const db = require('../lib/db')
const auth = require('../middleware/auth')
const { deleteFile } = require('../lib/storage')

const VALID_TYPES = ['event', 'seminar', 'project', 'training']

function cleanText(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function normalizeBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  return value === true || value === 1 || value === '1'
}

function normalizeCollectionIds(value) {
  if (!Array.isArray(value)) return []

  return [
    ...new Set(
      value
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ]
}

function normalizeEventPayload(body = {}) {
  return {
    title: cleanText(body.title),
    title_en: cleanText(body.title_en),
    content: cleanText(body.content),
    content_en: cleanText(body.content_en),
    type: VALID_TYPES.includes(body.type) ? body.type : 'event',
    event_date: cleanText(body.event_date),
    location: cleanText(body.location),
    location_en: cleanText(body.location_en),
    image_url: cleanText(body.image_url),
    published: normalizeBoolean(body.published, true) ? 1 : 0,
    collection_ids: normalizeCollectionIds(body.collection_ids),
  }
}

async function syncEventCollections(connection, eventId, collectionIds) {
  await connection.query(
    'DELETE FROM event_gallery_collections WHERE event_id = ?',
    [eventId]
  )

  if (!collectionIds.length) return

  const [validCollections] = await connection.query(
    'SELECT id FROM gallery_collections WHERE id IN (?)',
    [collectionIds]
  )

  const validIds = validCollections.map((collection) => collection.id)
  if (!validIds.length) return

  await connection.query(
    'INSERT INTO event_gallery_collections (event_id, collection_id) VALUES ?',
    [validIds.map((collectionId) => [eventId, collectionId])]
  )
}

async function attachCollectionSummary(events, publicOnly = false) {
  if (!events.length) return []

  const eventIds = events.map((event) => event.id)
  const [relations] = await db.query(
    `
      SELECT
        egc.event_id,
        gc.id,
        gc.title,
        gc.title_en,
        gc.type,
        gc.cover_url,
        gc.is_active,
        COALESCE(item_counter.items_count, 0) AS items_count
      FROM event_gallery_collections egc
      INNER JOIN gallery_collections gc ON gc.id = egc.collection_id
      LEFT JOIN (
        SELECT collection_id, COUNT(*) AS items_count
        FROM gallery_items
        WHERE is_active = 1
        GROUP BY collection_id
      ) item_counter ON item_counter.collection_id = gc.id
      WHERE egc.event_id IN (?)
        ${publicOnly ? 'AND gc.is_active = 1' : ''}
      ORDER BY gc.sort_order ASC, gc.created_at DESC
    `,
    [eventIds]
  )

  const grouped = new Map(eventIds.map((id) => [id, []]))

  relations.forEach((relation) => {
    if (publicOnly && Number(relation.items_count) <= 0) return

    grouped.get(relation.event_id)?.push({
      id: relation.id,
      title: relation.title,
      title_en: relation.title_en,
      type: relation.type,
      cover_url: relation.cover_url,
      items_count: Number(relation.items_count) || 0,
    })
  })

  return events.map((event) => {
    const relatedCollections = grouped.get(event.id) || []

    return {
      ...event,
      related_collections: relatedCollections,
      related_collection_ids: relatedCollections.map(
        (collection) => collection.id
      ),
      related_collections_count: relatedCollections.length,
    }
  })
}

async function getEventWithFullCollections(eventId, publicOnly = true) {
  const eventWhere = publicOnly
    ? 'WHERE id = ? AND published = 1'
    : 'WHERE id = ?'

  const [events] = await db.query(`SELECT * FROM events ${eventWhere}`, [eventId])
  if (!events.length) return null

  const activeCollectionClause = publicOnly ? 'AND gc.is_active = 1' : ''
  const activeItemClause = publicOnly ? 'AND gi.is_active = 1' : ''

  const [collections] = await db.query(
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
        gc.updated_at
      FROM gallery_collections gc
      INNER JOIN event_gallery_collections egc
        ON egc.collection_id = gc.id
      WHERE egc.event_id = ?
        ${activeCollectionClause}
      ORDER BY gc.sort_order ASC, gc.created_at DESC
    `,
    [eventId]
  )

  if (!collections.length) {
    return {
      ...events[0],
      related_collections: [],
      related_collection_ids: [],
      related_collections_count: 0,
    }
  }

  const collectionIds = collections.map((collection) => collection.id)
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
        ${activeItemClause}
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

  const relatedCollections = Array.from(grouped.values()).filter(
    (collection) => !publicOnly || collection.items.length > 0
  )

  return {
    ...events[0],
    related_collections: relatedCollections,
    related_collection_ids: relatedCollections.map(
      (collection) => collection.id
    ),
    related_collections_count: relatedCollections.length,
  }
}

// Public list. Each event includes related collection metadata and count.
router.get('/', async (req, res) => {
  try {
    const type = VALID_TYPES.includes(req.query.type) ? req.query.type : null
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200)
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0)

    let sql = 'SELECT * FROM events WHERE published = 1'
    const params = []

    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }

    sql += ' ORDER BY event_date ASC, created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const [rows] = await db.query(sql, params)
    return res.json(await attachCollectionSummary(rows, true))
  } catch (error) {
    console.error('Events public list error:', error)
    return res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// Admin list. Includes unpublished events and selected collection IDs.
router.get('/all', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM events ORDER BY event_date DESC, created_at DESC'
    )
    return res.json(await attachCollectionSummary(rows, false))
  } catch (error) {
    console.error('Events admin list error:', error)
    return res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// Public single event with full related collection items.
router.get('/:id', async (req, res) => {
  try {
    const event = await getEventWithFullCollections(req.params.id, true)

    if (!event) {
      return res.status(404).json({ error: 'غير موجود' })
    }

    return res.json(event)
  } catch (error) {
    console.error('Event single error:', error)
    return res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

router.post('/', auth, async (req, res) => {
  const connection = await db.getConnection()

  try {
    const event = normalizeEventPayload(req.body)

    if (!event.title) {
      return res.status(400).json({ error: 'العنوان مطلوب' })
    }

    await connection.beginTransaction()

    const [result] = await connection.query(
      `
        INSERT INTO events
        (
          title,
          title_en,
          content,
          content_en,
          type,
          event_date,
          location,
          location_en,
          image_url,
          published
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        event.title,
        event.title_en,
        event.content,
        event.content_en,
        event.type,
        event.event_date,
        event.location,
        event.location_en,
        event.image_url,
        event.published,
      ]
    )

    await syncEventCollections(
      connection,
      result.insertId,
      event.collection_ids
    )

    await connection.commit()

    return res.status(201).json({
      id: result.insertId,
      message: 'تمت الإضافة',
    })
  } catch (error) {
    await connection.rollback()
    console.error('Create event error:', error)
    return res.status(500).json({ error: 'خطأ في الخادم' })
  } finally {
    connection.release()
  }
})

router.put('/:id', auth, async (req, res) => {
  const connection = await db.getConnection()

  try {
    const event = normalizeEventPayload(req.body)

    if (!event.title) {
      return res.status(400).json({ error: 'العنوان مطلوب' })
    }

    const [existing] = await connection.query(
      'SELECT id FROM events WHERE id = ?',
      [req.params.id]
    )

    if (!existing.length) {
      return res.status(404).json({ error: 'غير موجود' })
    }

    await connection.beginTransaction()

    await connection.query(
      `
        UPDATE events
        SET
          title = ?,
          title_en = ?,
          content = ?,
          content_en = ?,
          type = ?,
          event_date = ?,
          location = ?,
          location_en = ?,
          image_url = ?,
          published = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        event.title,
        event.title_en,
        event.content,
        event.content_en,
        event.type,
        event.event_date,
        event.location,
        event.location_en,
        event.image_url,
        event.published,
        req.params.id,
      ]
    )

    await syncEventCollections(
      connection,
      req.params.id,
      event.collection_ids
    )

    await connection.commit()
    return res.json({ message: 'تم التحديث' })
  } catch (error) {
    await connection.rollback()
    console.error('Update event error:', error)
    return res.status(500).json({ error: 'خطأ في الخادم' })
  } finally {
    connection.release()
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT image_url FROM events WHERE id = ?', [
      req.params.id,
    ])

    if (!rows.length) {
      return res.status(404).json({ error: 'غير موجود' })
    }

    await db.query(
      'DELETE FROM event_gallery_collections WHERE event_id = ?',
      [req.params.id]
    )
    await db.query('DELETE FROM events WHERE id = ?', [req.params.id])

    if (rows[0]?.image_url) {
      await deleteFile(rows[0].image_url).catch(() => {})
    }

    return res.json({ message: 'تم الحذف' })
  } catch (error) {
    console.error('Delete event error:', error)
    return res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

module.exports = router
