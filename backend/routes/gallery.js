const router = require('express').Router()
const db = require('../lib/db')
const auth = require('../middleware/auth')
const { deleteFile } = require('../lib/storage')

const VALID_TYPES = ['photo', 'video']

function normalizeBoolean(value) {
  return value === true || value === 1 || value === '1'
}

function cleanText(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function validatePayload(body) {
  const title = cleanText(body.title)
  const type = VALID_TYPES.includes(body.type) ? body.type : 'photo'

  if (!title) {
    return { error: 'العنوان مطلوب' }
  }

  if (type === 'photo' && !cleanText(body.image_url)) {
    return { error: 'صورة المعرض مطلوبة' }
  }

  if (type === 'video' && !cleanText(body.video_url)) {
    return { error: 'رابط الفيديو مطلوب' }
  }

  return null
}

// Public photos
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
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// Public videos
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
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// Admin all
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
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// Admin single
router.get('/admin/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM gallery_items WHERE id = ?',
      [req.params.id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'غير موجود' })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('Gallery single error:', error)
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// Admin create
router.post('/', auth, async (req, res) => {
  try {
    const validation = validatePayload(req.body)
    if (validation) {
      return res.status(400).json({ error: validation.error })
    }

    const type = VALID_TYPES.includes(req.body.type) ? req.body.type : 'photo'

    const [result] = await db.query(
      `
      INSERT INTO gallery_items
      (
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
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
      message: 'تمت الإضافة',
    })
  } catch (error) {
    console.error('Gallery create error:', error)
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// Admin update
router.put('/:id', auth, async (req, res) => {
  try {
    const validation = validatePayload(req.body)
    if (validation) {
      return res.status(400).json({ error: validation.error })
    }

    const type = VALID_TYPES.includes(req.body.type) ? req.body.type : 'photo'

    await db.query(
      `
      UPDATE gallery_items
      SET
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

    res.json({ message: 'تم التحديث' })
  } catch (error) {
    console.error('Gallery update error:', error)
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// Admin delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT image_url, thumbnail_url FROM gallery_items WHERE id = ?',
      [req.params.id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'غير موجود' })
    }

    const item = rows[0]

    if (item.image_url) {
      await deleteFile(item.image_url).catch(() => {})
    }

    if (item.thumbnail_url && item.thumbnail_url !== item.image_url) {
      await deleteFile(item.thumbnail_url).catch(() => {})
    }

    await db.query('DELETE FROM gallery_items WHERE id = ?', [req.params.id])

    res.json({ message: 'تم الحذف' })
  } catch (error) {
    console.error('Gallery delete error:', error)
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

module.exports = router
