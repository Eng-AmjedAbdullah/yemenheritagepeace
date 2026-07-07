import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import { useLang } from '../App'
import { PlayCircle, Video } from 'lucide-react'

export default function VideoGallery() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const data = await api.get('/gallery/video-collections')

        if (!cancelled) {
          setCollections(normalizeCollections(data))
        }
      } catch (error) {
        console.error('Failed to load video collections:', error)

        // Fallback for old flat gallery endpoint if migration is not applied yet
        try {
          const fallbackData = await api.get('/gallery/videos')
          const fallbackItems = Array.isArray(fallbackData) ? fallbackData : []

          if (!cancelled) {
            setCollections(
              fallbackItems.length
                ? [
                    {
                      id: 'legacy-videos',
                      title: 'معرض الفيديوهات',
                      title_en: 'Video Gallery',
                      description: '',
                      description_en: '',
                      type: 'video',
                      items: fallbackItems,
                    },
                  ]
                : []
            )
          }
        } catch {
          if (!cancelled) setCollections([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const getTitle = (item) => {
    if (!item) return ''
    if (isRtl) return item.title || item.title_en || ''
    return item.title_en || item.title || ''
  }

  const getDescription = (item) => {
    if (!item) return ''
    if (isRtl) return item.description || item.description_en || ''
    return item.description_en || item.description || ''
  }

  const totalVideos = collections.reduce((total, collection) => {
    return total + (collection.items?.length || 0)
  }, 0)

  return (
    <main dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader
        title={isRtl ? 'معرض الفيديوهات' : 'Video Gallery'}
        subtitle={
          isRtl
            ? 'معرض فيديوهات مقسم حسب الفعاليات والمشاريع والأنشطة المعرفية والثقافية.'
            : 'A divided video gallery organized by events, projects, and cultural activities.'
        }
      />

      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          {loading ? (
            <LoadingState text={isRtl ? 'جارٍ تحميل الفيديوهات...' : 'Loading videos...'} />
          ) : totalVideos === 0 ? (
            <EmptyState
              text={isRtl ? 'لا توجد مجموعات فيديو متاحة حاليًا.' : 'No video collections are available yet.'}
            />
          ) : (
            <div className="space-y-12">
              {collections.map((collection) => {
                const items = collection.items || []

                if (!items.length) return null

                return (
                  <section
                    key={collection.id}
                    className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
                  >
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {isRtl ? 'معرض فيديوهات مقسم' : 'Divided Video Collection'}
                        </span>

                        <h2 className="mt-3 text-2xl font-bold text-dark">
                          {getTitle(collection) || (isRtl ? 'مجموعة فيديوهات' : 'Video Collection')}
                        </h2>

                        {getDescription(collection) && (
                          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-500">
                            {getDescription(collection)}
                          </p>
                        )}
                      </div>

                      <div className="inline-flex w-fit rounded-2xl bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600">
                        {items.length} {isRtl ? 'فيديو' : 'Videos'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      {items.map((item, index) => (
                        <article
                          key={item.id || `${collection.id}-${index}`}
                          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                        >
                          <VideoPlayer
                            item={item}
                            title={getTitle(item) || getTitle(collection)}
                          />

                          <div className="p-4">
                            <div className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              {getTitle(collection)}
                            </div>

                            <h3 className="line-clamp-2 text-lg font-bold text-dark">
                              {getTitle(item) || `${getTitle(collection)} ${index + 1}`}
                            </h3>

                            {(getDescription(item) || getDescription(collection)) && (
                              <p className="mt-2 line-clamp-3 text-sm leading-7 text-gray-500">
                                {getDescription(item) || getDescription(collection)}
                              </p>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function VideoPlayer({ item, title }) {
  const videoUrl = item.video_url || ''
  const embedUrl = getEmbedUrl(videoUrl)
  const thumbnail = item.thumbnail_url || item.image_url

  if (isDirectVideo(videoUrl)) {
    return (
      <div className="aspect-video bg-black">
        <video
          controls
          preload="metadata"
          poster={thumbnail ? resolveMediaUrl(thumbnail) : undefined}
          className="h-full w-full"
        >
          <source src={resolveMediaUrl(videoUrl)} />
        </video>
      </div>
    )
  }

  if (embedUrl) {
    return (
      <div className="aspect-video bg-black">
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noreferrer"
      className="group relative flex aspect-video items-center justify-center overflow-hidden bg-gray-100"
    >
      {thumbnail ? (
        <img
          src={resolveMediaUrl(thumbnail)}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <Video size={42} className="text-primary" />
      )}

      <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/35" />

      <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition group-hover:scale-105">
        <PlayCircle size={34} />
      </div>
    </a>
  )
}

function getEmbedUrl(url) {
  if (!url) return ''

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')
    const pathname = parsed.pathname || ''

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v')

      if (id) return `https://www.youtube.com/embed/${id}`

      if (pathname.startsWith('/embed/')) {
        return url
      }

      if (pathname.startsWith('/shorts/')) {
        const shortId = pathname.split('/shorts/')[1]?.split('/')[0]

        if (shortId) {
          return `https://www.youtube.com/embed/${shortId}`
        }
      }
    }

    if (host === 'youtu.be') {
      const id = pathname.replace('/', '')

      if (id) {
        return `https://www.youtube.com/embed/${id}`
      }
    }

    if (host === 'vimeo.com') {
      const id = pathname.replace('/', '')

      if (id) {
        return `https://player.vimeo.com/video/${id}`
      }
    }

    if (host === 'player.vimeo.com' && pathname.startsWith('/video/')) {
      return url
    }

    return ''
  } catch {
    return ''
  }
}

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || '')
}

function normalizeCollections(data) {
  if (!Array.isArray(data)) return []

  return data
    .map((collection) => ({
      ...collection,
      items: Array.isArray(collection.items) ? collection.items : [],
    }))
    .filter((collection) => collection.items.length > 0)
}

function LoadingState({ text }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Video size={26} />
      </div>

      <p className="text-gray-500">{text}</p>
    </div>
  )
}
