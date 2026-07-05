import React, { useCallback, useEffect, useState } from 'react'
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

const toastTheme = {
  success: {
    duration: 3000,
    style: {
      background: '#166534',
      color: '#ffffff',
      border: '1px solid #15803d',
      borderRadius: '12px',
      fontSize: '14px',
      padding: '14px 18px',
      boxShadow: '0 8px 24px rgba(22, 101, 52, 0.25)',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#166534',
    },
  },
  error: {
    duration: 4000,
    style: {
      background: '#7f1d1d',
      color: '#ffffff',
      border: '1px solid #991b1b',
      borderRadius: '12px',
      fontSize: '14px',
      padding: '14px 18px',
      boxShadow: '0 8px 24px rgba(127, 29, 29, 0.25)',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#7f1d1d',
    },
  },
}

const confirmStyles = {
  danger: {
    icon: Trash2,
    iconClass: 'text-red-600 bg-red-50',
    buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    defaultConfirmText: { ar: 'نعم، تابع', en: 'Yes, continue' },
  },
  logout: {
    icon: ShieldAlert,
    iconClass: 'text-red-600 bg-red-50',
    buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    defaultConfirmText: { ar: 'تسجيل الخروج', en: 'Logout' },
  },
  primary: {
    icon: AlertTriangle,
    iconClass: 'text-primary bg-primary/10',
    buttonClass: 'bg-primary hover:bg-primary-dark text-white',
    defaultConfirmText: { ar: 'تأكيد', en: 'Confirm' },
  },
}

function clearAdminSession() {
  localStorage.removeItem('yhpo_token')
  localStorage.removeItem('yhpo_admin')
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
      onClick={(event) => event.target === event.currentTarget && close(false)}
    >
      <div className="modal-box max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${variant.iconClass}`}
            >
              <Icon size={22} />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-dark">{modal.title}</h3>

              {modal.message && (
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {modal.message}
                </p>
              )}
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
          <button
            onClick={() => close(false)}
            className="btn-outline justify-center min-w-[120px]"
          >
            {modal.cancelText}
          </button>

          <button
            onClick={() => close(true)}
            className={`font-semibold py-3 px-6 rounded-lg transition-all duration-300 inline-flex items-center justify-center gap-2 min-w-[120px] ${variant.buttonClass}`}
          >
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
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  )
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )
  const [adminLang, setAdminLang] = useState(
    localStorage.getItem('admin_lang') || 'ar'
  )
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
  const isSuperAdmin = admin?.role === 'super_admin'

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

  const requestConfirm = useCallback(
    (titleOrOptions, maybeMessage) => {
      const options =
        typeof titleOrOptions === 'object'
          ? titleOrOptions || {}
          : { title: titleOrOptions, message: maybeMessage }

      const variant = options.variant || 'danger'
      const variantConfig = confirmStyles[variant] || confirmStyles.danger

      return new Promise((resolve) => {
        setConfirmModal({
          isOpen: true,
          title: options.title || (isRtl ? 'تأكيد العملية' : 'Confirm action'),
          message: options.message || '',
          variant,
          confirmText:
            options.confirmText ||
            variantConfig.defaultConfirmText[isRtl ? 'ar' : 'en'],
          cancelText: options.cancelText || (isRtl ? 'إلغاء' : 'Cancel'),
          resolve,
        })
      })
    },
    [isRtl]
  )

  const fetchUnread = useCallback((role) => {
    if (role !== 'super_admin') {
      setUnreadCount(0)
      return Promise.resolve()
    }

    return api
      .get('/contact/unread-count')
      .then((data) => setUnreadCount(data?.count || 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    let interval = null

    const refreshAdmin = async () => {
      setLoading(true)

      const token = localStorage.getItem('yhpo_token')

      if (!token) {
        clearAdminSession()
        navigate('/admin/login', { replace: true })
        return
      }

      try {
        const freshAdmin = await api.get('/auth/me')

        if (cancelled) return

        setAdmin(freshAdmin)
        localStorage.setItem('yhpo_admin', JSON.stringify(freshAdmin))

        if (freshAdmin.role === 'super_admin') {
          fetchUnread(freshAdmin.role)
          interval = setInterval(() => fetchUnread(freshAdmin.role), 30000)
        } else {
          setUnreadCount(0)
        }
      } catch (error) {
        if (cancelled) return

        console.error('Failed to refresh admin:', error)
        clearAdminSession()

        toast.error(
          isRtl ? 'انتهت الجلسة، سجل الدخول مرة أخرى' : 'Session expired, please login again',
          toastTheme.error
        )

        navigate('/admin/login', { replace: true })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    refreshAdmin()

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [navigate, fetchUnread, isRtl])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (location.pathname === '/admin/messages') {
      fetchUnread(admin?.role)
    }
  }, [location.pathname, admin?.role, fetchUnread])

  const handleLogout = async () => {
    const confirmed = await requestConfirm({
      title: isRtl ? 'تأكيد تسجيل الخروج' : 'Confirm logout',
      message: isRtl
        ? 'هل تريد تسجيل الخروج من لوحة الإدارة؟'
        : 'Do you want to log out of the admin dashboard?',
      variant: 'logout',
      confirmText: isRtl ? 'تسجيل الخروج' : 'Logout',
      cancelText: isRtl ? 'إلغاء' : 'Cancel',
    })

    if (!confirmed) return

    clearAdminSession()

    toast.success(
      isRtl ? 'تم تسجيل الخروج' : 'Logged out successfully',
      toastTheme.success
    )

    navigate('/admin/login', { replace: true })
  }

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-gray-50 flex items-center justify-center ${
          isRtl ? 'font-ar' : 'font-en'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-gray-600">
            {isRtl ? 'جارٍ التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />
  }

  if (!canAccessPage(admin.role, location.pathname)) {
    return <Navigate to="/admin" replace />
  }

  const navItems = getSidebarItems(admin.role, t)

  const iconMap = {
    dashboard: LayoutDashboard,
    news: Newspaper,
    events: Calendar,
    admins: Users,
    profile: User,
    heritage: Mountain,
    messages: MessageSquare,
    partners: Handshake,
    hero: Images,
    settings: Settings,
  }

  const contextValue = {
    t,
    lang: adminLang,
    isRtl,
    admin,
    isSuperAdmin,
    toggleAdminLang,
    fetchUnread,
    requestConfirm,
  }

  const isActiveLink = (href) => {
    if (href === '/admin') return location.pathname === '/admin'
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  return (
    <AdminLangContext.Provider value={contextValue}>
      <ConfirmContext.Provider value={contextValue}>
        <div
          className={`min-h-screen bg-gray-50 ${isRtl ? 'font-ar' : 'font-en'}`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <ConfirmModal modal={confirmModal} close={closeConfirm} isRtl={isRtl} />

          <aside
            className={`fixed top-0 h-full bg-gradient-to-b from-primary-dark via-primary to-primary-light border-white/15 z-40 transition-all duration-300 shadow-2xl ${
              isRtl ? 'right-0 border-l' : 'left-0 border-r'
            } ${isMobile ? 'w-72' : sidebarOpen ? 'w-64' : 'w-16'} ${
              isMobile && !sidebarOpen
                ? isRtl
                  ? 'translate-x-full'
                  : '-translate-x-full'
                : 'translate-x-0'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/15">
              {sidebarOpen && (
                <div>
                  <div className="text-white font-bold text-sm">
                    {t.adminPanel}
                  </div>
                  <div className="text-white/75 text-xs">
                    {t.yemenHeritage}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSidebarOpen((open) => !open)}
                className="text-white/70 hover:text-white p-1 transition-colors"
                aria-label={isRtl ? 'طي القائمة' : 'Toggle sidebar'}
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

            <nav className="p-3 space-y-1 h-[calc(100vh-215px)] overflow-y-auto">
              {navItems.map((item) => {
                const Icon = iconMap[item.key] || LayoutDashboard
                const active = isActiveLink(item.href)

                return (
                  <Link
                    key={item.key}
                    to={item.href}
                    onClick={() => isMobile && setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                      active
                        ? 'bg-white text-primary-dark shadow-sm'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />

                    {sidebarOpen && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}

                    {item.key === 'messages' && unreadCount > 0 && (
                      <span
                        className={`${
                          sidebarOpen ? 'ms-auto' : 'absolute -top-1 -end-1'
                        } bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold`}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/15 bg-primary-dark/25 backdrop-blur-sm">
              <button
                onClick={toggleAdminLang}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/85 hover:bg-white/10 hover:text-white transition-colors mb-2"
              >
                <Globe size={18} />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{t.switchLang}</span>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-xl border border-red-100 bg-white/95 px-3 py-2.5 text-red-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <LogOut size={18} className="text-red-600" />
                {sidebarOpen && (
                  <span className="text-sm font-bold">{t.logout}</span>
                )}
              </button>
            </div>
          </aside>

          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main
            className={`transition-all duration-300 min-h-screen ${
              isMobile
                ? 'ml-0 mr-0'
                : sidebarOpen
                  ? isRtl
                    ? 'mr-64'
                    : 'ml-64'
                  : isRtl
                    ? 'mr-16'
                    : 'ml-16'
            }`}
          >
            <header className="sticky top-0 z-30 bg-gray-50/80 px-4 py-3 backdrop-blur">
              <div className="rounded-2xl border border-primary/10 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {isMobile && (
                      <button
                        onClick={() => setSidebarOpen((open) => !open)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/10 bg-white text-primary shadow-sm transition hover:border-primary hover:bg-primary/5"
                        aria-label={isRtl ? 'قائمة التنقل' : 'Toggle sidebar'}
                      >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                      </button>
                    )}

                    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-white shadow-sm sm:flex">
                      <img
                        src="/logo.png"
                        alt="Yemen Heritage"
                        className="h-9 w-auto"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <h1 className="truncate text-sm font-bold text-dark sm:text-base">
                        منظمة تراث اليمن لأجل السلام
                      </h1>
                      <p className="mt-0.5 truncate text-xs font-semibold text-primary sm:text-sm">
                        Yemen Heritage for Peace Organization
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleAdminLang}
                      className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-dark shadow-sm transition hover:border-primary hover:text-primary md:inline-flex"
                    >
                      <Globe size={16} className="text-primary" />
                      {t.switchLang}
                    </button>

                    <div className="flex min-w-0 items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-2.5 py-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                        <User size={16} />
                      </div>

                      <div className="hidden min-w-0 sm:block">
                        <p className="truncate text-sm font-semibold text-dark">
                          {admin?.name ||
                            admin?.email ||
                            (isRtl ? 'مشرف' : 'Admin')}
                        </p>

                        <p className="text-xs text-gray-500">
                          {admin.role === 'super_admin'
                            ? isRtl
                              ? 'مشرف رئيسي'
                              : 'Super Admin'
                            : isRtl
                              ? 'مشرف'
                              : 'Admin'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </ConfirmContext.Provider>
    </AdminLangContext.Provider>
  )
}
