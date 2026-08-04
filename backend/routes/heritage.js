// routes/heritage.js  (FIXED)
//
// FIX 13: PUT was writing `updated_at=NOW()` (it wasn't — but it SHOULD be).
//          Column now exists in schema; we add explicit updated_at to the UPDATE.
//
// FIX 14: Added GET /:id for fetching a single heritage item (was missing — the
//          admin panel had no way to load one item for editing without fetching all).

const router = require('express').Router()
const db     = require('../lib/db')
const auth   = require('../middleware/auth')
const { deleteFile } = require('../lib/storage')

// GET /api/heritage  (public)
router.get('/', async (req, res) => {
  try {
    const type   = req.query.type || 'tangible'
    const limit  = parseInt(req.query.limit)  || 100
    const offset = parseInt(req.query.offset) || 0
    const [rows] = await db.query(
      'SELECT * FROM heritage_items WHERE published=1 AND type=? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [type, limit, offset]
    )
    res.json(rows)
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// GET /api/heritage/all  (admin)
router.get('/all', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM heritage_items ORDER BY created_at DESC')
    res.json(rows)
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// GET /api/heritage/:id  (public — published only)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM heritage_items WHERE id = ? AND published = 1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'غير موجود' })
    res.json(rows[0])
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// GET /api/heritage/admin/:id  (admin — single item regardless of published)
router.get('/admin/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM heritage_items WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'غير موجود' })
    res.json(rows[0])
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// POST /api/heritage  (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { title, title_en, content, content_en, type, image_url, location, period, published } = req.body
    if (!title) return res.status(400).json({ error: 'العنوان مطلوب' })
    const [result] = await db.query(
      'INSERT INTO heritage_items (title,title_en,content,content_en,type,image_url,location,period,published) VALUES (?,?,?,?,?,?,?,?,?)',
      [title, title_en||null, content||null, content_en||null, type||'tangible', image_url||null, location||null, period||null, published !== false ? 1 : 0]
    )
    res.status(201).json({ id: result.insertId, message: 'تم الإضافة' })
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// PUT /api/heritage/:id  (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, title_en, content, content_en, type, image_url, location, period, published } = req.body
    if (!title) return res.status(400).json({ error: 'العنوان مطلوب' })
    await db.query(
      // FIX: added updated_at=NOW()
      'UPDATE heritage_items SET title=?,title_en=?,content=?,content_en=?,type=?,image_url=?,location=?,period=?,published=?,updated_at=NOW() WHERE id=?',
      [title, title_en||null, content||null, content_en||null, type||'tangible', image_url||null, location||null, period||null, published !== false ? 1 : 0, req.params.id]
    )
    res.json({ message: 'تم التحديث' })
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// DELETE /api/heritage/:id  (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT image_url FROM heritage_items WHERE id=?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'غير موجود' })
    if (rows[0]?.image_url) await deleteFile(rows[0].image_url).catch(() => {})
    await db.query('DELETE FROM heritage_items WHERE id=?', [req.params.id])
    res.json({ message: 'تم الحذف' })
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

module.exports = router
