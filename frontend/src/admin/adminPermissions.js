// frontend/src/admin/adminPermissions.js
export const ROLES = {
  SUPER: 'super_admin',
  ADMIN: 'admin',
}

export const PERMISSIONS = {
  [ROLES.SUPER]: {
    label: 'Super Admin',
    sidebar: [
      '/admin', '/admin/news', '/admin/events', '/admin/heritage', '/admin/partners',
      '/admin/hero', '/admin/settings', '/admin/messages', '/admin/admins', '/admin/profile'
    ],
    cards: ['news','events','heritage','partners','hero','messages','admins'],
    quickActions: ['/admin/news','/admin/events','/admin/heritage','/admin/partners','/admin/hero','/admin/settings','/admin/admins'],
    apisAllowed: ['/news/all','/events/all','/admins','/contact','/heritage/all','/partners/all','/hero/all','/settings'],
  },
  [ROLES.ADMIN]: {
    label: 'Admin',
    sidebar: ['/admin','/admin/news','/admin/events','/admin/profile'],
    cards: ['news','events'],
    quickActions: ['/admin/news','/admin/events'],
    apisAllowed: ['/news/all','/events/all'],
  }
}

export function canAccessPath(role, path) {
  const p = PERMISSIONS[role]
  if (!p) return false
  // exact match or allow /admin (root) and subpaths starting with allowed prefix
  return p.sidebar.includes(path)
}

export function allowedCardsForRole(role) {
  return (PERMISSIONS[role]?.cards) || []
}

export function allowedQuickActions(role) {
  return (PERMISSIONS[role]?.quickActions) || []
}

export function apisAllowedForRole(role) {
  return (PERMISSIONS[role]?.apisAllowed) || []
}
