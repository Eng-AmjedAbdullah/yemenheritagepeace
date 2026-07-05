import { useEffect, useMemo, useState } from 'react'
import { resolveMediaUrl } from '../lib/media'
import { Link } from 'react-router-dom'
import api from '../lib/api'
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

  const [stats, setStats] = useState({
    news: 0,
    events: 0,
    admins: 0,
    messages: 0,
    heritage: 0,
    partners: 0,
    hero: 0,
    unreadMessages: 0,
  })

  const [recentNews, setRecentNews] = useState([])
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const isSuperAdmin = admin?.role === ADMIN_ROLES.SUPER_ADMIN

  useEffect(() => {
    if (!admin?.role) return

    let cancelled = false

    const loadDashboard = async () => {
      setLoading(true)

      const features = getAllowedFeatures(admin.role)

      const requests = []

      if (features.viewNews) {
        requests.push({
          type: 'news',
          request: api.get('/news/all'),
        })
      }

      if (features.viewEvents) {
        requests.push({
          type: 'events',
          request: api.get('/events/all'),
        })
      }

      if (features.viewAdmins) {
        requests.push({
          type: 'admins',
          request: api.get('/admins'),
        })
      }

      if (features.viewMessages) {
        requests.push({
          type: 'messages',
          request: api.get('/contact'),
        })
      }

      if (features.viewHeritage) {
        requests.push({
          type: 'heritage',
          request: api.get('/heritage/all'),
        })
      }

      if (features.viewPartners) {
        requests.push({
          type: 'partners',
          request: api.get('/partners/all'),
        })
      }

      if (features.viewHero) {
        requests.push({
          type: 'hero',
          request: api.get('/hero/all'),
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
        hero: 0,
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
      setLoading(false)
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [admin?.role])

  const features = useMemo(() => {
    if (!admin?.role) return {}
    return getAllowedFeatures(admin.role)
  }, [admin?.role])

  const cards = useMemo(() => {
    if (!admin?.role) return []

    const allCards = getDashboardCards(admin.role, stats, t)

    /*
      Required fix:
      If the admin is NOT super_admin, hide these dashboard count cards:
      - الأخبار
      - الفعاليات
    */
    if (!isSuperAdmin) {
      return allCards.filter((card) => {
        return card.href !== '/admin/news' && card.href !== '/admin/events'
      })
    }

    return allCards
  }, [admin?.role, stats, t, isSuperAdmin])

  const quickActions = useMemo(() => {
    if (!admin?.role) return []
    return getQuickActions(admin.role, t)
  }, [admin?.role, t])

  if (!admin || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-500">
            {isRtl ? 'جارٍ التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  const renderCardIcon = (icon) => {
    const icons = {
      Newspaper: <Newspaper size={20} className="text-white" />,
      Calendar: <Calendar size={20} className="text-white" />,
      Mountain: <Mountain size={20} className="text-white" />,
      Handshake: <Handshake size={20} className="text-white" />,
      Images: <Images size={20} className="text-white" />,
      MessageSquare: <MessageSquare size={20} className="text-white" />,
      Users: <Users size={20} className="text-white" />,
    }

    return icons[icon] || <Activity size={20} className="text-white" />
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark flex items-center gap-2">
          <Activity className="text-primary" size={32} />
          {t.dashboardTitle}
        </h1>

        <p className="text-gray-500 text-sm mt-2">
          {t.dashboardSubtitle}
        </p>
      </div>

      {cards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          {cards.map((card, index) => (
            <Link
              key={`${card.href}-${index}`}
              to={card.href}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group relative overflow-hidden"
            >
              <div
                className={`absolute top-0 ${
                  isRtl ? 'left-0' : 'right-0'
                } w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center shadow-md`}
                  >
                    {renderCardIcon(card.icon)}
                  </div>

                  {card.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {card.badge}
                    </span>
                  )}
                </div>

                <div className="text-3xl font-bold text-dark mb-1">
                  {card.value}
                </div>

                <div className="text-sm text-gray-500">
                  {card.label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {features.viewNews && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-dark text-lg">
                {t.latestNews}
              </h2>

              <Link
                to="/admin/news"
                className="text-primary text-sm hover:underline flex items-center gap-1"
              >
                {t.viewAll}
                <ExternalLink size={12} />
              </Link>
            </div>

            <div className="space-y-3">
              {recentNews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  {t.noNews}
                </p>
              ) : (
                recentNews.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    {item.image_url ? (
                      <img
                        src={resolveMediaUrl(item.image_url)}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Newspaper size={20} className="text-primary" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-dark text-sm line-clamp-1">
                        {isRtl ? item.title : item.title_en || item.title}
                      </h3>

                      <p className="text-xs text-gray-400 mt-1">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString(
                              isRtl ? 'ar-YE' : 'en-US'
                            )
                          : t.notSet}
                      </p>

                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
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
          </div>
        )}

        {features.viewEvents && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-dark text-lg">
                {t.upcomingEvents}
              </h2>

              <Link
                to="/admin/events"
                className="text-primary text-sm hover:underline flex items-center gap-1"
              >
                {t.viewAll}
                <ExternalLink size={12} />
              </Link>
            </div>

            <div className="space-y-3">
              {recentEvents.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  {t.noEvents}
                </p>
              ) : (
                recentEvents.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
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

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-dark text-sm line-clamp-1">
                        {isRtl ? item.title : item.title_en || item.title}
                      </h3>

                      <p className="text-xs text-gray-400 mt-1">
                        {item.event_date
                          ? new Date(item.event_date).toLocaleDateString(
                              isRtl ? 'ar-YE' : 'en-US'
                            )
                          : t.notSet}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-primary/10 via-white to-primary/5 rounded-2xl p-6 shadow-sm border border-primary/20">
        <h2 className="font-bold text-dark mb-4 text-lg">
          {t.quickActions}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => {
            if (action.external) {
              return (
                <a
                  key={`${action.href}-${index}`}
                  href={action.href}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline text-sm py-3 justify-center"
                >
                  {renderActionIcon(action.icon)}
                  {action.label}
                </a>
              )
            }

            return (
              <Link
                key={`${action.href}-${index}`}
                to={action.href}
                className="btn-outline text-sm py-3 justify-center"
              >
                {renderActionIcon(action.icon)}
                {action.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
