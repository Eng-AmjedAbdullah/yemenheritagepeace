import React, { useEffect, useState, useCallback } from 'react'
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'

import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  Newspaper,
  Calendar,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Mountain,
  MessageSquare,
  Handshake,
  Images,
  Settings,
  Globe,
  AlertTriangle,
  Trash2,
  ShieldAlert,
} from 'lucide-react'
import { adminTranslations, AdminLangContext } from './adminI18n'
import api from '../lib/api'
import { PERMISSIONS, canAccessPath } from './adminPermissions'

export const ConfirmContext = React.createContext()

const confirmStyles = {
  danger: {
    icon: Trash2,
    iconClass: 'text-red-500 bg-red-50',
    buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
    defaultConfirmText: { ar: 'نعم، تابع', en: 'Yes, continue' },
  },
  logout: {
    icon: ShieldAlert,
    iconClass: 'text-amber-500 bg-amber-50',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    defaultConfirmText: { ar: 'تسجيل الخروج', en: 'Logout' },
  },
  primary: {
    icon: AlertTriangle,
    iconClass: 'text-primary bg-primary/10',
    buttonClass: 'bg-primary hover:bg-primary-dark text-white',
    defaultConfirmText: { ar: 'تأكيد', en: 'Confirm' },
  },
}

function ConfirmModal({ modal, close, isRtl }) {
  useEffect(() => {
    if (!modal.isOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [modal.isOpen, close])

  if (!modal.isOpen) return null

  const variant = confirmStyles[modal.variant] || confirmStyles.danger
  const Icon = variant.icon

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && close(false)}
    >
      <div className="modal-box max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${variant.iconClass}`}>
              <Icon size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-dark">{modal.title}</h3>
              {modal.message && <p className="mt-2 text-sm leading-6 text-gray-500">{modal.message}</p>}
            </div>
            <button
              onClick={() => close(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={isRtl ? 'إغلاق' : 'Close'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end p-6 bg-gray-50/70 rounded-b-2xl">
          <button onClick={() => close(false)} className="btn-outline justify-center min-w-[120px]">
            {modal.cancelText}
          </button>
          <button onClick={() => close(true)} className={`font-semibold py-3 px-6 rounded-lg transition-all duration-300 inline-flex items-center justify-center gap-2 min-w-[120px] ${variant.buttonClass}`}>
            {modal.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const [admin, setAdmin] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true))
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false))
  const [adminLang, setAdminLang] = useState(localStorage.getItem('admin_lang') || 'ar')
  const [unreadCount, setUnreadCount] = useState(0)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: '',
    cancelText: '',
    resolve: null,
  })
  const navigate = useNavigate()
  const location = useLocation()

  const t = adminTranslations[adminLang]
  const isRtl = adminLang === 'ar'

  const toggleAdminLang = () => {
    const newLang = adminLang === 'ar' ? 'en' : 'ar'
    setAdminLang(newLang)
    localStorage.setItem('admin_lang', newLang)
  }

  const closeConfirm = useCallback((result) => {
    setConfirmModal((prev) => {
      prev.resolve?.(result)
      return {
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        confirmText: '',
        cancelText: '',
        resolve: null,
      }
    })
  }, [])

  const requestConfirm = useCallback((titleOrOptions, maybeMessage) => {
    const options = typeof titleOrOptions === 'object'
      ? (titleOrOptions || {})
      : { title: titleOrOptions, message: maybeMessage }

    const variant = options.variant || 'danger'
    const variantConfig = confirmStyles[variant] || confirmStyles.danger

    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title: options.title || (isRtl ? 'تأكيد العملية' : 'Confirm action'),
        message: options.message || '',
        variant,
        confirmText: options.confirmText || variantConfig.defaultConfirmText[isRtl ? 'ar' : 'en'],
        cancelText: options.cancelText || (isRtl ? 'إلغاء' : 'Cancel'),
        resolve,
      })
    })
  }, [isRtl])

  const fetchUnread = useCallback(() => {
    // Only fetch unread if admin has permission to view messages
    if (!admin || !PERMISSIONS[admin.role]?.apisAllowed?.includes('/contact')) return
    api.get('/contact/unread-count').then(d => setUnreadCount(d?.count || 0)).catch(() => {})
  }, [admin])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Refresh admin from server on load using token
  useEffect(() => {
    const token = localStorage.getItem('yhpo_token')
    if (!token) {
      localStorage.removeItem('yhpo_admin')
      navigate('/admin/login')
      return
    }

    // try to use stored admin first for immediate UI, but always refresh
    const stored = localStorage.getItem('yhpo_admin')
    if (stored) setAdmin(JSON.parse(stored))

    api.get('/auth/me')
      .then(data => {
        const refreshed = {
          id: data.id,
          name: data.name?.trim(),
          email: (data.email || '').toLowerCase().trim(),
          role: data.role,
          is_active: data.is_active,
        }
        setAdmin(refreshed)
        localStorage.setItem('yhpo_admin', JSON.stringify(refreshed))
        fetchUnread()
      })
      .catch(() => {
        localStorage.removeItem('yhpo_token')
        localStorage.removeItem('yhpo_admin')
        navigate('/admin/login')
      })

    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [navigate, fetchUnread])

  useEffect(() => {
    if (location.pathname === '/admin/messages') {
      setTimeout(fetchUnread, 1000)
    }
  }, [location.pathname, fetchUnread])

  const handleLogout = async () => {
    const confirmed = await requestConfirm({
      title: isRtl ? 'تأكيد تسجيل الخروج' : 'Confirm logout',
      message: isRtl
        ? 'هل تريد تسجيل الخروج من لوحة الإدارة الآن؟'
        : 'Do you want to log out of the admin dashboard now?',
      variant: 'logout',
    })

    if (!confirmed) return

    localStorage.removeItem('yhpo_token')
    localStorage.removeItem('yhpo_admin')
    toast.success(isRtl ? 'تم تسجيل الخروج' : 'Logged out successfully')
    navigate('/admin/login')
  }

  const role = admin?.role

  const allNavItems = [
    { href: '/admin', icon: LayoutDashboard, label: t.dashboard },
    { href: '/admin/news', icon: Newspaper, label: t.news },
    { href: '/admin/events', icon: Calendar, label: t.events },
    { href: '/admin/profile', icon: User, label: t.profile },
    { href: '/admin/heritage', icon: Mountain, label: t.heritage },
    { href: '/admin/partners', icon: Handshake, label: t.partners },
    { href: '/admin/hero', icon: Images, label: t.heroSlides },
    { href: '/admin/settings', icon: Settings, label: t.siteSettings },
    { href: '/admin/messages', icon: MessageSquare, label: t.messages, badge: unreadCount },
    { href: '/admin/admins', icon: Users, label: t.admins },
  ]

  const navItems = role && PERMISSIONS[role] ? allNavItems.filter(i => PERMISSIONS[role].sidebar.includes(i.href)) : []

  // protect manual route entry
  useEffect(() => {
    if (!admin) return
    const path = location.pathname
    if (path.startsWith('/admin') && !canAccessPath(admin.role, path)) {
      navigate('/admin', { replace: true })
    }
  }, [admin, location.pathname, navigate])

  const contextValue = { t, lang: adminLang, isRtl, toggleAdminLang, fetchUnread, requestConfirm, admin, setAdmin }

  return (
    <AdminLangContext.Provider value={contextValue}>
      <ConfirmContext.Provider value={contextValue}>
        <div className={`min-h-screen bg-gray-50 ${isRtl ? 'font-ar' : 'font-en'}`} dir={isRtl ? 'rtl' : 'ltr'}>
          <ConfirmModal modal={confirmModal} close={closeConfirm} isRtl={isRtl} />

          <aside className={`fixed top-0 h-full bg-gradient-to-b from-primary via-primary-dark to-primary/80 text-white border-white/10 z-40 transition-all duration-300 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} ${isMobile ? 'w-72' : sidebarOpen ? 'w-64' : 'w-16'}`}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              {sidebarOpen && <div>
                <div className="text-white font-bold text-sm">{t.adminPanel}</div>
                <div className="text-primary text-xs">{t.yemenHeritage}</div>
              </div>}
              <button onClick={() => setSidebarOpen(o => !o)} className="text-white/80 hover:text-white p-1">
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

            <nav className="p-3 space-y-1 h-[calc(100vh-200px)] overflow-y-auto">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${location.pathname === item.href ? 'bg-white text-primary' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  {item.badge > 0 && (
                    <span className={`${sidebarOpen ? 'ms-auto' : 'absolute -top-1 -end-1'} bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px]`}>{item.badge > 99 ? '99+' : item.badge}</span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
              <button onClick={toggleAdminLang} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors mb-2">
                <Globe size={18} />
                {sidebarOpen && <span className="text-sm font-medium">{t.switchLang}</span>}
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-200 hover:bg-red-500/10 transition-colors">
                <LogOut size={18} />
                {sidebarOpen && <span className="text-sm font-medium">{t.logout}</span>}
              </button>
            </div>
          </aside>

          {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`transition-all duration-300 min-h-screen ${isMobile ? 'ml-0 mr-0' : sidebarOpen ? (isRtl ? 'mr-64' : 'ml-64') : (isRtl ? 'mr-16' : 'ml-16')}`}>
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <button
                    onClick={() => setSidebarOpen((open) => !open)}
                    className="text-gray-600 hover:text-primary p-2 rounded-lg transition-colors"
                    aria-label={isRtl ? 'قائمة التنقل' : 'Toggle sidebar'}
                  >
                    {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                )}
                <div className="text-sm text-gray-500">
                  {navItems.find(n => n.href === location.pathname)?.label || t.adminPanel}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {admin?.role === 'super_admin' && (
                  <span className="text-xs bg-white text-primary px-2 py-0.5 rounded-full font-medium">
                    {isRtl ? 'مشرف رئيسي' : 'Super Admin'}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span>{admin?.name || admin?.email || (isRtl ? 'مشرف' : 'Admin')}</span>
                </div>
              </div>
            </div>
            <div className="p-4 md:p-6"><Outlet /></div>
          </div>
        </div>
      </ConfirmContext.Provider>
    </AdminLangContext.Provider>
  )
}
