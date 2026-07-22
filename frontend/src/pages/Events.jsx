import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Briefcase,
  Calendar,
  ExternalLink,
  GraduationCap,
  Images,
  MapPin,
  Search,
  X,
} from 'lucide-react'

import { useLang } from '../App'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import PageHeader from '../components/PageHeader'

const TYPE_LABELS = {
  event: { ar: 'فعالية', en: 'Event' },
  seminar: { ar: 'ندوة', en: 'Seminar' },
  project: { ar: 'مشروع', en: 'Project' },
  training: { ar: 'تدريب', en: 'Training' },
}

const TYPE_COLORS = {
  event: 'border-blue-100 bg-blue-50 text-blue-700',
  seminar: 'border-purple-100 bg-purple-50 text-purple-700',
  project: 'border-green-100 bg-green-50 text-green-700',
  training: 'border-amber-100 bg-amber-50 text-amber-700',
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
  const isRtl = lang === 'ar'
  const [searchParams, setSearchParams] = useSearchParams()

  const typeFromUrl = searchParams.get('type') || 'all'
  const [events, setEvents] = useState([])
  const [activeType, setActiveType] = useState(
    VALID_TYPES.includes(typeFromUrl) ? typeFromUrl : 'all'
  )
  const [dateFilter, setDateFilter] = useState('latest')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    setActiveType(VALID_TYPES.includes(typeFromUrl) ? typeFromUrl : 'all')
  }, [typeFromUrl])

  useEffect(() => {
    let cancelled = false

    const loadEvents = async () => {
      setLoading(true)

      try {
        const data = await api.get('/events', {
          loadingLabel: 'public-events',
        })

        if (!cancelled) {
          setEvents(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Failed to load events:', error)
        if (!cancelled) setEvents([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadEvents()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedEvent) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedEvent(null)
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [selectedEvent])

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const result = events.filter((item) => {
      const matchesType = activeType === 'all' || item.type === activeType
      const matchesSearch =
        !normalizedSearch ||
        [
          getEventTitle(item, isRtl),
          getEventLocation(item, isRtl),
          getEventContent(item, isRtl),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      const matchesDate = matchesDateFilter(
        item.event_date || item.created_at,
        dateFilter
      )

      return matchesType && matchesSearch && matchesDate
    })

    return result.sort((a, b) => {
      const first = getEventTime(a)
      const second = getEventTime(b)
      return dateFilter === 'oldest' ? first - second : second - first
    })
  }, [events, activeType, search, dateFilter, isRtl])

  const tabs = [
    { key: 'all', label: isRtl ? 'الكل' : 'All' },
    { key: 'event', label: isRtl ? 'فعاليات' : 'Events' },
    {
      key: 'seminar',
      label: t.nav?.seminars || (isRtl ? 'الندوات' : 'Seminars'),
    },
    {
      key: 'project',
      label: t.nav?.projects || (isRtl ? 'المشاريع' : 'Projects'),
    },
    {
      key: 'training',
      label: t.nav?.training || (isRtl ? 'تدريب' : 'Training'),
    },
  ]

  const handleTypeChange = (type) => {
    const nextType = VALID_TYPES.includes(type) ? type : 'all'
    setActiveType(nextType)

    const params = new URLSearchParams(searchParams)
    if (nextType === 'all') params.delete('type')
    else params.set('type', nextType)
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearch('')
    setDateFilter('latest')
    handleTypeChange('all')
  }

  const hasActiveFilters =
    search.trim() || dateFilter !== 'latest' || activeType !== 'all'

  return (
    <>
      <PageHeader
        title={isRtl ? 'الفعاليات والبرامج' : 'Events and Programs'}
        subtitle={
          isRtl
            ? 'اطّلع على فعاليات المنظمة ومشاريعها وندواتها وبرامجها التدريبية.'
            : 'Explore the organization’s events, projects, seminars, and training programs.'
        }
      />

      <section className="bg-gray-50 py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mb-7 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
              <label className="search-field">
                <Search size={18} className="search-icon" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={isRtl ? 'ابحث في الفعاليات...' : 'Search events...'}
                  className="input-field"
                />
              </label>

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="input-field"
              >
                <option value="latest">{isRtl ? 'الأحدث أولاً' : 'Latest first'}</option>
                <option value="oldest">{isRtl ? 'الأقدم أولاً' : 'Oldest first'}</option>
                <option value="today">{isRtl ? 'اليوم' : 'Today'}</option>
                <option value="this_week">{isRtl ? 'هذا الأسبوع' : 'This week'}</option>
                <option value="this_month">{isRtl ? 'هذا الشهر' : 'This month'}</option>
                <option value="this_year">{isRtl ? 'هذا العام' : 'This year'}</option>
              </select>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTypeChange(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeType === tab.key
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm">
                <span className="font-semibold text-gray-500">
                  {isRtl ? `${filtered.length} نتيجة` : `${filtered.length} results`}
                </span>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-semibold text-primary hover:underline"
                >
                  {isRtl ? 'مسح الفلتر' : 'Clear filters'}
                </button>
              </div>
            )}
          </div>

          {loading ? null : filtered.length === 0 ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
              <Calendar size={34} className="mx-auto mb-3 text-primary/60" />
              <p className="text-gray-500">{t.no_items || (isRtl ? 'لا توجد عناصر' : 'No items')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <EventCard
                  key={item.id}
                  item={item}
                  isRtl={isRtl}
                  onOpen={() => setSelectedEvent(item)}
                />
              ))}
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
    </>
  )
}

function EventCard({ item, isRtl, onOpen }) {
  const Icon = TYPE_ICONS[item.type] || Calendar
  const title = getEventTitle(item, isRtl)
  const content = getEventContent(item, isRtl)
  const location = getEventLocation(item, isRtl)
  const image = resolveMediaUrl(item.image_url)
  const collectionCount = Number(item.related_collections_count) || 0

  return (
    <article className="card-hover group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-start"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-primary/5 text-primary/55">
              <Icon size={52} />
            </div>
          )}
          <span
            className={`absolute top-3 rounded-full border px-3 py-1 text-xs font-bold ${
              isRtl ? 'right-3' : 'left-3'
            } ${TYPE_COLORS[item.type] || TYPE_COLORS.event}`}
          >
            {TYPE_LABELS[item.type]?.[isRtl ? 'ar' : 'en'] || item.type}
          </span>
        </div>

        <div className="p-5">
          <h2 className="line-clamp-2 text-lg font-bold leading-8 text-dark">{title}</h2>
          <div className="mt-3 space-y-2 text-sm text-gray-500">
            <p className="flex items-center gap-2">
              <Calendar size={15} className="text-primary" />
              {formatEventDate(item.event_date || item.created_at, isRtl)}
            </p>
            {location && (
              <p className="flex items-center gap-2">
                <MapPin size={15} className="text-primary" />
                <span className="line-clamp-1">{location}</span>
              </p>
            )}
          </div>
          {content && <p className="mt-4 line-clamp-3 text-sm leading-7 text-gray-600">{content}</p>}
          {content.length > LONG_TEXT_LIMIT && (
            <span className="mt-3 inline-flex text-sm font-bold text-primary">
              {isRtl ? 'اقرأ المزيد' : 'Read more'}
            </span>
          )}
        </div>
      </button>

      {collectionCount > 0 && (
        <div className="border-t border-gray-100 p-4">
          <Link
            to={`/events/${item.id}/collections`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
          >
            <Images size={17} />
            {isRtl
              ? `عرض المجموعات المرتبطة (${collectionCount})`
              : `View related collections (${collectionCount})`}
            <ExternalLink size={14} />
          </Link>
        </div>
      )}
    </article>
  )
}

function EventDetailsModal({ item, isRtl, onClose }) {
  const Icon = TYPE_ICONS[item.type] || Calendar
  const title = getEventTitle(item, isRtl)
  const content = getEventContent(item, isRtl)
  const location = getEventLocation(item, isRtl)
  const image = resolveMediaUrl(item.image_url)
  const collectionCount = Number(item.related_collections_count) || 0

  return (
    <div
      className="modal-overlay admin-modal-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="admin-modal-panel max-w-3xl" dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="admin-modal-header">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${TYPE_COLORS[item.type] || TYPE_COLORS.event}`}>
              <Icon size={20} />
            </span>
            <div>
              <p className="text-xs font-bold text-primary">
                {TYPE_LABELS[item.type]?.[isRtl ? 'ar' : 'en'] || item.type}
              </p>
              <h2 className="mt-1 text-lg font-bold text-dark sm:text-xl">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-dark"
            aria-label={isRtl ? 'إغلاق' : 'Close'}
          >
            <X size={19} />
          </button>
        </header>

        <div className="admin-modal-body">
          {image && (
            <img src={image} alt={title} className="mb-5 aspect-[16/8] w-full rounded-2xl object-cover" />
          )}
          <div className="mb-5 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              {formatEventDate(item.event_date || item.created_at, isRtl)}
            </span>
            {location && (
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                {location}
              </span>
            )}
          </div>
          {content && <p className="whitespace-pre-line text-sm leading-8 text-gray-700 sm:text-base">{content}</p>}
        </div>

        {collectionCount > 0 && (
          <footer className="admin-modal-footer">
            <Link
              to={`/events/${item.id}/collections`}
              onClick={onClose}
              className="btn-primary w-full justify-center sm:w-auto"
            >
              <Images size={17} />
              {isRtl ? 'عرض الصور والفيديوهات المرتبطة' : 'View related photos and videos'}
            </Link>
          </footer>
        )}
      </section>
    </div>
  )
}

function getEventTitle(item, isRtl) {
  return isRtl
    ? item?.title || item?.title_en || ''
    : item?.title_en || item?.title || ''
}

function getEventLocation(item, isRtl) {
  return isRtl
    ? item?.location || item?.location_en || ''
    : item?.location_en || item?.location || ''
}

function getEventContent(item, isRtl) {
  return isRtl
    ? item?.content || item?.content_en || ''
    : item?.content_en || item?.content || ''
}

function getEventTime(item) {
  const time = new Date(item?.event_date || item?.created_at || 0).getTime()
  return Number.isNaN(time) ? 0 : time
}

function formatEventDate(value, isRtl) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function matchesDateFilter(value, filter) {
  if (filter === 'latest' || filter === 'oldest') return true

  const itemDate = new Date(value)
  if (Number.isNaN(itemDate.getTime())) return false

  const now = new Date()

  if (filter === 'today') {
    return itemDate.toDateString() === now.toDateString()
  }

  if (filter === 'this_month') {
    return itemDate.getFullYear() === now.getFullYear() && itemDate.getMonth() === now.getMonth()
  }

  if (filter === 'this_year') {
    return itemDate.getFullYear() === now.getFullYear()
  }

  if (filter === 'this_week') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    start.setDate(now.getDate() - now.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return itemDate >= start && itemDate < end
  }

  return true
}
