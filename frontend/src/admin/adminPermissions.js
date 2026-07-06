/**
 * Centralized Admin Permission System
 * Single source of truth for role-based access control
 */

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
}

/**
 * Permission map: role -> accessible pages and features
 */
export const PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: {
    pages: [
      '/admin',
      '/admin/dashboard',
      '/admin/news',
      '/admin/events',
      '/admin/heritage',
      '/admin/partners',
      '/admin/hero',
      '/admin/gallery',
      '/admin/settings',
      '/admin/messages',
      '/admin/admins',
      '/admin/profile',
    ],
    features: {
      viewDashboard: true,
      viewNews: true,
      viewEvents: true,
      viewHeritage: true,
      viewPartners: true,
      viewHero: true,
      viewGallery: true,
      viewSettings: true,
      viewMessages: true,
      viewAdmins: true,
      viewProfile: true,

      manageAdmins: true,
      manageSettings: true,
      manageMessages: true,
      manageGallery: true,
    },
  },

  [ADMIN_ROLES.ADMIN]: {
    pages: [
      '/admin',
      '/admin/dashboard',
      '/admin/news',
      '/admin/events',
      '/admin/gallery',
      '/admin/profile',
    ],
    features: {
      viewDashboard: true,
      viewNews: true,
      viewEvents: true,
      viewHeritage: false,
      viewPartners: false,
      viewHero: false,
      viewGallery: true,
      viewSettings: false,
      viewMessages: false,
      viewAdmins: false,
      viewProfile: true,

      manageAdmins: false,
      manageSettings: false,
      manageMessages: false,
      manageGallery: true,
    },
  },
}

/**
 * Check if role has access to page
 */
export const canAccessPage = (role, page) => {
  const rolePerms = PERMISSIONS[role]
  if (!rolePerms) return false

  if (rolePerms.pages.includes(page)) return true

  return rolePerms.pages.some((allowedPage) => {
    if (allowedPage === '/admin') return false
    return page.startsWith(`${allowedPage}/`)
  })
}

/**
 * Check if role has feature access
 */
export const hasFeature = (role, feature) => {
  const rolePerms = PERMISSIONS[role]
  if (!rolePerms) return false
  return rolePerms.features[feature] === true
}

/**
 * Get allowed pages for role
 */
export const getAllowedPages = (role) => {
  const rolePerms = PERMISSIONS[role]
  if (!rolePerms) return []
  return rolePerms.pages
}

/**
 * Get allowed features for role
 */
export const getAllowedFeatures = (role) => {
  const rolePerms = PERMISSIONS[role]
  if (!rolePerms) return {}
  return rolePerms.features
}

/**
 * Sidebar navigation items filtered by role
 */
export const getSidebarItems = (role, t) => {
  const features = getAllowedFeatures(role)

  const allItems = [
    {
      key: 'dashboard',
      href: '/admin',
      label: t.dashboard,
      featureKey: 'viewDashboard',
    },
    {
      key: 'news',
      href: '/admin/news',
      label: t.news,
      featureKey: 'viewNews',
    },
    {
      key: 'events',
      href: '/admin/events',
      label: t.events,
      featureKey: 'viewEvents',
    },
    {
      key: 'heritage',
      href: '/admin/heritage',
      label: t.heritage,
      featureKey: 'viewHeritage',
    },
    {
      key: 'partners',
      href: '/admin/partners',
      label: t.partners,
      featureKey: 'viewPartners',
    },
    {
      key: 'hero',
      href: '/admin/hero',
      label: t.heroSlides,
      featureKey: 'viewHero',
    },
    {
      key: 'gallery',
      href: '/admin/gallery',
      label:
        t.manageGallery ||
        t.gallery ||
        (t.lang === 'en' ? 'Gallery' : 'المعرض'),
      featureKey: 'viewGallery',
    },
    {
      key: 'settings',
      href: '/admin/settings',
      label: t.siteSettings,
      featureKey: 'viewSettings',
    },
    {
      key: 'messages',
      href: '/admin/messages',
      label: t.messages,
      featureKey: 'viewMessages',
    },
    {
      key: 'admins',
      href: '/admin/admins',
      label: t.admins,
      featureKey: 'viewAdmins',
    },
    {
      key: 'profile',
      href: '/admin/profile',
      label: t.profile,
      featureKey: 'viewProfile',
    },
  ]

  return allItems.filter((item) => features[item.featureKey] === true)
}

/**
 * Dashboard cards filtered by role
 */
export const getDashboardCards = (role, stats, t) => {
  const features = getAllowedFeatures(role)

  const allCards = [
    {
      label: t.news,
      value: stats.news || 0,
      icon: 'Newspaper',
      color: 'bg-blue-500',
      href: '/admin/news',
      featureKey: 'viewNews',
    },
    {
      label: t.events,
      value: stats.events || 0,
      icon: 'Calendar',
      color: 'bg-green-500',
      href: '/admin/events',
      featureKey: 'viewEvents',
    },
    {
      label: t.heritageLife,
      value: stats.heritage || 0,
      icon: 'Mountain',
      color: 'bg-amber-500',
      href: '/admin/heritage',
      featureKey: 'viewHeritage',
    },
    {
      label: t.partners,
      value: stats.partners || 0,
      icon: 'Handshake',
      color: 'bg-sky-500',
      href: '/admin/partners',
      featureKey: 'viewPartners',
    },
    {
      label:
        t.gallery ||
        t.manageGallery ||
        (t.lang === 'en' ? 'Gallery' : 'المعرض'),
      value: stats.gallery || 0,
      icon: 'Images',
      color: 'bg-teal-500',
      href: '/admin/gallery',
      featureKey: 'viewGallery',
    },
    {
      label: t.messages,
      value: stats.messages || 0,
      icon: 'MessageSquare',
      color: 'bg-primary',
      href: '/admin/messages',
      badge: stats.unreadMessages || 0,
      featureKey: 'viewMessages',
    },
    {
      label: t.admins,
      value: stats.admins || 0,
      icon: 'Users',
      color: 'bg-slate-500',
      href: '/admin/admins',
      featureKey: 'viewAdmins',
    },
  ]

  return allCards.filter((card) => features[card.featureKey] === true)
}

/**
 * Quick action buttons filtered by role
 */
export const getQuickActions = (role, t) => {
  const features = getAllowedFeatures(role)

  const allActions = [
    {
      label: t.addNews,
      icon: 'Newspaper',
      href: '/admin/news',
      featureKey: 'viewNews',
    },
    {
      label: t.addEvent,
      icon: 'Calendar',
      href: '/admin/events',
      featureKey: 'viewEvents',
    },
    {
      label: t.addHeritage,
      icon: 'Mountain',
      href: '/admin/heritage',
      featureKey: 'viewHeritage',
    },
    {
      label: t.addPartner,
      icon: 'Handshake',
      href: '/admin/partners',
      featureKey: 'viewPartners',
    },
    {
      label: t.addSlide,
      icon: 'Images',
      href: '/admin/hero',
      featureKey: 'viewHero',
    },
    {
      label:
        t.manageGallery ||
        t.gallery ||
        (t.lang === 'en' ? 'Manage Gallery' : 'إدارة المعرض'),
      icon: 'Images',
      href: '/admin/gallery',
      featureKey: 'viewGallery',
    },
    {
      label: t.siteSettings,
      icon: 'Settings',
      href: '/admin/settings',
      featureKey: 'viewSettings',
    },
    {
      label: t.addAdmin,
      icon: 'Users',
      href: '/admin/admins',
      featureKey: 'viewAdmins',
    },
    {
      label: t.viewSite,
      icon: 'Eye',
      href: '/',
      external: true,
    },
  ]

  return allActions.filter(
    (action) => !action.featureKey || features[action.featureKey] === true
  )
}

export default {
  ADMIN_ROLES,
  PERMISSIONS,
  canAccessPage,
  hasFeature,
  getAllowedPages,
  getAllowedFeatures,
  getSidebarItems,
  getDashboardCards,
  getQuickActions,
}
