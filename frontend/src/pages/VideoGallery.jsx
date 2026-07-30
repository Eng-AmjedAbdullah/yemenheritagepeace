import { useEffect, useMemo, useState } from 'react'
import { PlayCircle, Video } from 'lucide-react'

import PageHeader from '../components/PageHeader'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import { useLang } from '../App'

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
        const data = await api.get('/gallery/video-collections', {
          loadingLabel: 'public-video-collections',
        })
        if (!cancelled) setCollections(normalizeCollections(data))
      } catch (error) {
        console.error('Failed to load video collections:', error)

        try {
          const fallbackData = await api.get('/gallery/videos', {
            loadingLabel: 'public-video-gallery-fallback',
          })
          const items = Array.isArray(fallbackData) ? fallbackData : []

          if (!cancelled) {
            setCollections(
              items.length
                ? [
                    {
                      id: 'legacy-videos',
                      title: 'معرض الفيديوهات',
                      title_en: 'Video Gallery',
                      type: 'video',
                      items,
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

  const totalVideos = useMemo(
    () =>
      collections.reduce(
        (total, collection) => total + (collection.items?.length || 0),
        0
      ),
    [collections]
  )

  return (
    <>
      <PageHeader
        title={isRtl ? 'معرض الفيديو' : 'Video Gallery'}
        subtitle={
          isRtl
            ? 'فيديوهات توثق فعاليات المنظمة ومشاريعها وأنشطتها.'
            : 'Videos documenting the organization’s events, projects, and activities.'
        }
      />

      <main className="bg-gray-50 py-10 md:py-14">
        <div className="container mx-auto px-4">
          {loading ? null : totalVideos === 0 ? (
            <EmptyState
              text={isRtl ? 'لا توجد فيديوهات متاحة حالياً' : 'No videos are available'}
            />
          ) : (
            <div className="space-y-9">
              {collections.map((collection) => {
                const items = collection.items || []
                if (!items.length) return null

                return (
                  <section
                    key={collection.id}
                    className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7"
                  >
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-bold text-dark sm:text-2xl">
                        {getTitle(collection, isRtl) ||
                          (isRtl ? 'مجموعة فيديوهات' : 'Video Collection')}
                      </h2>
                      <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                        {items.length} {isRtl ? 'فيديو' : 'Videos'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {items.map((item, index) => {
                        const title =
                          getTitle(item, isRtl) ||
                          `${getTitle(collection, isRtl)} ${index + 1}`

                        return (
                          <article
                            key={item.id || `${collection.id}-${index}`}
                            className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm"
                          >
                            <VideoPlayer item={item} title={title} />
                            <div className="p-4">
                              <h3 className="line-clamp-2 font-bold text-dark">
                                {title}
                              </h3>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function VideoPlayer({ item, title }) {
  const rawUrl = item.video_url || ''
  const videoUrl = resolveMediaUrl(rawUrl)
  const embedUrl = getEmbedUrl(rawUrl)
  const thumbnail = resolveMediaUrl(item.thumbnail_url || item.image_url || '')

  if (isDirectVideo(rawUrl)) {
    return (
      <video
        controls
        preload="metadata"
        poster={thumbnail || undefined}
        className="aspect-video w-full bg-black object-contain"
      >
        <source src={videoUrl} />
      </video>
    )
  }

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        className="aspect-video w-full bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
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
          src={thumbnail}
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

function getTitle(item, isRtl) {
  if (!item) return ''

  return isRtl
    ? item.title || item.title_en || ''
    : item.title_en || item.title || ''
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

function getEmbedUrl(url) {
  if (!url) return ''

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')
    const path = parsed.pathname || ''

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      if (path.startsWith('/embed/')) return url
      if (path.startsWith('/shorts/')) {
        const shortId = path.split('/shorts/')[1]?.split('/')[0]
        if (shortId) return `https://www.youtube.com/embed/${shortId}`
      }
    }

    if (host === 'youtu.be') {
      const id = path.replace('/', '')
      if (id) return `https://www.youtube.com/embed/${id}`
    }

    if (host === 'vimeo.com') {
      const id = path.replace('/', '')
      if (id) return `https://player.vimeo.com/video/${id}`
    }

    if (host === 'player.vimeo.com' && path.startsWith('/video/')) {
      return url
    }

    return ''
  } catch {
    return ''
  }
}

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url || '')
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Video size={27} />
      </div>
      <p className="text-gray-500">{text}</p>
    </div>
  )
}
