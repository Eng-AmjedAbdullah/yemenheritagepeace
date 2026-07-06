import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import { useLang } from '../App'
import { PlayCircle, Video } from 'lucide-react'

export default function VideoGallery() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const data = await api.get('/gallery/videos')
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : [])
        }
      } catch {
        if (!cancelled) setItems([])
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
    if (isRtl) return item.title || item.title_en || ''
    return item.title_en || item.title || ''
  }

  const getDescription = (item) => {
    if (isRtl) return item.description || item.description_en || ''
    return item.description_en || item.description || ''
  }

  return (
    <main dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader
        title={isRtl ? 'معرض الفيديو' : 'Video Gallery'}
        subtitle={
          isRtl
            ? 'مقاطع مرئية توثق الفعاليات والمشاريع والأنشطة المعرفية والثقافية.'
            : 'Videos documenting events, projects, and cultural and knowledge-based activities.'
        }
      />

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          {loading ? (
            <LoadingState text={isRtl ? 'جارٍ تحميل الفيديوهات...' : 'Loading videos...'} />
          ) : items.length === 0 ? (
            <EmptyState text={isRtl ? 'لا توجد فيديوهات متاحة حاليًا.' : 'No videos are available yet.'} />
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <VideoPlayer item={item} title={getTitle(item)} />

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-dark">
                      {getTitle(item)}
                    </h3>

                    {getDescription(item) && (
                      <p className="mt-2 text-sm leading-7 text-gray-500">
                        {getDescription(item)}
                      </p>
                    )}
                  </div>
                </article>
              ))}
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
          <source src={videoUrl} />
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
        />
      ) : (
        <Video size={42} className="text-primary" />
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
        <PlayCircle size={58} className="text-white drop-shadow-lg" />
      </div>
    </a>
  )
}

function getEmbedUrl(url) {
  if (!url) return ''

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      if (parsed.pathname.startsWith('/embed/')) return url
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace('/', '')
      if (id) return `https://www.youtube.com/embed/${id}`
    }

    if (host === 'vimeo.com') {
      const id = parsed.pathname.replace('/', '')
      if (id) return `https://player.vimeo.com/video/${id}`
    }

    return ''
  } catch {
    return ''
  }
}

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url || '')
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
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Video size={26} />
      </div>

      <p className="text-gray-500">{text}</p>
    </div>
  )
}
