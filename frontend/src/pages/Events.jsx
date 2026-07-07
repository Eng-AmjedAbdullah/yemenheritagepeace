import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLang } from '../App'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import {
  Calendar,
  MapPin,
  BookOpen,
  GraduationCap,
  Briefcase,
  Search,
  X,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'

const TYPE_LABELS = {
  event: { ar: 'فعالية', en: 'Event' },
  seminar: { ar: 'ندوة', en: 'Seminar' },
  project: { ar: 'مشروع', en: 'Project' },
  training: { ar: 'تدريب', en: 'Training' },
}

const TYPE_COLORS = {
  event: 'bg-blue-50 text-blue-700 border-blue-100',
  seminar: 'bg-purple-50 text-purple-700 border-purple-100',
  project: 'bg-green-50 text-green-700 border-green-100',
  training: 'bg-amber-50 text-amber-700 border-amber-100',
}

const TYPE_ICONS = {
  event: Calendar,
  seminar: BookOpen,
  project: Briefcase,
  training: GraduationCap,
}

const VALID_TYPES = ['all', 'event', 'seminar', 'project', 'training']
const LONG_TEXT_LIMIT = 160

export default function Events() {
  const { t, lang } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()

  const typeFromUrl = searchParams.get('type') || 'all'

  const [events, setEvents] = useState([])
  const [activeType, setActiveType] = useState(
    VALID_TYPES.includes(typeFromUrl) ? typeFromUrl : 'all'
  )
  const [dateFilter, setDateFilter] = useState('latest')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)

  const isRtl = lang === 'ar'

  useEffect(() => {
    const nextType = VALID_TYPES.includes(typeFromUrl) ? typeFromUrl : 'all'
    setActiveType(nextType)
  }, [typeFromUrl])

  useEffect(() => {
    let cancelled = false

    async function loadEvents() {
      setLoading(true)

      try {
        const data = await api.get('/events')

        if (!cancelled) {
          setEvents(Array.isArray(data) ? data : [])
        }
      } catch {
        if (!cancelled) {
          setEvents([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadEvents()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedEvent) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedEvent(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [selectedEvent])

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const result = events.filter((item) => {
      const matchesType = activeType === 'all' || item?.type === activeType

      const title = getEventTitle(item, isRtl).toLowerCase()
      const location = getEventLocation(item, isRtl).toLowerCase()
      const content = getEventContent(item, isRtl).toLowerCase()

      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        location.includes(normalizedSearch) ||
        content.includes(normalizedSearch)

      const matchesDate = matchesDateFilter(
        item?.event_date || item?.created_at,
        dateFilter
      )

      return matchesType && matchesSearch && matchesDate
    })

    return result.sort((a, b) => {
      const dateA = getEventTime(a)
      const dateB = getEventTime(b)

      if (dateFilter === 'oldest') {
        return dateA - dateB
      }

      return dateB - dateA
    })
  }, [events, activeType, search, dateFilter, isRtl])

  const tabs = [
    { key: 'all', label: isRtl ? 'الكل' : 'All' },
    { key: 'event', label: isRtl ? 'فعاليات' : 'Events' },
    {
      key: 'seminar',
      label: t.nav.seminars || (isRtl ? 'الندوات' : 'Seminars'),
    },
    {
      key: 'project',
      label: t.nav.projects || (isRtl ? 'المشاريع' : 'Projects'),
    },
    {
      key: 'training',
      label: t.nav.training || (isRtl ? 'تدريب' : 'Training'),
    },
  ]

  const handleTypeChange = (type) => {
    const nextType = VALID_TYPES.includes(type) ? type : 'all'
    setActiveType(nextType)

    const params = new URLSearchParams(searchParams)

    if (nextType === 'all') {
      params.delete('type')
    } else {
      params.set('type', nextType)
    }

    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearch('')
    setDateFilter('latest')
    setActiveType('all')

    const params = new URLSearchParams(searchParams)
    params.delete('type')
    setSearchParams(params)
  }

  const hasActiveFilters =
    search.trim() || dateFilter !== 'latest' || activeType !== 'all'

  return (
    <main>
      <PageHeader
        title={t.nav.activities}
        subtitle={
          isRtl
            ? 'فعاليات وندوات ومشاريع وبرامج تدريبية'
            : 'Events, seminars, projects and training programs'
        }
      >
        <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-[1.5fr_1fr]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
              style={{ [isRtl ? 'right' : 'left']: '14px' }}
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isRtl ? 'ابحث في الفعاليات...' : 'Search events...'}
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              style={{
                paddingLeft: isRtl ? '14px' : '46px',
                paddingRight: isRtl ? '46px' : '14px',
              }}
            />
          </div>

          <div className="relative">
            <Calendar
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
              style={{ [isRtl ? 'right' : 'left']: '14px' }}
            />

            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 text-dark transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              style={{
                paddingLeft: isRtl ? '14px' : '44px',
                paddingRight: isRtl ? '44px' : '14px',
              }}
            >
              <option value="latest">
                {isRtl ? 'الأحدث أولاً' : 'Latest first'}
              </option>

              <option value="oldest">
                {isRtl ? 'الأقدم أولاً' : 'Oldest first'}
              </option>

              <option value="today">
                {isRtl ? 'اليوم' : 'Today'}
              </option>

              <option value="this_week">
                {isRtl ? 'هذا الأسبوع' : 'This week'}
              </option>

              <option value="this_month">
                {isRtl ? 'هذا الشهر' : 'This month'}
              </option>

              <option value="this_year">
                {isRtl ? 'هذا العام' : 'This year'}
              </option>
            </select>
          </div>
        </div>
      </PageHeader>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTypeChange(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  activeType === tab.key
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-primary/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-56 animate-pulse rounded-2xl border border-gray-100 bg-white"
                />
              ))}
            </div>
          ) : (
            <>
              {hasActiveFilters && (
                <div className="mb-5 flex flex-wrap items-center justify-center gap-3 text-sm">
                  <p className="text-gray-500">
                    {isRtl
                      ? `${filtered.length} نتيجة`
                      : `${filtered.length} results`}
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-primary/20 bg-white px-4 py-1.5 font-semibold text-primary transition hover:bg-primary hover:text-white"
                  >
                    {isRtl ? 'مسح الفلتر' : 'Clear filter'}
                  </button>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => {
                  const Icon = TYPE_ICONS[item?.type] || Calendar
                  const colorClass = TYPE_COLORS[item?.type] || TYPE_COLORS.event

                  const typeLabel = isRtl
                    ? TYPE_LABELS[item?.type]?.ar || item?.type || ''
                    : TYPE_LABELS[item?.type]?.en || item?.type || ''

                  const imageSrc = resolveMediaUrl(item?.image_url)
                  const title = getEventTitle(item, isRtl)
                  const location = getEventLocation(item, isRtl)
                  const content = getEventContent(item, isRtl)
                  const formattedDate = formatEventDate(
                    item?.event_date || item?.created_at,
                    isRtl
                  )
                  const isLong = content.length > LONG_TEXT_LIMIT

                  return (
                    <article
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedEvent(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedEvent(item)
                        }
                      }}
                      className="card-hover group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm outline-none transition focus:ring-4 focus:ring-primary/15"
                    >
                      {imageSrc ? (
                        <div className="relative h-44 overflow-hidden">
                          <img
                            src={imageSrc}
                            alt={title || typeLabel}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />

                          {typeLabel && (
                            <span
                              className={`absolute start-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}
                            >
                              {typeLabel}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-gray-100 text-gray-400">
                          <Icon size={28} />
                        </div>
                      )}

                      <div className="p-5">
                        {!imageSrc && typeLabel && (
                          <span
                            className={`mb-3 inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${colorClass}`}
                          >
                            {typeLabel}
                          </span>
                        )}

                        <h3 className="mb-3 line-clamp-2 text-base font-bold leading-snug text-dark">
                          {title}
                        </h3>

                        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          {formattedDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-primary" />
                              {formattedDate}
                            </span>
                          )}

                          {location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-primary" />
                              {location}
                            </span>
                          )}
                        </div>

                        {content && (
                          <p className="mb-3 line-clamp-2 whitespace-pre-line text-sm leading-6 text-gray-500">
                            {content}
                          </p>
                        )}

                        {isLong && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedEvent(item)
                            }}
                            className="inline-flex text-sm font-semibold text-primary transition hover:text-primary-dark hover:underline"
                          >
                            {isRtl ? 'اقرأ المزيد' : 'Read more'}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400">{t.no_items}</p>
            </div>
          )}
        </div>
      </section>

      {selectedEvent && (
        <EventDetailsModal
          item={selectedEvent}
          isRtl={isRtl}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </main>
  )
}

function EventDetailsModal({ item, isRtl, onClose }) {
  const Icon = TYPE_ICONS[item?.type] || Calendar
  const colorClass = TYPE_COLORS[item?.type] || TYPE_COLORS.event

  const typeLabel = isRtl
    ? TYPE_LABELS[item?.type]?.ar || item?.type || ''
    : TYPE_LABELS[item?.type]?.en || item?.type || ''

  const title = getEventTitle(item, isRtl)
  const location = getEventLocation(item, isRtl)
  const content = getEventContent(item, isRtl)
  const imageSrc = resolveMediaUrl(item?.image_url)
  const formattedDate = formatEventDate(item?.event_date || item?.created_at, isRtl)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <article
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={isRtl ? 'إغلاق' : 'Close'}
          className="absolute end-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-dark shadow-md transition hover:bg-primary hover:text-white"
        >
          <X size={20} />
        </button>

        {imageSrc ? (
          <div className="relative h-64 overflow-hidden rounded-t-3xl md:h-80">
            <img
              src={imageSrc}
              alt={title || typeLabel}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {typeLabel && (
              <span
                className={`absolute bottom-4 start-5 rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm ${colorClass}`}
              >
                {typeLabel}
              </span>
            )}
          </div>
        ) : (
          <div className="flex h-52 items-center justify-center rounded-t-3xl bg-gray-100 text-gray-400">
            <Icon size={44} />
          </div>
        )}

        <div className="p-5 md:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar size={15} className="text-primary" />
                {formattedDate}
              </span>
            )}

            {location && (
              <span className="flex items-center gap-1">
                <MapPin size={15} className="text-primary" />
                {location}
              </span>
            )}
          </div>

          <h2 className="mb-5 text-2xl font-bold leading-relaxed text-dark md:text-3xl">
            {title}
          </h2>

          {content && (
            <div className="whitespace-pre-line text-base leading-9 text-gray-600">
              {content}
            </div>
          )}
        </div>
      </article>
    </div>
  )
}

function getEventTitle(item, isRtl) {
  return isRtl ? item?.title || '' : item?.title_en || item?.title || ''
}

function getEventLocation(item, isRtl) {
  return isRtl
    ? item?.location || ''
    : item?.location_en || item?.location || ''
}

function getEventContent(item, isRtl) {
  return isRtl ? item?.content || '' : item?.content_en || item?.content || ''
}

function getEventTime(item) {
  const value = item?.event_date || item?.created_at || 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function formatEventDate(value, isRtl) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function matchesDateFilter(date, filter) {
  if (filter === 'latest' || filter === 'oldest') return true

  const itemDate = new Date(date)
  if (Number.isNaN(itemDate.getTime())) return false

  const now = new Date()

  const itemYear = itemDate.getFullYear()
  const itemMonth = itemDate.getMonth()
  const itemDay = itemDate.getDate()

  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth()
  const nowDay = now.getDate()

  if (filter === 'today') {
    return itemYear === nowYear && itemMonth === nowMonth && itemDay === nowDay
  }

  if (filter === 'this_month') {
    return itemYear === nowYear && itemMonth === nowMonth
  }

  if (filter === 'this_year') {
    return itemYear === nowYear
  }

  if (filter === 'this_week') {
    const startOfWeek = new Date(now)
    startOfWeek.setHours(0, 0, 0, 0)
    startOfWeek.setDate(now.getDate() - now.getDay())

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    return itemDate >= startOfWeek && itemDate < endOfWeek
  }

  return true
}
