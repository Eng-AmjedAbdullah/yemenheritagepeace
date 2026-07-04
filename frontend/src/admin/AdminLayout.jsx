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
import { getSidebarItems, canAccessPage } from './adminPermissions'
import api from '../lib/api'

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
  const [loading, setLoading] = useState(true)
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
    api.get('/contact/unread-count').then(d => setUnreadCount(d?.count || 0)).catch(() => {})
  }, [])

  // Refresh admin from backend on mount
  useEffect(() => {
    const refreshAdmin = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('yhpo_token')
        if (!token) {
          localStorage.removeItem('yhpo_admin')
          navigate('/admin/login')
          return
        }

        // Refresh admin data from backend
        const response = await api.get('/auth/me')
        setAdmin(response.admin)
        localStorage.setItem('yhpo_admin', JSON.stringify(response.admin))
        fetchUnread()
      } catch (error) {
        console.error('Failed to refresh admin:', error)
        localStorage.removeItem('yhpo_token')
        localStorage.removeItem('yhpo_admin')
        navigate('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    refreshAdmin()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [navigate, fetchUnread])

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
    toast.success(isRtl ? 'تم تسجيل الخروج' : 'Logged out successfully', {
      style: {
        background: '#ffffff',
        color: '#0d7a91',
        border: '2px solid #18a2be',
        borderRadius: '12px',
      },
    })
    navigate('/admin/login')
  }

  // Check if current path is allowed for this role
  if (admin && !canAccessPage(admin.role, location.pathname)) {
    return <Navigate to="/admin" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">{isRtl ? 'جارٍ التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />
  }

  const navItems = getSidebarItems(admin.role, t)
  const contextValue = { t, lang: adminLang, isRtl, toggleAdminLang, fetchUnread, requestConfirm }

  return (
    <AdminLangContext.Provider value={contextValue}>
      <ConfirmContext.Provider value={contextValue}>
        <div className={`min-h-screen bg-gray-50 ${isRtl ? 'font-ar' : 'font-en'}`} dir={isRtl ? 'rtl' : 'ltr'}>
          <ConfirmModal modal={confirmModal} close={closeConfirm} isRtl={isRtl} />

          {/* Sidebar */}
          <aside className={`fixed top-0 h-full bg-gradient-to-b from-primary to-primary-dark border-primary/20 z-40 transition-all duration-300 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} ${isMobile ? 'w-72' : sidebarOpen ? 'w-64' : 'w-16'}`}>
            {/* Logo Section */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              {sidebarOpen && <div>
                <div className="text-white font-bold text-sm">{t.adminPanel}</div>
                <div className="text-white/80 text-xs">{t.yemenHeritage}</div>
              </div>}
              <button onClick={() => setSidebarOpen(o => !o)} className="text-white/70 hover:text-white p-1 transition-colors">
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1 h-[calc(100vh-200px)] overflow-y-auto">
              {navItems.map(item => {
                const Icon = {
                  LayoutDashboard,
                  Newspaper,
                  Calendar,
                  Users,
                  User,
                  Mountain,
                  MessageSquare,
                  Handshake,
                  Images,
                  Settings,
                }[{
                  'dashboard': 'LayoutDashboard',
                  'news': 'Newspaper',
                  'events': 'Calendar',
                  'admins': 'Users',
                  'profile': 'User',
                  'heritage': 'Mountain',
                  'messages': 'MessageSquare',
                  'partners': 'Handshake',
                  'hero': 'Images',
                  'settings': 'Settings',
                }[item.key]] || LayoutDashboard

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                      location.pathname === item.href
                        ? 'bg-white text-primary shadow-lg'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                )
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-gradient-to-t from-primary-dark/50 to-transparent">
              <button onClick={toggleAdminLang} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 transition-colors mb-2">
                <Globe size={18} />
                {sidebarOpen && <span className="text-sm font-medium">{t.switchLang}</span>}
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-red-500/20 hover:text-red-300 transition-colors">
                <LogOut size={18} />
                {sidebarOpen && <span className="text-sm font-medium">{t.logout}</span>}
              </button>
            </div>
          </aside>

          {/* Mobile overlay */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className={`transition-all duration-300 min-h-screen ${isMobile ? 'ml-0 mr-0' : sidebarOpen ? (isRtl ? 'mr-64' : 'ml-64') : (isRtl ? 'mr-16' : 'ml-16')}`}>
            {/* Top Bar */}
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
                {admin.role === 'super_admin' && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {isRtl ? 'مشرف رئيسي' : 'Super Admin'}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User size={16} className="text-primary" />
                  </div>
                  <span>{admin?.name || admin?.email || (isRtl ? 'مشرف' : 'Admin')}</span>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="p-4 md:p-6"><Outlet /></div>
          </div>
        </div>
      </ConfirmContext.Provider>
    </AdminLangContext.Provider>
  )
}
