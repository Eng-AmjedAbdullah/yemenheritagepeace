import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Outlet,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from 'react-router-dom'

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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import {
  adminTranslations,
  AdminLangContext,
} from './adminI18n'

import {
  getSidebarItems,
  canAccessPage,
} from './adminPermissions'

import api from '../lib/api'

import {
  useGlobalLoading,
} from '../context/LoadingContext'

export const ConfirmContext = React.createContext()

const ADMIN_BRAND = '#18a2be'

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
      boxShadow:
        '0 8px 24px rgba(22, 101, 52, 0.25)',
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
      boxShadow:
        '0 8px 24px rgba(127, 29, 29, 0.25)',
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
    buttonClass:
      'bg-red-600 hover:bg-red-700 text-white',

    defaultConfirmText: {
      ar: 'نعم، تابع',
      en: 'Yes, continue',
    },
  },

  logout: {
    icon: ShieldAlert,
    iconClass: 'text-red-600 bg-red-50',
    buttonClass:
      'bg-red-600 hover:bg-red-700 text-white',

    defaultConfirmText: {
      ar: 'تسجيل الخروج',
      en: 'Logout',
    },
  },

  primary: {
    icon: AlertTriangle,
    iconClass:
      'text-primary bg-primary/10',
    buttonClass:
      'bg-primary hover:bg-primary-dark text-white',

    defaultConfirmText: {
      ar: 'تأكيد',
      en: 'Confirm',
    },
  },
}

function clearAdminSession() {
  localStorage.removeItem('yhpo_token')
  localStorage.removeItem('yhpo_admin')
}

function ConfirmModal({
  modal,
  close,
  isRtl,
}) {
  useEffect(() => {
    if (!modal.isOpen) {
      return undefined
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        close(false)
      }
    }

    document.addEventListener(
      'keydown',
      onKeyDown
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      document.removeEventListener(
        'keydown',
        onKeyDown
      )
    }
  }, [
    modal.isOpen,
    close,
  ])

  if (!modal.isOpen) {
    return null
  }

  const variant =
    confirmStyles[modal.variant] ||
    confirmStyles.danger

  const Icon = variant.icon

  return (
    <div
      className="modal-overlay confirm-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          close(false)
        }
      }}
    >
      <section
        className="confirm-modal-panel"
        dir={isRtl ? 'rtl' : 'ltr'}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${variant.iconClass}`}
            >
              <Icon size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h3
                id="confirm-modal-title"
                className="text-base font-bold leading-7 text-dark sm:text-lg"
              >
                {modal.title}
              </h3>

              {modal.message && (
                <p className="mt-1.5 text-sm leading-6 text-gray-500">
                  {modal.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                close(false)
              }
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label={
                isRtl
                  ? 'إغلاق'
                  : 'Close'
              }
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-gray-100 bg-gray-50/80 p-4">
          <button
            type="button"
            onClick={() =>
              close(false)
            }
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
          >
            {modal.cancelText}
          </button>

          <button
            type="button"
            onClick={() =>
              close(true)
            }
            className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold shadow-sm transition ${variant.buttonClass}`}
          >
            {modal.confirmText}
          </button>
        </div>
      </section>
    </div>
  )
}

export default function AdminLayout() {
  const [
    admin,
    setAdmin,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth >= 1024
      : true
  )

  const [
    isMobile,
    setIsMobile,
  ] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < 1024
      : false
  )

  const [
    adminLang,
    setAdminLang,
  ] = useState(
    localStorage.getItem(
      'admin_lang'
    ) || 'ar'
  )

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0)

  const [
    confirmModal,
    setConfirmModal,
  ] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: '',
    cancelText: '',
    resolve: null,
  })

  /*
   * Original sidebar scroll element.
   */
  const sidebarNavRef =
    useRef(null)

  /*
   * Additional scrollbar track.
   */
  const mirrorTrackRef =
    useRef(null)

  /*
   * Stores the current pointer drag
   * values without causing renders.
   */
  const sidebarDragRef =
    useRef({
      active: false,
      pointerId: null,
      startY: 0,
      startScrollTop: 0,
    })

  const [
    mirrorScrollbar,
    setMirrorScrollbar,
  ] = useState({
    visible: false,
    thumbHeight: 36,
    thumbTop: 0,
  })

  const navigate =
    useNavigate()

  const location =
    useLocation()

  const {
    startLoading,
    stopLoading,
  } = useGlobalLoading()

  const t =
    adminTranslations[adminLang]

  const isRtl =
    adminLang === 'ar'

  /*
   * The authentication effect should not run
   * again whenever the language changes.
   */
  const isRtlRef =
    useRef(isRtl)

  const isSuperAdmin =
    admin?.role ===
    'super_admin'

  useEffect(() => {
    isRtlRef.current = isRtl
  }, [isRtl])

  const toggleAdminLang = () => {
    const newLang =
      adminLang === 'ar'
        ? 'en'
        : 'ar'

    setAdminLang(newLang)

    localStorage.setItem(
      'admin_lang',
      newLang
    )
  }

  const closeConfirm =
    useCallback((result) => {
      setConfirmModal((previous) => {
        previous.resolve?.(result)

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

  const requestConfirm =
    useCallback(
      (
        titleOrOptions,
        maybeMessage
      ) => {
        const options =
          typeof titleOrOptions ===
          'object'
            ? titleOrOptions || {}
            : {
                title:
                  titleOrOptions,

                message:
                  maybeMessage,
              }

        const variant =
          options.variant ||
          'danger'

        const variantConfig =
          confirmStyles[variant] ||
          confirmStyles.danger

        return new Promise(
          (resolve) => {
            setConfirmModal({
              isOpen: true,

              title:
                options.title ||
                (
                  isRtl
                    ? 'تأكيد العملية'
                    : 'Confirm action'
                ),

              message:
                options.message ||
                '',

              variant,

              confirmText:
                options.confirmText ||
                variantConfig
                  .defaultConfirmText[
                  isRtl
                    ? 'ar'
                    : 'en'
                ],

              cancelText:
                options.cancelText ||
                (
                  isRtl
                    ? 'إلغاء'
                    : 'Cancel'
                ),

              resolve,
            })
          }
        )
      },
      [isRtl]
    )

  const fetchUnread =
    useCallback(
      (role) => {
        if (
          role !==
          'super_admin'
        ) {
          setUnreadCount(0)

          return Promise.resolve()
        }

        return api
          .get(
            '/contact/unread-count',
            {
              globalLoading: false,

              loadingLabel:
                'admin-unread-messages',
            }
          )
          .then((data) => {
            setUnreadCount(
              data?.count || 0
            )
          })
          .catch(() => {})
      },
      []
    )

  /*
   * Synchronize the additional scrollbar
   * with the native sidebar scrollbar.
   */
  const updateMirrorScrollbar =
    useCallback(() => {
      const nav =
        sidebarNavRef.current

      const track =
        mirrorTrackRef.current

      if (!nav || !track) {
        return
      }

      const scrollHeight =
        nav.scrollHeight

      const clientHeight =
        nav.clientHeight

      const maximumScroll =
        Math.max(
          0,
          scrollHeight -
            clientHeight
        )

      const trackHeight =
        track.clientHeight

      if (
        maximumScroll <= 1 ||
        trackHeight <= 0 ||
        scrollHeight <= 0
      ) {
        setMirrorScrollbar(
          (current) => ({
            ...current,
            visible: false,
            thumbTop: 0,
          })
        )

        return
      }

      const calculatedHeight =
        (
          clientHeight /
          scrollHeight
        ) * trackHeight

      const thumbHeight =
        Math.max(
          36,
          Math.min(
            trackHeight,
            calculatedHeight
          )
        )

      const maximumThumbTop =
        Math.max(
          0,
          trackHeight -
            thumbHeight
        )

      const thumbTop =
        maximumScroll > 0
          ? (
              nav.scrollTop /
              maximumScroll
            ) *
            maximumThumbTop
          : 0

      setMirrorScrollbar(
        (current) => {
          const next = {
            visible: true,
            thumbHeight,
            thumbTop,
          }

          const unchanged =
            current.visible ===
              next.visible &&
            Math.abs(
              current.thumbHeight -
                next.thumbHeight
            ) < 0.5 &&
            Math.abs(
              current.thumbTop -
                next.thumbTop
            ) < 0.5

          return unchanged
            ? current
            : next
        }
      )
    }, [])

  /*
   * Listen to scrolling, resizing and changes
   * inside the navigation list.
   */
  useEffect(() => {
    const nav =
      sidebarNavRef.current

    if (
      loading ||
      !nav
    ) {
      return undefined
    }

    const handleScroll = () => {
      updateMirrorScrollbar()
    }

    const handleWindowResize =
      () => {
        updateMirrorScrollbar()
      }

    nav.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      }
    )

    window.addEventListener(
      'resize',
      handleWindowResize
    )

    const resizeObserver =
      typeof ResizeObserver !==
      'undefined'
        ? new ResizeObserver(() => {
            updateMirrorScrollbar()
          })
        : null

    resizeObserver?.observe(nav)

    const mutationObserver =
      typeof MutationObserver !==
      'undefined'
        ? new MutationObserver(() => {
            updateMirrorScrollbar()
          })
        : null

    mutationObserver?.observe(
      nav,
      {
        childList: true,
        subtree: true,
        attributes: true,
      }
    )

    const animationFrame =
      window.requestAnimationFrame(
        () => {
          updateMirrorScrollbar()
        }
      )

    return () => {
      window.cancelAnimationFrame(
        animationFrame
      )

      nav.removeEventListener(
        'scroll',
        handleScroll
      )

      window.removeEventListener(
        'resize',
        handleWindowResize
      )

      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [
    loading,
    admin?.role,
    adminLang,
    sidebarOpen,
    isMobile,
    location.pathname,
    updateMirrorScrollbar,
  ])

  /*
   * Clicking on the additional scrollbar track
   * moves the sidebar to that position.
   */
  const handleMirrorTrackPointerDown =
    (event) => {
      if (
        event.target !==
        event.currentTarget
      ) {
        return
      }

      const nav =
        sidebarNavRef.current

      const track =
        mirrorTrackRef.current

      if (
        !nav ||
        !track ||
        !mirrorScrollbar.visible
      ) {
        return
      }

      event.preventDefault()

      const trackRectangle =
        track.getBoundingClientRect()

      const maximumScroll =
        nav.scrollHeight -
        nav.clientHeight

      const maximumThumbTop =
        track.clientHeight -
        mirrorScrollbar.thumbHeight

      if (
        maximumScroll <= 0 ||
        maximumThumbTop <= 0
      ) {
        return
      }

      const requestedThumbTop =
        event.clientY -
        trackRectangle.top -
        mirrorScrollbar.thumbHeight /
          2

      const limitedThumbTop =
        Math.max(
          0,
          Math.min(
            maximumThumbTop,
            requestedThumbTop
          )
        )

      nav.scrollTop =
        (
          limitedThumbTop /
          maximumThumbTop
        ) * maximumScroll
    }

  /*
   * Begin dragging the additional scrollbar.
   */
  const handleMirrorThumbPointerDown =
    (event) => {
      const nav =
        sidebarNavRef.current

      if (!nav) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      event.currentTarget.setPointerCapture(
        event.pointerId
      )

      sidebarDragRef.current = {
        active: true,
        pointerId:
          event.pointerId,
        startY:
          event.clientY,
        startScrollTop:
          nav.scrollTop,
      }
    }

  /*
   * Move the original sidebar while dragging
   * the additional thumb.
   */
  const handleMirrorThumbPointerMove =
    (event) => {
      const drag =
        sidebarDragRef.current

      if (
        !drag.active ||
        drag.pointerId !==
          event.pointerId
      ) {
        return
      }

      const nav =
        sidebarNavRef.current

      const track =
        mirrorTrackRef.current

      if (!nav || !track) {
        return
      }

      event.preventDefault()

      const maximumScroll =
        nav.scrollHeight -
        nav.clientHeight

      const maximumThumbTop =
        track.clientHeight -
        mirrorScrollbar.thumbHeight

      if (
        maximumScroll <= 0 ||
        maximumThumbTop <= 0
      ) {
        return
      }

      const pointerDifference =
        event.clientY -
        drag.startY

      nav.scrollTop =
        drag.startScrollTop +
        (
          pointerDifference /
          maximumThumbTop
        ) *
          maximumScroll
    }

  const stopMirrorThumbDragging =
    (event) => {
      const drag =
        sidebarDragRef.current

      if (
        drag.pointerId ===
          event.pointerId &&
        event.currentTarget.hasPointerCapture(
          event.pointerId
        )
      ) {
        event.currentTarget.releasePointerCapture(
          event.pointerId
        )
      }

      sidebarDragRef.current = {
        active: false,
        pointerId: null,
        startY: 0,
        startScrollTop: 0,
      }
    }

  /*
   * Mouse-wheel scrolling also works while
   * the pointer is over the additional track.
   */
  const handleMirrorWheel =
    (event) => {
      const nav =
        sidebarNavRef.current

      if (!nav) {
        return
      }

      event.preventDefault()

      nav.scrollTop +=
        event.deltaY
    }

  useEffect(() => {
    let cancelled = false
    let interval = null

    const layoutLoadingToken =
      startLoading(
        'admin-layout-bootstrap'
      )

    const refreshAdmin =
      async () => {
        setLoading(true)

        const token =
          localStorage.getItem(
            'yhpo_token'
          )

        if (!token) {
          clearAdminSession()

          if (!cancelled) {
            setLoading(false)

            navigate(
              '/admin/login',
              {
                replace: true,
              }
            )
          }

          stopLoading(
            layoutLoadingToken
          )

          return
        }

        try {
          const freshAdmin =
            await api.get(
              '/auth/me',
              {
                globalLoading:
                  false,

                loadingLabel:
                  'admin-session',
              }
            )

          if (cancelled) {
            return
          }

          setAdmin(freshAdmin)

          localStorage.setItem(
            'yhpo_admin',
            JSON.stringify(
              freshAdmin
            )
          )

          if (
            freshAdmin.role ===
            'super_admin'
          ) {
            await fetchUnread(
              freshAdmin.role
            )

            if (cancelled) {
              return
            }

            interval =
              window.setInterval(
                () => {
                  fetchUnread(
                    freshAdmin.role
                  )
                },
                30000
              )
          } else {
            setUnreadCount(0)
          }
        } catch (error) {
          if (cancelled) {
            return
          }

          console.error(
            'Failed to refresh admin:',
            error
          )

          clearAdminSession()

          toast.error(
            isRtlRef.current
              ? 'انتهت الجلسة، سجل الدخول مرة أخرى'
              : 'Session expired, please login again',
            toastTheme.error
          )

          navigate(
            '/admin/login',
            {
              replace: true,
            }
          )
        } finally {
          if (!cancelled) {
            setLoading(false)
          }

          stopLoading(
            layoutLoadingToken
          )
        }
      }

    refreshAdmin()

    return () => {
      cancelled = true

      stopLoading(
        layoutLoadingToken
      )

      if (interval) {
        window.clearInterval(
          interval
        )
      }
    }
  }, [
    navigate,
    fetchUnread,
    startLoading,
    stopLoading,
  ])

  useEffect(() => {
    const handleResize = () => {
      const mobile =
        window.innerWidth < 1024

      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    handleResize()

    window.addEventListener(
      'resize',
      handleResize
    )

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      )
    }
  }, [])

  useEffect(() => {
    if (
      location.pathname ===
      '/admin/messages'
    ) {
      fetchUnread(
        admin?.role
      )
    }
  }, [
    location.pathname,
    admin?.role,
    fetchUnread,
  ])

  const handleLogout =
    async () => {
      const confirmed =
        await requestConfirm({
          title: isRtl
            ? 'تأكيد تسجيل الخروج'
            : 'Confirm logout',

          message: isRtl
            ? 'هل تريد تسجيل الخروج من لوحة الإدارة؟'
            : 'Do you want to log out of the admin dashboard?',

          variant: 'logout',

          confirmText: isRtl
            ? 'تسجيل الخروج'
            : 'Logout',

          cancelText: isRtl
            ? 'إلغاء'
            : 'Cancel',
        })

      if (!confirmed) {
        return
      }

      clearAdminSession()

      toast.success(
        isRtl
          ? 'تم تسجيل الخروج'
          : 'Logged out successfully',
        toastTheme.success
      )

      navigate(
        '/admin/login',
        {
          replace: true,
        }
      )
    }

  /*
   * The global application preloader covers
   * the initial admin authentication only.
   */
  if (loading) {
    return null
  }

  if (!admin) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    )
  }

  if (
    !canAccessPage(
      admin.role,
      location.pathname
    )
  ) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    )
  }

  const navItems =
    getSidebarItems(
      admin.role,
      t
    )

  const iconMap = {
    dashboard:
      LayoutDashboard,

    news:
      Newspaper,

    events:
      Calendar,

    admins:
      Users,

    profile:
      User,

    heritage:
      Mountain,

    messages:
      MessageSquare,

    partners:
      Handshake,

    hero:
      Images,

    gallery:
      Images,

    settings:
      Settings,
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

  const isActiveLink =
    (href) => {
      if (
        href === '/admin'
      ) {
        return (
          location.pathname ===
          '/admin'
        )
      }

      return (
        location.pathname === href ||
        location.pathname.startsWith(
          `${href}/`
        )
      )
    }

  const CollapseIcon = () => {
    if (isRtl) {
      return sidebarOpen ? (
        <ChevronRight
          size={18}
        />
      ) : (
        <ChevronLeft
          size={18}
        />
      )
    }

    return sidebarOpen ? (
      <ChevronLeft
        size={18}
      />
    ) : (
      <ChevronRight
        size={18}
      />
    )
  }

  return (
    <AdminLangContext.Provider
      value={contextValue}
    >
      <ConfirmContext.Provider
        value={contextValue}
      >
        <div
          className={`min-h-screen bg-gray-50 ${
            isRtl
              ? 'font-ar'
              : 'font-en'
          }`}
          dir={
            isRtl
              ? 'rtl'
              : 'ltr'
          }
        >
          <ConfirmModal
            modal={
              confirmModal
            }
            close={
              closeConfirm
            }
            isRtl={
              isRtl
            }
          />

          <header
            className="fixed inset-x-0 top-0 z-50 h-[76px] border-b border-white/15 shadow-lg"
            style={{
              backgroundColor:
                ADMIN_BRAND,
            }}
          >
            <div className="flex h-full items-center justify-between gap-3 px-3 sm:px-4 md:px-6">
              <div
                className={`flex min-w-0 items-center gap-3 md:gap-4 ${
                  isMobile
                    ? isRtl
                      ? 'order-2'
                      : 'order-1'
                    : ''
                }`}
              >
                <img
                  src="/logowhite.png"
                  alt="Yemen Heritage"
                  className="h-12 w-auto shrink-0 sm:h-14"
                  onError={(
                    event
                  ) => {
                    event.currentTarget.style.display =
                      'none'
                  }}
                />

                <div className="hidden min-w-0 lg:block">
                  <h1 className="truncate text-base font-bold text-white">
                    منظمة تراث اليمن
                    لأجل السلام
                  </h1>

                  <p className="mt-0.5 truncate text-sm font-medium text-white/85">
                    Yemen Heritage for
                    Peace Organization
                  </p>
                </div>
              </div>

              {isMobile && (
                <button
                  type="button"
                  onClick={() =>
                    setSidebarOpen(
                      (open) =>
                        !open
                    )
                  }
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white transition hover:bg-white/25 ${
                    isRtl
                      ? 'order-1'
                      : 'order-2'
                  }`}
                  aria-label={
                    isRtl
                      ? 'قائمة التنقل'
                      : 'Toggle sidebar'
                  }
                >
                  {sidebarOpen ? (
                    <X size={20} />
                  ) : (
                    <Menu size={20} />
                  )}
                </button>
              )}

              {!isMobile && (
                <div className="flex min-w-0 items-center gap-4">
                  <button
                    type="button"
                    onClick={
                      toggleAdminLang
                    }
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition hover:text-white"
                  >
                    <Globe
                      size={17}
                    />

                    <span className="hidden sm:inline">
                      {t.switchLang}
                    </span>
                  </button>

                  <div className="hidden min-w-0 items-center gap-2 sm:flex">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white"
                      style={{
                        color:
                          ADMIN_BRAND,
                      }}
                    >
                      <User
                        size={17}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {admin?.name ||
                          admin?.email ||
                          (
                            isRtl
                              ? 'مشرف'
                              : 'Admin'
                          )}
                      </p>

                      <p className="text-xs text-white/75">
                        {admin.role ===
                        'super_admin'
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
              )}
            </div>
          </header>

          <aside
            className={`fixed bottom-0 top-[76px] z-40 border-white/15 shadow-2xl transition-all duration-300 ${
              isRtl
                ? 'right-0 border-l'
                : 'left-0 border-r'
            } ${
              isMobile
                ? 'w-72'
                : sidebarOpen
                  ? 'w-72'
                  : 'w-20'
            } ${
              isMobile &&
              !sidebarOpen
                ? isRtl
                  ? 'translate-x-full'
                  : '-translate-x-full'
                : 'translate-x-0'
            }`}
            style={{
              backgroundColor:
                ADMIN_BRAND,
            }}
          >
            {!isMobile && (
              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(
                    (open) =>
                      !open
                  )
                }
                className="absolute top-6 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition hover:scale-105"
                style={{
                  color:
                    ADMIN_BRAND,

                  [isRtl
                    ? 'left'
                    : 'right']:
                    '-18px',
                }}
                aria-label={
                  isRtl
                    ? 'طي القائمة'
                    : 'Toggle sidebar'
                }
              >
                <CollapseIcon />
              </button>
            )}

            <div className="flex h-full flex-col">
              {/*
               * Scrollable navigation shell.
               * It contains the native scrollbar
               * and the additional mirrored one.
               */}
              <div className="admin-sidebar-scroll-shell">
                <nav
                  ref={
                    sidebarNavRef
                  }
                  className="admin-sidebar-scrollbar h-full space-y-1 overflow-y-auto p-3 pt-6"
                >
                  {isMobile && (
                    <button
                      type="button"
                      onClick={
                        toggleAdminLang
                      }
                      className="group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-white/85 transition-all hover:bg-white/15 hover:text-white"
                    >
                      <Globe
                        size={19}
                        className="shrink-0"
                      />

                      <span className="text-sm font-semibold">
                        {t.switchLang}
                      </span>
                    </button>
                  )}

                  {navItems.map(
                    (item) => {
                      const Icon =
                        iconMap[
                          item.key
                        ] ||
                        LayoutDashboard

                      const active =
                        isActiveLink(
                          item.href
                        )

                      return (
                        <Link
                          key={
                            item.key
                          }
                          to={
                            item.href
                          }
                          onClick={() => {
                            if (
                              isMobile
                            ) {
                              setSidebarOpen(
                                false
                              )
                            }
                          }}
                          className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
                            active
                              ? 'bg-white shadow-sm'
                              : 'text-white/85 hover:bg-white/15 hover:text-white'
                          } ${
                            !sidebarOpen &&
                            !isMobile
                              ? 'justify-center'
                              : ''
                          }`}
                          style={
                            active
                              ? {
                                  color:
                                    ADMIN_BRAND,
                                }
                              : undefined
                          }
                        >
                          <Icon
                            size={19}
                            className="shrink-0"
                          />

                          {(sidebarOpen ||
                            isMobile) && (
                            <span className="text-sm font-semibold">
                              {item.label}
                            </span>
                          )}

                          {item.key ===
                            'messages' &&
                            unreadCount >
                              0 && (
                              <span
                                className={`${
                                  sidebarOpen ||
                                  isMobile
                                    ? 'ms-auto'
                                    : 'absolute -top-1 -end-1'
                                } flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white`}
                              >
                                {unreadCount >
                                99
                                  ? '99+'
                                  : unreadCount}
                              </span>
                            )}
                        </Link>
                      )
                    }
                  )}
                </nav>

                {/*
                 * Additional synchronized scrollbar.
                 *
                 * RTL: native scrollbar is usually left,
                 * so the additional scrollbar appears right.
                 *
                 * LTR: native scrollbar is usually right,
                 * so the additional scrollbar appears left.
                 */}
                <div
                  ref={
                    mirrorTrackRef
                  }
                  className={`admin-sidebar-mirror-track ${
                    isRtl
                      ? 'admin-sidebar-mirror-track-right'
                      : 'admin-sidebar-mirror-track-left'
                  } ${
                    mirrorScrollbar.visible
                      ? 'is-visible'
                      : ''
                  }`}
                  onPointerDown={
                    handleMirrorTrackPointerDown
                  }
                  onWheel={
                    handleMirrorWheel
                  }
                  aria-hidden="true"
                >
                  {mirrorScrollbar.visible && (
                    <button
                      type="button"
                      tabIndex={-1}
                      className="admin-sidebar-mirror-thumb"
                      style={{
                        height:
                          `${mirrorScrollbar.thumbHeight}px`,

                        transform:
                          `translateY(${mirrorScrollbar.thumbTop}px)`,
                      }}
                      onPointerDown={
                        handleMirrorThumbPointerDown
                      }
                      onPointerMove={
                        handleMirrorThumbPointerMove
                      }
                      onPointerUp={
                        stopMirrorThumbDragging
                      }
                      onPointerCancel={
                        stopMirrorThumbDragging
                      }
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>

              <div className="border-t border-white/15 p-3">
                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className={`flex w-full items-center gap-3 rounded-xl border border-white/20 bg-white/15 px-3 py-3 text-white transition hover:border-red-600 hover:bg-red-600 ${
                    !sidebarOpen &&
                    !isMobile
                      ? 'justify-center'
                      : ''
                  }`}
                >
                  <LogOut
                    size={19}
                    className="shrink-0"
                  />

                  {(sidebarOpen ||
                    isMobile) && (
                    <span className="text-sm font-bold">
                      {t.logout}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </aside>

          {isMobile &&
            sidebarOpen && (
              <div
                className="fixed inset-x-0 bottom-0 top-[76px] z-30 bg-black/40 lg:hidden"
                onClick={() =>
                  setSidebarOpen(
                    false
                  )
                }
              />
            )}

          <main
            className={`min-h-screen pt-[76px] transition-all duration-300 ${
              isMobile
                ? 'ml-0 mr-0'
                : sidebarOpen
                  ? isRtl
                    ? 'mr-72'
                    : 'ml-72'
                  : isRtl
                    ? 'mr-20'
                    : 'ml-20'
            }`}
          >
            <div className="p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </ConfirmContext.Provider>
    </AdminLangContext.Provider>
  )
}
