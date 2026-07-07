import { useState, useEffect, useMemo } from 'react'
import { useLang } from '../App'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import { Search, Newspaper, Calendar, X, Filter } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const DEFAULT_NEWS_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/The_castle_above_Taiz_%288683935588%29.jpg/800px-The_castle_above_Taiz_%288683935588%29.jpg'

const LONG_TEXT_LIMIT = 180

export default function News() {
  const { t, lang } = useLang()

  const [news, setNews] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateOrder, setDateOrder] = useState('latest')
  const [loading, setLoading] = useState(true)
  const [selectedNews, setSelectedNews] = useState(null)

  const isRtl = lang === 'ar'

  useEffect(() => {
    let alive = true

    setLoading(true)

    api
      .get('/news?limit=100')
      .then((data) => {
        if (!alive) return
        setNews(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!alive) return
        setNews([])
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!selectedNews) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedNews(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [selectedNews])

  const categories = useMemo(() => {
    const map = new Map()

    news.forEach((item) => {
      const categoryAr = item?.category || ''
      const categoryEn = item?.category_en || item?.category || ''
      const value = categoryAr || categoryEn

      if (!value) return

      map.set(value, {
        value,
        label: isRtl ? categoryAr || categoryEn : categoryEn || categoryAr,
      })
    })

    return Array.from(map.values())
  }, [news, isRtl])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    const result = news.filter((item) => {
      const title = getNewsTitle(item, isRtl).toLowerCase()
      const content = getNewsContent(item, isRtl).toLowerCase()
      const category = getNewsCategory(item, isRtl).toLowerCase()

      const matchesSearch =
        !q ||
        title.includes(q) ||
        content.includes(q) ||
        category.includes(q)

      const matchesCategory =
        categoryFilter === 'all' ||
        item?.category === categoryFilter ||
        item?.category_en === categoryFilter

      return matchesSearch && matchesCategory
    })

    return result.sort((a, b) => {
      const dateA = new Date(a?.created_at || 0).getTime()
      const dateB = new Date(b?.created_at || 0).getTime()

      if (dateOrder === 'oldest') {
        return dateA - dateB
      }

      return dateB - dateA
    })
  }, [news, search, categoryFilter, dateOrder, isRtl])

  const openNews = (item) => {
    setSelectedNews(item)
  }

  const closeNews = () => {
    setSelectedNews(null)
  }

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setDateOrder('latest')
  }

  return (
    <main>
      <PageHeader
        title={t.nav.news}
        subtitle={
          isRtl
            ? 'آخر الأخبار والتحديثات من المنظمة'
            : 'Latest updates and announcements'
        }
      >
        <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
              style={{ [isRtl ? 'right' : 'left']: '14px' }}
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isRtl ? 'ابحث في الأخبار...' : 'Search news...'}
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              style={{
                paddingLeft: isRtl ? '14px' : '46px',
                paddingRight: isRtl ? '46px' : '14px',
              }}
            />
          </div>

          <div className="relative">
            <Filter
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
              style={{ [isRtl ? 'right' : 'left']: '14px' }}
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 text-dark transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              style={{
                paddingLeft: isRtl ? '14px' : '44px',
                paddingRight: isRtl ? '44px' : '14px',
              }}
            >
              <option value="all">
                {isRtl ? 'كل التصنيفات' : 'All categories'}
              </option>

              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
              style={{ [isRtl ? 'right' : 'left']: '14px' }}
            />

            <select
              value={dateOrder}
              onChange={(event) => setDateOrder(event.target.value)}
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
            </select>
          </div>
        </div>
      </PageHeader>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white"
                />
              ))}
            </div>
          ) : (
            <>
              {(search || categoryFilter !== 'all' || dateOrder !== 'latest') && (
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
                    {isRtl ? 'مسح الفلاتر' : 'Clear filters'}
                  </button>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => {
                  const title = getNewsTitle(item, isRtl)
                  const content = getNewsContent(item, isRtl)
                  const category = getNewsCategory(item, isRtl)
                  const imageUrl =
                    resolveMediaUrl(item.image_url) || DEFAULT_NEWS_IMAGE
                  const isLong = content.length > LONG_TEXT_LIMIT

                  return (
                    <article
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openNews(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openNews(item)
                        }
                      }}
                      className="card-hover group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm outline-none transition focus:ring-4 focus:ring-primary/15"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />

                        {category && (
                          <span className="absolute start-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                            {category}
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-dark">
                          {title}
                        </h3>

                        <p className="mb-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-gray-500">
                          {content}
                        </p>

                        {isLong && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openNews(item)
                            }}
                            className="mb-3 inline-flex text-sm font-semibold text-primary transition hover:text-primary-dark hover:underline"
                          >
                            {isRtl ? 'اقرأ المزيد' : 'Read more'}
                          </button>
                        )}

                        <div className="flex items-center gap-1 border-t border-gray-50 pt-3 text-xs text-gray-400">
                          <Calendar size={12} />
                          {formatDate(item.created_at, isRtl)}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <Newspaper size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400">{t.no_items}</p>
            </div>
          )}
        </div>
      </section>

      {selectedNews && (
        <NewsDetailsModal
          item={selectedNews}
          isRtl={isRtl}
          onClose={closeNews}
        />
      )}
    </main>
  )
}

function NewsDetailsModal({ item, isRtl, onClose }) {
  const title = getNewsTitle(item, isRtl)
  const content = getNewsContent(item, isRtl)
  const category = getNewsCategory(item, isRtl)
  const imageUrl = resolveMediaUrl(item.image_url) || DEFAULT_NEWS_IMAGE

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

        <div className="relative h-64 overflow-hidden rounded-t-3xl md:h-80">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {category && (
            <span className="absolute bottom-4 start-5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-sm">
              {category}
            </span>
          )}
        </div>

        <div className="p-5 md:p-8">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <Calendar size={15} />
            {formatDate(item.created_at, isRtl)}
          </div>

          <h2 className="mb-5 text-2xl font-bold leading-relaxed text-dark md:text-3xl">
            {title}
          </h2>

          <div className="whitespace-pre-line text-base leading-9 text-gray-600">
            {content}
          </div>
        </div>
      </article>
    </div>
  )
}

function getNewsTitle(item, isRtl) {
  return isRtl ? item?.title || '' : item?.title_en || item?.title || ''
}

function getNewsContent(item, isRtl) {
  return isRtl ? item?.content || '' : item?.content_en || item?.content || ''
}

function getNewsCategory(item, isRtl) {
  return isRtl ? item?.category || '' : item?.category_en || item?.category || ''
}

function formatDate(date, isRtl) {
  if (!date) return '—'

  try {
    return new Date(date).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}
