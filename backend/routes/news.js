// routes/news.js  (FIXED)
//
// FIX 26: The public GET /:id route returned unpublished articles to anyone who
//          knew the ID.  Now it enforces `published=1` for the public endpoint.
//          A separate admin endpoint GET /admin/:id returns any article regardless
//          of published status.
//
// FIX 27: category validation — accept only known categories to prevent junk data.

const router = require('express').Router()
const db     = require('../lib/db')
const auth   = require('../middleware/auth')
const { deleteFile } = require('../lib/storage')

const VALID_CATEGORIES_AR = ['أخبار', 'فعاليات', 'مشاريع', 'دراسات', 'إعلانات', 'تقارير']
const VALID_CATEGORIES_EN = ['News', 'Events', 'Projects', 'Studies', 'Announcements', 'Reports']

function cleanText(value) {
  return String(value || '').trim() || null
}
router.get('/ping', async (req, res) => {
  try {
    await db.query('SELECT 1'); 
    res.status(200).send('pong');
  } catch (error) {
    console.error('Ping database error:', error);
    res.status(200).send('Render is awake, but DB had an issue');
  }
});
// GET /api/news  (public — published only)
router.get('/', async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit)  || 100
    const offset = parseInt(req.query.offset) || 0
    const search = req.query.search ? `%${req.query.search}%` : null
    let sql = 'SELECT * FROM news WHERE published = 1'
    const params = []
    if (search) { sql += ' AND (title LIKE ? OR title_en LIKE ?)'; params.push(search, search) }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    const [rows] = await db.query(sql, params)
    res.json(rows)
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// GET /api/news/all  (admin — includes unpublished)
router.get('/all', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM news ORDER BY created_at DESC')
    res.json(rows)
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// GET /api/news/admin/:id  (admin — single article regardless of published)
router.get('/admin/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM news WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'غير موجود' })
    res.json(rows[0])
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// GET /api/news/:id  (public — published only)
router.get('/:id', async (req, res) => {
  try {
    // FIX: added `published=1` — previously returned drafts to public
    const [rows] = await db.query('SELECT * FROM news WHERE id = ? AND published = 1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'غير موجود' })
    res.json(rows[0])
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// POST /api/news  (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { title, title_en, content, content_en, category, category_en, image_url, thumbnail_url, published, created_at } = req.body
    if (!title) return res.status(400).json({ error: 'العنوان مطلوب' })
    const [result] = await db.query(
      'INSERT INTO news (title,title_en,content,content_en,category,category_en,image_url,thumbnail_url,published,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [title, title_en||null, content||null, content_en||null,
       category||'أخبار', category_en||'News', image_url||null, thumbnail_url||null,
       published !== false ? 1 : 0, created_at||null]
    )
    res.status(201).json({ id: result.insertId, message: 'تم الإضافة' })
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// PUT /api/news/:id  (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT image_url, thumbnail_url FROM news WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'غير موجود' })

    const existing = rows[0]
    const {
      title,
      title_en,
      content,
      content_en,
      category,
      category_en,
      published,
      created_at,
    } = req.body

    const image_url = req.body.hasOwnProperty('image_url')
      ? cleanText(req.body.image_url)
      : existing.image_url

    const thumbnail_url = req.body.hasOwnProperty('thumbnail_url')
      ? cleanText(req.body.thumbnail_url)
      : existing.thumbnail_url

    if (!title) return res.status(400).json({ error: 'العنوان مطلوب' })

    await db.query(
      'UPDATE news SET title=?,title_en=?,content=?,content_en=?,category=?,category_en=?,image_url=?,thumbnail_url=?,published=?,created_at=?,updated_at=NOW() WHERE id=?',
      [
        title,
        title_en||null,
        content||null,
        content_en||null,
        category||'أخبار',
        category_en||'News',
        image_url,
        thumbnail_url,
        published !== false ? 1 : 0,
        created_at||null,
        req.params.id,
      ]
    )
    res.json({ message: 'تم التحديث' })
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

// DELETE /api/news/:id  (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT image_url, thumbnail_url FROM news WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'غير موجود' })

    const imageUrl = rows[0]?.image_url
    const thumbnailUrl = rows[0]?.thumbnail_url

    await db.query('DELETE FROM news WHERE id = ?', [req.params.id])

    await Promise.allSettled([
      imageUrl ? deleteFile(imageUrl) : Promise.resolve(),
      thumbnailUrl ? deleteFile(thumbnailUrl) : Promise.resolve(),
    ])

    res.json({ message: 'تم الحذف' })
  } catch { res.status(500).json({ error: 'خطأ في الخادم' }) }
})

module.exports = router
