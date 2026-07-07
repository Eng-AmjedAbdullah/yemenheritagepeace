require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const db = require('./lib/db')

const app = express()

app.set('trust proxy', 1)

const PORT = process.env.PORT || 5000

const DEFAULT_CLIENT_URLS = [
  'https://yemenheritagepeace.org',
  'https://www.yemenheritagepeace.org',
  'http://localhost:5173',
]

const allowedOrigins = (
  process.env.CLIENT_URLS ||
  process.env.CLIENT_URL ||
  DEFAULT_CLIENT_URLS.join(',')
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true)
      }

      const cleanOrigin = origin.trim().replace(/\/$/, '')

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true)
      }

      console.warn(`⚠️ CORS blocked origin: ${origin}`)
      return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

app.options('*', cors())

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Legacy local uploads support only
const legacyUploadsDir = path.join(__dirname, 'uploads')

if (fs.existsSync(legacyUploadsDir)) {
  app.use(
    '/uploads',
    express.static(legacyUploadsDir, {
      maxAge: '7d',
      etag: true,
    })
  )
}

// Health check used by Render and frontend preloader
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1')

    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      time: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Health check database error:', error.message)

    return res.status(503).json({
      status: 'db_error',
      database: 'disconnected',
      time: new Date().toISOString(),
    })
  }
})

try {
  const rateLimit = require('express-rate-limit')

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
      error: 'محاولات كثيرة، حاول مجدداً بعد 15 دقيقة',
    },
    standardHeaders: true,
    legacyHeaders: false,
  })

  app.use('/api/auth/login', loginLimiter)

  console.log('✅ Rate limiting active on /api/auth/login')
} catch {
  console.warn('⚠️ express-rate-limit not installed — run: npm install express-rate-limit')
}

function mountRoute(apiPath, routeFile) {
  const routePath = path.join(__dirname, 'routes', `${routeFile}.js`)

  if (!fs.existsSync(routePath)) {
    console.warn(`⚠️ Route file not found: routes/${routeFile}.js`)
    return
  }

  app.use(apiPath, require(routePath))
  console.log(`✅ Mounted ${apiPath}`)
}

mountRoute('/api/auth', 'auth')
mountRoute('/api/news', 'news')
mountRoute('/api/events', 'events')
mountRoute('/api/heritage', 'heritage')
mountRoute('/api/admins', 'admins')
mountRoute('/api/contact', 'contact')
mountRoute('/api/profile', 'profile')
mountRoute('/api/upload', 'upload')
mountRoute('/api/settings', 'settings')
mountRoute('/api/partners', 'partners')
mountRoute('/api/hero', 'hero')
mountRoute('/api/gallery', 'gallery')

// API 404 fallback
app.use('/api', (req, res) => {
  return res.status(404).json({
    error: 'المسار غير موجود',
    path: req.originalUrl,
  })
})

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err)

  if (err.message && err.message.includes('CORS blocked')) {
    return res.status(403).json({
      error: 'CORS blocked',
      origin: req.headers.origin || null,
    })
  }

  return res.status(500).json({
    error: 'خطأ داخلي في الخادم',
  })
})

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log('🌍 Allowed client origins:', allowedOrigins)

  try {
    await db.query('SELECT 1')
    console.log('✅ MySQL connected')
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message)
  }
})

module.exports = app
