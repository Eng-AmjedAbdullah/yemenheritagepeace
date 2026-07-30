import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Image as ImageIcon,
  Images,
  MapPin,
  PlayCircle,
  Video,
  X,
} from 'lucide-react'

import { useLang } from '../App'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import PageHeader from '../components/PageHeader'

export default function EventCollections() {
  const { eventId } = useParams()
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await api.get(`/events/${eventId}`, {
          loadingLabel: `event-${eventId}-collections`,
        })

        if (!cancelled) setEvent(data || null)
      } catch (loadError) {
        console.error('Failed to load event collections:', loadError)
        if (!cancelled) {
          setEvent(null)
          setError(
            loadError?.message ||
              (isRtl ? 'تعذر تحميل بيانات الفعالية' : 'Unable to load event data')
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [eventId, isRtl])

  useEffect(() => {
    if (!preview) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') setPreview(null)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [preview])

  const collections = useMemo(() => {
    return Array.isArray(event?.related_collections)
      ? event.related_collections.filter(
          (collection) => Array.isArray(collection.items) && collection.items.length > 0
        )
      : []
  }, [event])

  const title = getLocalized(event, 'title', isRtl)
  const location = getLocalized(event, 'location', isRtl)

  if (loading) return null

  return (
    <>
      <PageHeader
        title={
          title ||
          (isRtl ? 'مجموعات الفعالية' : 'Event Collections')
        }
        subtitle={
          isRtl
            ? 'الصور والفيديوهات المرتبطة بهذه الفعالية.'
            : 'Photo and video collections related to this event.'
        }
      >
        <Link
          to="/events"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-primary"
        >
          {isRtl ? <ArrowRight size={17} /> : <ArrowLeft size={17} />}
          {isRtl ? 'العودة إلى الفعاليات' : 'Back to events'}
        </Link>
      </PageHeader>

      <main className="bg-gray-50 py-10 md:py-14">
        <div className="container mx-auto px-4">
          {error ? (
            <EmptyState icon={Images} text={error} />
          ) : !event ? (
            <EmptyState
              icon={Calendar}
              text={isRtl ? 'الفعالية غير موجودة' : 'Event not found'}
            />
          ) : (
            <>
              <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500">
                  {event.event_date && (
                    <span className="inline-flex items-center gap-2">
                      <Calendar size={17} className="text-primary" />
                      {formatDate(event.event_date, isRtl)}
                    </span>
                  )}
                  {location && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={17} className="text-primary" />
                      {location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 font-bold text-primary">
                    <Images size={17} />
                    {collections.length}{' '}
                    {isRtl ? 'مجموعة مرتبطة' : 'related collections'}
                  </span>
                </div>
              </section>

              {collections.length === 0 ? (
                <EmptyState
                  icon={Images}
                  text={
                    isRtl
                      ? 'لا توجد مجموعات صور أو فيديو مرتبطة بهذه الفعالية.'
                      : 'No photo or video collections are linked to this event.'
                  }
                />
              ) : (
                <div className="space-y-9">
                  {collections.map((collection) => (
                    <CollectionSection
                      key={collection.id}
                      collection={collection}
                      isRtl={isRtl}
                      onPreview={(item, index) =>
                        setPreview({ collection, item, index })
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {preview && (
        <PhotoPreview
          preview={preview}
          isRtl={isRtl}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  )
}

function CollectionSection({ collection, isRtl, onPreview }) {
  const title = getLocalized(collection, 'title', isRtl)
  const items = Array.isArray(collection.items) ? collection.items : []
  const isVideoCollection = collection.type === 'video'

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
            {isVideoCollection ? <Video size={15} /> : <ImageIcon size={15} />}
            {isVideoCollection
              ? isRtl
                ? 'مجموعة فيديو'
                : 'Video collection'
              : isRtl
                ? 'مجموعة صور'
                : 'Photo collection'}
          </p>
          <h2 className="text-xl font-bold text-dark sm:text-2xl">
            {title || (isVideoCollection ? 'Video Collection' : 'Photo Collection')}
          </h2>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
          {items.length}{' '}
          {isVideoCollection
            ? isRtl
              ? 'فيديو'
              : 'videos'
            : isRtl
              ? 'صورة'
              : 'photos'}
        </span>
      </div>

      {isVideoCollection ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.id || `${collection.id}-${index}`}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
            >
              <VideoPlayer
                item={item}
                title={getLocalized(item, 'title', isRtl) || `${title} ${index + 1}`}
              />
              <div className="p-4">
                <h3 className="line-clamp-2 font-bold text-dark">
                  {getLocalized(item, 'title', isRtl) || `${title} ${index + 1}`}
                </h3>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => (
            <button
              key={item.id || `${collection.id}-${index}`}
              type="button"
              onClick={() => onPreview(item, index)}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 text-start shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              {item.image_url ? (
                <img
                  src={resolveMediaUrl(item.image_url)}
                  alt={getLocalized(item, 'title', isRtl) || title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-primary/50">
                  <ImageIcon size={38} />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                <h3 className="line-clamp-2 text-sm font-bold text-white">
                  {getLocalized(item, 'title', isRtl) || title}
                </h3>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function VideoPlayer({ item, title }) {
  const videoUrl = resolveMediaUrl(item.video_url || '')
  const embedUrl = getEmbedUrl(item.video_url || '')
  const thumbnail = resolveMediaUrl(item.thumbnail_url || item.image_url || '')

  if (isDirectVideo(item.video_url)) {
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
        />
      ) : (
        <Video size={42} className="text-primary" />
      )}
      <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/35" />
      <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg">
        <PlayCircle size={34} />
      </div>
    </a>
  )
}

function PhotoPreview({ preview, isRtl, onClose }) {
  const collectionTitle = getLocalized(preview.collection, 'title', isRtl)
  const itemTitle = getLocalized(preview.item, 'title', isRtl) || collectionTitle

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/90 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-6xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute end-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black"
          aria-label={isRtl ? 'إغلاق' : 'Close'}
        >
          <X size={21} />
        </button>
        <img
          src={resolveMediaUrl(preview.item.image_url)}
          alt={itemTitle}
          className="max-h-[82vh] w-full rounded-2xl object-contain"
        />
        <div className="mt-3 text-center text-white">
          <p className="text-xs text-white/65">{collectionTitle}</p>
          <h3 className="mt-1 text-lg font-bold">{itemTitle}</h3>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={27} />
      </div>
      <p className="text-gray-500">{text}</p>
    </div>
  )
}

function getLocalized(item, key, isRtl) {
  if (!item) return ''

  return isRtl
    ? item[key] || item[`${key}_en`] || ''
    : item[`${key}_en`] || item[key] || ''
}

function formatDate(value, isRtl) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
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
        const idFromShorts = path.split('/shorts/')[1]?.split('/')[0]
        if (idFromShorts) return `https://www.youtube.com/embed/${idFromShorts}`
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
