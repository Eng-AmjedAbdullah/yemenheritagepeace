import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import { useLang } from '../App'
import { Image as ImageIcon, X } from 'lucide-react'

export default function PhotoGallery() {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const data = await api.get('/gallery/photos')
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
        title={isRtl ? 'معرض الصور' : 'Photo Gallery'}
        subtitle={
          isRtl
            ? 'مساحة بصرية توثق أنشطة المنظمة ومبادراتها ومشاركاتها المجتمعية.'
            : 'A visual space documenting the organization’s activities, initiatives, and community engagement.'
        }
      />

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          {loading ? (
            <LoadingState text={isRtl ? 'جارٍ تحميل الصور...' : 'Loading photos...'} />
          ) : items.length === 0 ? (
            <EmptyState text={isRtl ? 'لا توجد صور متاحة حاليًا.' : 'No photos are available yet.'} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setPreview(item)}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-start shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={resolveMediaUrl(item.image_url)}
                      alt={getTitle(item)}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="line-clamp-1 text-lg font-bold text-dark">
                      {getTitle(item)}
                    </h3>

                    {getDescription(item) && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                        {getDescription(item)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={(event) => event.target === event.currentTarget && setPreview(null)}
        >
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute end-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black"
              aria-label={isRtl ? 'إغلاق' : 'Close'}
            >
              <X size={20} />
            </button>

            <img
              src={resolveMediaUrl(preview.image_url)}
              alt={getTitle(preview)}
              className="max-h-[75vh] w-full object-contain bg-black"
            />

            <div className="p-4">
              <h3 className="text-lg font-bold text-dark">
                {getTitle(preview)}
              </h3>

              {getDescription(preview) && (
                <p className="mt-2 text-sm leading-7 text-gray-500">
                  {getDescription(preview)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
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
        <ImageIcon size={26} />
      </div>

      <p className="text-gray-500">{text}</p>
    </div>
  )
}
