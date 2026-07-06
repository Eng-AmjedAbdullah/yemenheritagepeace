require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const db = require('./lib/db')

const app = express()
app.set('trust proxy', 1)
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'https://yemenheritagepeace.org',
    'http://localhost:5173',
  ],
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Legacy local uploads support only
const legacyUploadsDir = path.join(__dirname, 'uploads')
if (fs.existsSync(legacyUploadsDir)) {
  app.use('/uploads', express.static(legacyUploadsDir, {
    maxAge: '7d',
    etag: true,
  }))
}

try {
  const rateLimit = require('express-rate-limit')
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'محاولات كثيرة، حاول مجدداً بعد 15 دقيقة' },
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use('/api/auth/login', loginLimiter)
  console.log('✅ Rate limiting active on /api/auth/login')
} catch {
  console.warn('⚠️ express-rate-limit not installed — run: npm install')
}

app.use('/api/auth', require('./routes/auth'))
app.use('/api/news', require('./routes/news'))
app.use('/api/events', require('./routes/events'))
app.use('/api/heritage', require('./routes/heritage'))
app.use('/api/admins', require('./routes/admins'))
app.use('/api/contact', require('./routes/contact'))
app.use('/api/profile', require('./routes/profile'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/settings', require('./routes/settings'))
app.use('/api/partners', require('./routes/partners'))
app.use('/api/hero', require('./routes/hero'))
app.use('/api/gallery', require('./routes/gallery'))
app.get('/api/health', async (req, res) => {
  let dbOk = false
  try {
    await db.query('SELECT 1')
    dbOk = true
  } catch {}

  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'db_error',
    time: new Date(),
  })
})



app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'المسار غير موجود' })
})

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'خطأ داخلي في الخادم' })
})

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  try {
    await db.query('SELECT 1')
    console.log('✅ MySQL connected')
  } catch (e) {
    console.error('❌ MySQL connection failed:', e.message)
  }
})

module.exports = app
