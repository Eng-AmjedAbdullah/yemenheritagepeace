import { useEffect, useMemo, useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'

import PageHeader from '../components/PageHeader'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import { useLang } from '../App'

export default function PhotoGallery() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const data = await api.get('/gallery/photo-collections', {
          loadingLabel: 'public-photo-collections',
        })
        if (!cancelled) setCollections(normalizeCollections(data))
      } catch (error) {
        console.error('Failed to load photo collections:', error)

        try {
          const fallbackData = await api.get('/gallery/photos', {
            loadingLabel: 'public-photo-gallery-fallback',
          })
          const items = Array.isArray(fallbackData) ? fallbackData : []

          if (!cancelled) {
            setCollections(
              items.length
                ? [
                    {
                      id: 'legacy-photos',
                      title: 'معرض الصور',
                      title_en: 'Photo Gallery',
                      type: 'photo',
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

  useEffect(() => {
    if (!preview) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPreview(null)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [preview])

  const totalPhotos = useMemo(
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
        title={isRtl ? 'معرض الصور' : 'Photo Gallery'}
        subtitle={
          isRtl
            ? 'مجموعات مختارة من صور فعاليات ومشاريع المنظمة.'
            : 'Selected photo collections from the organization’s events and projects.'
        }
      />

      <main className="bg-gray-50 py-10 md:py-14">
        <div className="container mx-auto px-4">
          {loading ? null : totalPhotos === 0 ? (
            <EmptyState
              text={isRtl ? 'لا توجد صور متاحة حالياً' : 'No photos are available'}
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
                          (isRtl ? 'مجموعة صور' : 'Photo Collection')}
                      </h2>
                      <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                        {items.length} {isRtl ? 'صورة' : 'Photos'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {items.map((item, index) => (
                        <button
                          key={item.id || `${collection.id}-${index}`}
                          type="button"
                          onClick={() => setPreview({ collection, item, index })}
                          className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 text-start shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                          {item.image_url ? (
                            <img
                              src={resolveMediaUrl(item.image_url)}
                              alt={getTitle(item, isRtl) || getTitle(collection, isRtl)}
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
                              {getTitle(item, isRtl) || getTitle(collection, isRtl)}
                            </h3>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/90 p-4"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setPreview(null)
          }
        >
          <div className="relative w-full max-w-6xl">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute end-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black"
              aria-label={isRtl ? 'إغلاق' : 'Close'}
            >
              <X size={21} />
            </button>

            <img
              src={resolveMediaUrl(preview.item.image_url)}
              alt={getTitle(preview.item, isRtl)}
              className="max-h-[82vh] w-full rounded-2xl object-contain"
            />

            <div className="mt-3 text-center text-white">
              <p className="text-xs text-white/65">
                {getTitle(preview.collection, isRtl)}
              </p>
              <h3 className="mt-1 text-lg font-bold">
                {getTitle(preview.item, isRtl) ||
                  getTitle(preview.collection, isRtl)}
              </h3>
            </div>
          </div>
        </div>
      )}
    </>
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

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ImageIcon size={27} />
      </div>
      <p className="text-gray-500">{text}</p>
    </div>
  )
}
