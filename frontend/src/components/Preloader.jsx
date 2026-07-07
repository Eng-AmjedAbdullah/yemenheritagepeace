import { RefreshCw } from 'lucide-react'
import { resolveMediaUrl } from '../lib/media'

const DEFAULT_LOGO = '/logo.png'

export default function Preloader({
  lang = 'ar',
  settings = null,
  error = false,
  onRetry,
}) {
  const isArabic = lang === 'ar'

  const uploadedLogo = resolveMediaUrl(settings?.logo_url?.trim() || '')
  const logoSrc = uploadedLogo || DEFAULT_LOGO

  const orgName = isArabic
    ? settings?.site_name_ar || 'منظمة تراث اليمن لأجل السلام'
    : settings?.site_name_en || 'Yemen Heritage for Peace Organization'

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
    >
      <div className="flex w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-6 flex h-36 w-36 items-center justify-center">
          <div className="yhpo-preloader-ring absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="yhpo-preloader-ring-reverse absolute inset-3 rounded-full border-2 border-primary/10" />
          <div className="yhpo-preloader-glow absolute inset-6 rounded-full bg-primary/10 blur-xl" />

          <div className="yhpo-preloader-logo relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/15 bg-white p-4 shadow-xl shadow-primary/20">
            <img
              src={logoSrc}
              alt={orgName}
              className="h-full w-full object-contain"
              onError={(event) => {
                event.currentTarget.src = DEFAULT_LOGO
              }}
            />
          </div>
        </div>

        <h1 className="mb-2 text-xl font-bold text-dark md:text-2xl">
          {orgName}
        </h1>

        <p className="text-sm font-medium text-primary">
          {error
            ? isArabic
              ? 'تعذر الاتصال بالخادم'
              : 'Could not connect to server'
            : isArabic
              ? 'جارِ تحميل البيانات...'
              : 'Loading data...'}
        </p>

        {error && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            <RefreshCw size={16} />
            {isArabic ? 'إعادة المحاولة' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  )
}
