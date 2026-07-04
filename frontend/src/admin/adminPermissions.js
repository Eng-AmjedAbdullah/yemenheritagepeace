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
      viewSettings: true,
      viewMessages: true,
      viewAdmins: true,
      viewProfile: true,
      manageAdmins: true,
      manageSettings: true,
      manageMessages: true,
    },
    apis: [
      'GET:/news/all',
      'GET:/events/all',
      'GET:/admins',
      'GET:/contact',
      'GET:/heritage/all',
      'GET:/partners/all',
      'GET:/hero/all',
      'POST:/news',
      'PUT:/news',
      'DELETE:/news',
      'POST:/events',
      'PUT:/events',
      'DELETE:/events',
      'POST:/heritage',
      'PUT:/heritage',
      'DELETE:/heritage',
      'POST:/partners',
      'PUT:/partners',
      'DELETE:/partners',
      'POST:/hero',
      'PUT:/hero',
      'DELETE:/hero',
      'PUT:/settings',
      'DELETE:/admins',
      'POST:/admins',
      'PUT:/admins',
    ],
  },
  [ADMIN_ROLES.ADMIN]: {
    pages: [
      '/admin',
      '/admin/dashboard',
      '/admin/news',
      '/admin/events',
      '/admin/profile',
    ],
    features: {
      viewDashboard: true,
      viewNews: true,
      viewEvents: true,
      viewHeritage: false,
      viewPartners: false,
      viewHero: false,
      viewSettings: false,
      viewMessages: false,
      viewAdmins: false,
      viewProfile: true,
      manageAdmins: false,
      manageSettings: false,
      manageMessages: false,
    },
    apis: [
      'GET:/news/all',
      'GET:/events/all',
      'POST:/news',
      'PUT:/news',
      'DELETE:/news',
      'POST:/events',
      'PUT:/events',
      'DELETE:/events',
    ],
  },
}

/**
 * Check if role has access to page
 */
export const canAccessPage = (role, page) => {
  const rolePerms = PERMISSIONS[role]
  if (!rolePerms) return false
  return rolePerms.pages.includes(page)
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
 * Check if role can perform API action
 */
export const canCallAPI = (role, method, endpoint) => {
  const rolePerms = PERMISSIONS[role]
  if (!rolePerms) return false
  const action = `${method}:${endpoint}`
  return rolePerms.apis.includes(action)
}

/**
 * Get allowed pages for role (for sidebar)
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
      value: stats.news,
      icon: 'Newspaper',
      color: 'bg-blue-500',
      href: '/admin/news',
      featureKey: 'viewNews',
    },
    {
      label: t.events,
      value: stats.events,
      icon: 'Calendar',
      color: 'bg-green-500',
      href: '/admin/events',
      featureKey: 'viewEvents',
    },
    {
      label: t.heritageLife,
      value: stats.heritage,
      icon: 'Mountain',
      color: 'bg-amber-500',
      href: '/admin/heritage',
      featureKey: 'viewHeritage',
    },
    {
      label: t.partners,
      value: stats.partners,
      icon: 'Handshake',
      color: 'bg-sky-500',
      href: '/admin/partners',
      featureKey: 'viewPartners',
    },
    {
      label: t.heroSlides,
      value: stats.hero,
      icon: 'Images',
      color: 'bg-teal-500',
      href: '/admin/hero',
      featureKey: 'viewHero',
    },
    {
      label: t.messages,
      value: stats.messages,
      icon: 'MessageSquare',
      color: 'bg-primary',
      href: '/admin/messages',
      badge: stats.unreadMessages,
      featureKey: 'viewMessages',
    },
    {
      label: t.admins,
      value: stats.admins,
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
  canCallAPI,
  getAllowedPages,
  getAllowedFeatures,
  getSidebarItems,
  getDashboardCards,
  getQuickActions,
}
