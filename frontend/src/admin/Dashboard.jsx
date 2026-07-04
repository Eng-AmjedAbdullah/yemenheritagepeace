import { useState, useEffect } from 'react'
import { resolveMediaUrl } from '../lib/media'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Newspaper, Calendar, Users, MessageSquare, Mountain, ExternalLink, Handshake, Images, Settings, Activity, Eye } from 'lucide-react'
import { useAdminLang } from './adminI18n'
import { getDashboardCards, getQuickActions, getAllowedFeatures, ADMIN_ROLES } from './adminPermissions'

export default function Dashboard() {
  const { t, isRtl } = useAdminLang()
  const [admin, setAdmin] = useState(null)
  const [stats, setStats] = useState({ news:0, events:0, admins:0, messages:0, heritage:0, partners:0, hero:0, unreadMessages:0 })
  const [recentNews, setRecentNews] = useState([])
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Get admin from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('yhpo_admin')
    if (stored) {
      try {
        setAdmin(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse admin:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (!admin) return

    setLoading(true)
    const features = getAllowedFeatures(admin.role)

    // Build requests based on role permissions
    const requests = []
    const requestTypes = []

    if (features.viewNews) {
      requests.push(api.get('/news/all'))
      requestTypes.push('news')
    }
    if (features.viewEvents) {
      requests.push(api.get('/events/all'))
      requestTypes.push('events')
    }
    if (features.viewAdmins) {
      requests.push(api.get('/admins'))
      requestTypes.push('admins')
    }
    if (features.viewMessages) {
      requests.push(api.get('/contact'))
      requestTypes.push('messages')
    }
    if (features.viewHeritage) {
      requests.push(api.get('/heritage/all'))
      requestTypes.push('heritage')
    }
    if (features.viewPartners) {
      requests.push(api.get('/partners/all'))
      requestTypes.push('partners')
    }
    if (features.viewHero) {
      requests.push(api.get('/hero/all'))
      requestTypes.push('hero')
    }

    Promise.allSettled(requests).then((results) => {
      const newStats = {
        news: 0,
        events: 0,
        admins: 0,
        messages: 0,
        heritage: 0,
        partners: 0,
        hero: 0,
        unreadMessages: 0,
      }

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const type = requestTypes[index]
          const data = result.value || []
          newStats[type] = Array.isArray(data) ? data.length : 0

          if (type === 'messages') {
            newStats.unreadMessages = data.filter((m) => !m.read_status).length
          }
        }
      })

      setStats(newStats)

      // Get recent items
      if (features.viewNews) {
        api.get('/news/all').then((data) => {
          setRecentNews((Array.isArray(data) ? data : []).slice(0, 3))
        }).catch(() => {})
      }

      if (features.viewEvents) {
        api.get('/events/all').then((data) => {
          setRecentEvents((Array.isArray(data) ? data : []).slice(0, 3))
        }).catch(() => {})
      }

      setLoading(false)
    })
  }, [admin])

  if (!admin || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">{isRtl ? 'جارٍ التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  const cards = getDashboardCards(admin.role, stats, t)
  const quickActions = getQuickActions(admin.role, t)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark flex items-center gap-2">
          <Activity className="text-primary" size={32}/>
          {t.dashboardTitle}
        </h1>
        <p className="text-gray-500 text-sm mt-2">{t.dashboardSubtitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        {cards.map((card,i)=>(
          <Link key={i} to={card.href} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center shadow-md`}>
                  {card.icon === 'Newspaper' && <Newspaper size={20} className="text-white"/>}
                  {card.icon === 'Calendar' && <Calendar size={20} className="text-white"/>}
                  {card.icon === 'Mountain' && <Mountain size={20} className="text-white"/>}
                  {card.icon === 'Handshake' && <Handshake size={20} className="text-white"/>}
                  {card.icon === 'Images' && <Images size={20} className="text-white"/>}
                  {card.icon === 'MessageSquare' && <MessageSquare size={20} className="text-white"/>}
                  {card.icon === 'Users' && <Users size={20} className="text-white"/>}
                </div>
                {card.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{card.badge}</span>
                )}
              </div>
              <div className="text-3xl font-bold text-dark mb-1">{card.value}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Items */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {getAllowedFeatures(admin.role).viewNews && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-dark text-lg">{t.latestNews}</h2>
              <Link to="/admin/news" className="text-primary text-sm hover:underline flex items-center gap-1">
                {t.viewAll} <ExternalLink size={12}/>
              </Link>
            </div>
            <div className="space-y-3">
              {recentNews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">{t.noNews}</p>
              ) : (
                recentNews.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                    {item.image_url && (
                      <img src={resolveMediaUrl(item.image_url)} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0"/>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-dark text-sm line-clamp-1">{isRtl ? item.title : (item.title_en || item.title)}</h3>
                      <p className="text-xs text-gray-400 mt-1">{new Date(item.created_at).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}</p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${item.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.published ? t.published : t.draft}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {getAllowedFeatures(admin.role).viewEvents && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-dark text-lg">{t.upcomingEvents}</h2>
              <Link to="/admin/events" className="text-primary text-sm hover:underline flex items-center gap-1">
                {t.viewAll} <ExternalLink size={12}/>
              </Link>
            </div>
            <div className="space-y-3">
              {recentEvents.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">{t.noEvents}</p>
              ) : (
                recentEvents.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.type === 'event' ? 'bg-blue-100' :
                      item.type === 'seminar' ? 'bg-purple-100' :
                      item.type === 'training' ? 'bg-amber-100' : 'bg-green-100'
                    }`}>
                      <Calendar size={20} className={`${
                        item.type === 'event' ? 'text-blue-600' :
                        item.type === 'seminar' ? 'text-purple-600' :
                        item.type === 'training' ? 'text-amber-600' : 'text-green-600'
                      }`}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-dark text-sm line-clamp-1">{isRtl ? item.title : (item.title_en || item.title)}</h3>
                      <p className="text-xs text-gray-400 mt-1">{item.event_date ? new Date(item.event_date).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US') : t.notSet}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-primary/10 via-white to-primary/5 rounded-2xl p-6 shadow-sm border border-primary/20">
        <h2 className="font-bold text-dark mb-4 text-lg">{t.quickActions}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, idx) => {
            const iconMap = {
              'Newspaper': <Newspaper size={16}/>,
              'Calendar': <Calendar size={16}/>,
              'Mountain': <Mountain size={16}/>,
              'Handshake': <Handshake size={16}/>,
              'Images': <Images size={16}/>,
              'Settings': <Settings size={16}/>,
              'Users': <Users size={16}/>,
              'Eye': <Eye size={16}/>,
            }

            if (action.external) {
              return (
                <a key={idx} href={action.href} target="_blank" rel="noreferrer" className="btn-outline text-sm py-3 justify-center">
                  {iconMap[action.icon]}{action.label}
                </a>
              )
            }

            return (
              <Link key={idx} to={action.href} className="btn-outline text-sm py-3 justify-center">
                {iconMap[action.icon]}{action.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
