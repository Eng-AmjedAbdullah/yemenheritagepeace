import { useEffect, useMemo, useState } from 'react'
import { resolveMediaUrl } from '../lib/media'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useGlobalLoading } from '../context/LoadingContext'
import {
  Newspaper,
  Calendar,
  Users,
  MessageSquare,
  Mountain,
  ExternalLink,
  Handshake,
  Images,
  Settings,
  Activity,
  Eye,
} from 'lucide-react'
import { useAdminLang } from './adminI18n'
import {
  getDashboardCards,
  getQuickActions,
  getAllowedFeatures,
  ADMIN_ROLES,
} from './adminPermissions'

export default function Dashboard() {
  const { t, isRtl, admin } = useAdminLang()
  const { startLoading, stopLoading } = useGlobalLoading()

  const [stats, setStats] = useState({
    news: 0,
    events: 0,
    admins: 0,
    messages: 0,
    heritage: 0,
    partners: 0,
    gallery: 0,
    unreadMessages: 0,
  })

  const [recentNews, setRecentNews] = useState([])
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const isSuperAdmin = admin?.role === ADMIN_ROLES.SUPER_ADMIN

  useEffect(() => {
    if (!admin?.role) return

    let cancelled = false
    const dashboardLoadingToken = startLoading('admin-dashboard-data')

    const loadDashboard = async () => {
      setLoading(true)

      try {
        const features = getAllowedFeatures(admin.role)
        const requests = []

        if (features.viewNews) {
          requests.push({
            type: 'news',
            request: api.get('/news/all', {
              loadingLabel: 'dashboard-news',
            }),
          })
        }

        if (features.viewEvents) {
          requests.push({
            type: 'events',
            request: api.get('/events/all', {
              loadingLabel: 'dashboard-events',
            }),
          })
        }

        if (features.viewAdmins) {
          requests.push({
            type: 'admins',
            request: api.get('/admins', {
              loadingLabel: 'dashboard-admins',
            }),
          })
        }

        if (features.viewMessages) {
          requests.push({
            type: 'messages',
            request: api.get('/contact', {
              loadingLabel: 'dashboard-messages',
            }),
          })
        }

        if (features.viewHeritage) {
          requests.push({
            type: 'heritage',
            request: api.get('/heritage/all', {
              loadingLabel: 'dashboard-heritage',
            }),
          })
        }

        if (features.viewPartners) {
          requests.push({
            type: 'partners',
            request: api.get('/partners/all', {
              loadingLabel: 'dashboard-partners',
            }),
          })
        }

        if (features.viewGallery) {
          requests.push({
            type: 'gallery',
            request: api
              .get('/gallery/collections/all', {
                loadingLabel: 'dashboard-gallery',
              })
              .catch(() =>
                api.get('/gallery/all', {
                  loadingLabel: 'dashboard-gallery-fallback',
                })
              ),
          })
        }

        const results = await Promise.allSettled(
          requests.map((item) => item.request)
        )

        if (cancelled) return

        const nextStats = {
          news: 0,
          events: 0,
          admins: 0,
          messages: 0,
          heritage: 0,
          partners: 0,
          gallery: 0,
          unreadMessages: 0,
        }

        let loadedNews = []
        let loadedEvents = []

        results.forEach((result, index) => {
          const type = requests[index].type
          const data =
            result.status === 'fulfilled' && Array.isArray(result.value)
              ? result.value
              : []

          nextStats[type] = data.length

          if (type === 'messages') {
            nextStats.unreadMessages = data.filter(
              (message) => !message.read_status
            ).length
          }

          if (type === 'news') {
            loadedNews = data
          }

          if (type === 'events') {
            loadedEvents = data
          }
        })

        setStats(nextStats)
        setRecentNews(loadedNews.slice(0, 3))
        setRecentEvents(loadedEvents.slice(0, 3))
      } catch (error) {
        console.error('Failed to load dashboard:', error)

        if (!cancelled) {
          setStats({
            news: 0,
            events: 0,
            admins: 0,
            messages: 0,
            heritage: 0,
            partners: 0,
            gallery: 0,
            unreadMessages: 0,
          })
          setRecentNews([])
          setRecentEvents([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
        stopLoading(dashboardLoadingToken)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
      stopLoading(dashboardLoadingToken)
    }
  }, [admin?.role, startLoading, stopLoading])

  const features = useMemo(() => {
    if (!admin?.role) return {}
    return getAllowedFeatures(admin.role)
  }, [admin?.role])

  const cards = useMemo(() => {
    if (!admin?.role) return []

    const allCards = getDashboardCards(admin.role, stats, t)

    const withoutHeroSlides = allCards.filter((card) => {
      const href = String(card.href || '').toLowerCase()
      const label = String(card.label || '').toLowerCase()

      return (
        href !== '/admin/hero' &&
        !label.includes('hero slides') &&
        !label.includes('hero') &&
        !label.includes('واجهة')
      )
    })

    return withoutHeroSlides
  }, [admin?.role, stats, t])

  const quickActions = useMemo(() => {
    if (!admin?.role) return []

    const actions = getQuickActions(admin.role, t)

    return actions.filter((action) => action.href !== '/admin/hero')
  }, [admin?.role, t])

  const renderCardIcon = (icon) => {
    const icons = {
      Newspaper: <Newspaper size={19} className="text-white" />,
      Calendar: <Calendar size={19} className="text-white" />,
      Mountain: <Mountain size={19} className="text-white" />,
      Handshake: <Handshake size={19} className="text-white" />,
      Images: <Images size={19} className="text-white" />,
      MessageSquare: <MessageSquare size={19} className="text-white" />,
      Users: <Users size={19} className="text-white" />,
    }

    return icons[icon] || <Activity size={19} className="text-white" />
  }

  const renderActionIcon = (icon) => {
    const icons = {
      Newspaper: <Newspaper size={16} />,
      Calendar: <Calendar size={16} />,
      Mountain: <Mountain size={16} />,
      Handshake: <Handshake size={16} />,
      Images: <Images size={16} />,
      Settings: <Settings size={16} />,
      Users: <Users size={16} />,
      Eye: <Eye size={16} />,
    }

    return icons[icon] || <Activity size={16} />
  }

  const getLocalizedTitle = (item) => {
    if (isRtl) return item.title || item.title_en || '—'
    return item.title_en || item.title || '—'
  }

  const formatDate = (value) => {
    if (!value) return t.notSet || '—'

    try {
      return new Date(value).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')
    } catch {
      return t.notSet || '—'
    }
  }

  // The global application preloader remains visible until
  // every dashboard request registered by api.js is complete.
  if (!admin || loading) {
    return null
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 sm:mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dark sm:text-3xl">
          <Activity className="shrink-0 text-primary" size={30} />

          <span className="min-w-0 truncate">
            {t.dashboardTitle}
          </span>
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {t.dashboardSubtitle}
        </p>
      </div>

      {cards.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
          {cards.map((card, index) => (
            <Link
              key={`${card.href}-${index}`}
              to={card.href}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-lg sm:p-5"
            >
              <div
                className={`absolute top-0 ${
                  isRtl ? 'left-0' : 'right-0'
                } h-20 w-20 rounded-bl-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />

              <div className="relative flex items-center gap-4 sm:block">
                <div className="flex shrink-0 items-center justify-between sm:mb-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-md ${card.color}`}
                  >
                    {renderCardIcon(card.icon)}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-3xl font-bold text-dark sm:text-4xl">
                      {card.value}
                    </div>

                    {card.badge > 0 && (
                      <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        {card.badge}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 line-clamp-1 text-sm text-gray-500 sm:mt-2">
                    {card.label}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {features.viewNews && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <SectionHeader
              title={t.latestNews}
              link="/admin/news"
              linkText={t.viewAll}
            />

            <div className="space-y-3">
              {recentNews.length === 0 ? (
                <EmptyState text={t.noNews} />
              ) : (
                recentNews.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                  >
                    {item.image_url ? (
                      <img
                        src={resolveMediaUrl(item.image_url)}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Newspaper size={20} className="text-primary" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-sm font-medium text-dark">
                        {getLocalizedTitle(item)}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(item.created_at)}
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                          item.published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.published ? t.published : t.draft}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {features.viewEvents && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <SectionHeader
              title={t.upcomingEvents}
              link="/admin/events"
              linkText={t.viewAll}
            />

            <div className="space-y-3">
              {recentEvents.length === 0 ? (
                <EmptyState text={t.noEvents} />
              ) : (
                recentEvents.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                        item.type === 'event'
                          ? 'bg-blue-100'
                          : item.type === 'seminar'
                            ? 'bg-purple-100'
                            : item.type === 'training'
                              ? 'bg-amber-100'
                              : 'bg-green-100'
                      }`}
                    >
                      <Calendar
                        size={20}
                        className={`${
                          item.type === 'event'
                            ? 'text-blue-600'
                            : item.type === 'seminar'
                              ? 'text-purple-600'
                              : item.type === 'training'
                                ? 'text-amber-600'
                                : 'text-green-600'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-sm font-medium text-dark">
                        {getLocalizedTitle(item)}
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(item.event_date)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {quickActions.length > 0 && (
        <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-white to-primary/5 p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-dark">
            {t.quickActions}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {quickActions.map((action, index) => {
              if (action.external) {
                return (
                  <a
                    key={`${action.href}-${index}`}
                    href={action.href}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline justify-center py-3 text-sm"
                  >
                    {renderActionIcon(action.icon)}

                    <span className="truncate">
                      {action.label}
                    </span>
                  </a>
                )
              }

              return (
                <Link
                  key={`${action.href}-${index}`}
                  to={action.href}
                  className="btn-outline justify-center py-3 text-sm"
                >
                  {renderActionIcon(action.icon)}

                  <span className="truncate">
                    {action.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function SectionHeader({ title, link, linkText }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="line-clamp-1 text-lg font-bold text-dark">
        {title}
      </h2>

      <Link
        to={link}
        className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
      >
        {linkText}
        <ExternalLink size={12} />
      </Link>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <p className="py-8 text-center text-sm text-gray-400">
      {text}
    </p>
  )
}
