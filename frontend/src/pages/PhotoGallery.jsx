import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import { useLang } from '../App'
import { Image as ImageIcon, X } from 'lucide-react'

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
        const data = await api.get('/gallery/photo-collections')

        if (!cancelled) {
          setCollections(normalizeCollections(data))
        }
      } catch (error) {
        console.error('Failed to load photo collections:', error)

        // Fallback for old flat gallery endpoint if migration is not applied yet
        try {
          const fallbackData = await api.get('/gallery/photos')
          const fallbackItems = Array.isArray(fallbackData) ? fallbackData : []

          if (!cancelled) {
            setCollections(
              fallbackItems.length
                ? [
                    {
                      id: 'legacy-photos',
                      title: 'معرض الصور',
                      title_en: 'Photo Gallery',
                      description: '',
                      description_en: '',
                      type: 'photo',
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

  const totalPhotos = collections.reduce((total, collection) => {
    return total + (collection.items?.length || 0)
  }, 0)

  return (
    <main dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader
        title={isRtl ? 'معرض الصور' : 'Photo Gallery'}
        subtitle={
          isRtl
            ? 'مجموعات بصرية توثق أنشطة المنظمة ومبادراتها ومشاركاتها المجتمعية.'
            : 'Visual collections documenting the organization’s activities, initiatives, and community engagement.'
        }
      />

      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          {loading ? (
            <LoadingState text={isRtl ? 'جارٍ تحميل الصور...' : 'Loading photos...'} />
          ) : totalPhotos === 0 ? (
            <EmptyState
              text={isRtl ? 'لا توجد مجموعات صور متاحة حاليًا.' : 'No photo collections are available yet.'}
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
                          {items.length} {isRtl ? 'صورة' : 'Photos'}
                        </span>

                        <h2 className="mt-3 text-2xl font-bold text-dark">
                          {getTitle(collection) || (isRtl ? 'مجموعة صور' : 'Photo Collection')}
                        </h2>

                        {getDescription(collection) && (
                          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-500">
                            {getDescription(collection)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {items.map((item, index) => (
                        <button
                          type="button"
                          key={item.id || `${collection.id}-${index}`}
                          onClick={() =>
                            setPreview({
                              collection,
                              item,
                              index,
                            })
                          }
                          className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 text-start shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                          {item.image_url ? (
                            <img
                              src={resolveMediaUrl(item.image_url)}
                              alt={getTitle(item) || getTitle(collection)}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <ImageIcon size={32} />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/25" />

                          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/75 to-transparent p-3 text-white transition group-hover:translate-y-0">
                            <h3 className="line-clamp-1 text-sm font-bold">
                              {getTitle(item) || getTitle(collection)}
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
      </section>

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          onClick={(event) => event.target === event.currentTarget && setPreview(null)}
        >
          <div className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute end-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black"
              aria-label={isRtl ? 'إغلاق' : 'Close'}
            >
              <X size={20} />
            </button>

            <div className="bg-black">
              <img
                src={resolveMediaUrl(preview.item.image_url)}
                alt={getTitle(preview.item) || getTitle(preview.collection)}
                className="max-h-[75vh] w-full object-contain"
              />
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {getTitle(preview.collection)}
              </div>

              <h3 className="text-lg font-bold text-dark">
                {getTitle(preview.item) || getTitle(preview.collection)}
              </h3>

              {(getDescription(preview.item) || getDescription(preview.collection)) && (
                <p className="mt-2 text-sm leading-7 text-gray-500">
                  {getDescription(preview.item) || getDescription(preview.collection)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
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
        <ImageIcon size={26} />
      </div>

      <p className="text-gray-500">{text}</p>
    </div>
  )
}
