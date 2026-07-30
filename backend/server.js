require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const db = require('./lib/db')

const app = express()

/*
 * Required when the backend runs behind
 * Render or another reverse proxy.
 */
app.set('trust proxy', 1)

/*
 * Hide the Express signature from responses.
 */
app.disable('x-powered-by')

const PORT =
  Number(process.env.PORT) ||
  5000

const DEFAULT_CLIENT_URLS = [
  'https://yemenheritagepeace.org',
  'https://www.yemenheritagepeace.org',
  'http://localhost:5173',
]

function normalizeOrigin(origin) {
  return String(origin || '')
    .trim()
    .replace(/\/$/, '')
}

const allowedOrigins = (
  process.env.CLIENT_URLS ||
  process.env.CLIENT_URL ||
  DEFAULT_CLIENT_URLS.join(',')
)
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean)

/*
 * Reusable CORS configuration.
 *
 * Accept-Language is required because the
 * frontend sends it to receive Arabic or
 * English backend messages.
 */
const corsOptions = {
  origin(origin, callback) {
    /*
     * Requests without an Origin header include:
     * - Render health checks
     * - server-to-server requests
     * - API testing tools
     */
    if (!origin) {
      callback(null, true)
      return
    }

    const cleanOrigin =
      normalizeOrigin(origin)

    if (
      allowedOrigins.includes(
        cleanOrigin
      )
    ) {
      callback(null, true)
      return
    }

    console.warn(
      `⚠️ CORS blocked origin: ${cleanOrigin}`
    )

    const error =
      new Error('CORS_BLOCKED')

    error.status = 403
    error.origin = cleanOrigin

    callback(error)
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept-Language',
  ],

  exposedHeaders: [
    'Content-Length',
    'Content-Type',
  ],

  optionsSuccessStatus: 204,

  maxAge: 86400,
}

/*
 * This middleware handles both ordinary CORS
 * requests and OPTIONS preflight requests.
 *
 * Do not add app.options('*', cors()) with default
 * settings because it can conflict with this policy.
 */
app.use(
  cors(corsOptions)
)

/*
 * Signed video upload requests contain metadata only:
 * file name, type, size and folder.
 *
 * The actual video is uploaded directly from the
 * browser to Storage, so a large JSON limit is not needed.
 */
app.use(
  express.json({
    limit: '2mb',
  })
)

app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb',
  })
)

/*
 * Legacy local uploads support.
 *
 * New files use remote storage, but this remains
 * available for older uploaded files.
 */
const legacyUploadsDir =
  path.join(
    __dirname,
    'uploads'
  )

if (
  fs.existsSync(
    legacyUploadsDir
  )
) {
  app.use(
    '/uploads',
    express.static(
      legacyUploadsDir,
      {
        maxAge: '7d',
        etag: true,
        fallthrough: true,
      }
    )
  )
}

/*
 * Basic API status.
 *
 * This endpoint checks both the backend and
 * the database connection.
 */
app.get(
  '/api/health',
  async (req, res) => {
    try {
      await db.query(
        'SELECT 1'
      )

      return res
        .status(200)
        .json({
          status: 'ok',
          server: 'running',
          database: 'connected',
          time:
            new Date()
              .toISOString(),
        })
    } catch (error) {
      console.error(
        '❌ Health check database error:',
        error.message
      )

      return res
        .status(503)
        .json({
          status: 'db_error',
          server: 'running',
          database: 'disconnected',
          time:
            new Date()
              .toISOString(),
        })
    }
  }
)

/*
 * Login rate limiter.
 *
 * The application remains operable when the optional
 * dependency has not yet been installed.
 */
try {
  const rateLimit =
    require('express-rate-limit')

  const loginLimiter =
    rateLimit({
      windowMs:
        15 * 60 * 1000,

      max: 20,

      standardHeaders: true,
      legacyHeaders: false,

      handler(req, res) {
        const isEnglish =
          String(
            req.headers[
              'accept-language'
            ] || ''
          )
            .toLowerCase()
            .startsWith('en')

        return res
          .status(429)
          .json({
            error:
              isEnglish
                ? 'Too many login attempts. Try again after 15 minutes.'
                : 'محاولات تسجيل دخول كثيرة. حاول مجددًا بعد 15 دقيقة.',
          })
      },
    })

  app.use(
    '/api/auth/login',
    loginLimiter
  )

  console.log(
    '✅ Rate limiting active on /api/auth/login'
  )
} catch (error) {
  console.warn(
    '⚠️ express-rate-limit is not installed. Run: npm install express-rate-limit'
  )
}

/*
 * Loads a route only when its file exists.
 */
function mountRoute(
  apiPath,
  routeFile
) {
  const routePath =
    path.join(
      __dirname,
      'routes',
      `${routeFile}.js`
    )

  if (
    !fs.existsSync(
      routePath
    )
  ) {
    console.warn(
      `⚠️ Route file not found: routes/${routeFile}.js`
    )

    return
  }

  try {
    const route =
      require(routePath)

    app.use(
      apiPath,
      route
    )

    console.log(
      `✅ Mounted ${apiPath}`
    )
  } catch (error) {
    console.error(
      `❌ Failed to mount ${apiPath}:`,
      error
    )

    throw error
  }
}

mountRoute(
  '/api/auth',
  'auth'
)

mountRoute(
  '/api/news',
  'news'
)

mountRoute(
  '/api/events',
  'events'
)

mountRoute(
  '/api/heritage',
  'heritage'
)

mountRoute(
  '/api/admins',
  'admins'
)

mountRoute(
  '/api/contact',
  'contact'
)

mountRoute(
  '/api/profile',
  'profile'
)

mountRoute(
  '/api/upload',
  'upload'
)

mountRoute(
  '/api/settings',
  'settings'
)

mountRoute(
  '/api/partners',
  'partners'
)

mountRoute(
  '/api/hero',
  'hero'
)

mountRoute(
  '/api/gallery',
  'gallery'
)

/*
 * API route not found.
 */
app.use(
  '/api',
  (req, res) => {
    const isEnglish =
      String(
        req.headers[
          'accept-language'
        ] || ''
      )
        .toLowerCase()
        .startsWith('en')

    return res
      .status(404)
      .json({
        error:
          isEnglish
            ? 'API route not found'
            : 'مسار API غير موجود',

        path:
          req.originalUrl,
      })
  }
)

/*
 * Global error handler.
 *
 * It returns clear messages for:
 * - CORS rejection
 * - invalid JSON
 * - oversized JSON requests
 * - unexpected server errors
 */
app.use(
  (
    error,
    req,
    res,
    _next
  ) => {
    const isEnglish =
      String(
        req.headers[
          'accept-language'
        ] || ''
      )
        .toLowerCase()
        .startsWith('en')

    if (
      error?.message ===
      'CORS_BLOCKED'
    ) {
      return res
        .status(403)
        .json({
          error:
            isEnglish
              ? 'This website origin is not allowed to access the API.'
              : 'عنوان الموقع غير مسموح له بالوصول إلى API.',

          origin:
            error.origin ||
            req.headers.origin ||
            null,
        })
    }

    if (
      error?.type ===
      'entity.too.large'
    ) {
      return res
        .status(413)
        .json({
          error:
            isEnglish
              ? 'The request body is too large.'
              : 'حجم بيانات الطلب أكبر من الحد المسموح.',
        })
    }

    if (
      error instanceof
        SyntaxError &&
      error.status === 400 &&
      'body' in error
    ) {
      return res
        .status(400)
        .json({
          error:
            isEnglish
              ? 'The request contains invalid JSON.'
              : 'بيانات JSON المرسلة غير صحيحة.',
        })
    }

    console.error(
      '❌ Unhandled server error:',
      error
    )

    return res
      .status(
        Number(error?.status) ||
        500
      )
      .json({
        error:
          isEnglish
            ? 'An internal server error occurred.'
            : 'حدث خطأ داخلي في الخادم.',
      })
  }
)

let server = null

async function startServer() {
  server =
    app.listen(
      PORT,
      async () => {
        console.log(
          `🚀 Server running on port ${PORT}`
        )

        console.log(
          '🌍 Allowed client origins:',
          allowedOrigins
        )

        try {
          await db.query(
            'SELECT 1'
          )

          console.log(
            '✅ MySQL connected'
          )
        } catch (error) {
          console.error(
            '❌ MySQL connection failed:',
            error.message
          )
        }
      }
    )

  return server
}

/*
 * Graceful shutdown prevents active requests
 * from being terminated abruptly during deployment.
 */
function shutdown(
  signal
) {
  console.log(
    `🛑 Received ${signal}. Shutting down...`
  )

  if (!server) {
    process.exit(0)
    return
  }

  server.close(() => {
    console.log(
      '✅ HTTP server closed'
    )

    process.exit(0)
  })

  setTimeout(() => {
    console.error(
      '❌ Forced shutdown after timeout'
    )

    process.exit(1)
  }, 10000).unref()
}

process.once(
  'SIGTERM',
  () =>
    shutdown('SIGTERM')
)

process.once(
  'SIGINT',
  () =>
    shutdown('SIGINT')
)

/*
 * This allows the app to be imported in tests
 * without automatically opening a network port.
 */
if (
  require.main === module
) {
  startServer()
}

module.exports = app
