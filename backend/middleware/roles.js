// backend/middleware/roles.js

function requireRole(role) {
  return function (req, res, next) {
    if (!req.admin) return res.status(401).json({ error: 'غير مصرح' })
    if (req.admin.role !== role) return res.status(403).json({ error: 'ليس لديك الصلاحية' })
    next()
  }
}

function requireAnyRole(...roles) {
  return function (req, res, next) {
    if (!req.admin) return res.status(401).json({ error: 'غير مصرح' })
    if (!roles.includes(req.admin.role)) return res.status(403).json({ error: 'ليس لديك الصلاحية' })
    next()
  }
}

module.exports = { requireRole, requireAnyRole }
