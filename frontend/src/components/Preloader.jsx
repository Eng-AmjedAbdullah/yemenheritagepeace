import { resolveMediaUrl } from '../lib/media'

const DEFAULT_LOGO = '/logo.png'

const DEFAULT_NAME_AR = 'منظمة تراث اليمن لأجل السلام'
const DEFAULT_NAME_EN = 'Yemen Heritage for Peace Organization'

export default function Preloader({ lang = 'ar', settings = null }) {
  const isArabic = lang === 'ar'

  const uploadedLogo = resolveMediaUrl(settings?.logo_url?.trim() || '')
  const logoSrc = uploadedLogo || DEFAULT_LOGO

  const orgNameAr = settings?.site_name_ar || DEFAULT_NAME_AR
  const orgNameEn = settings?.site_name_en || DEFAULT_NAME_EN

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
    >
      <div className="flex w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-6 flex h-40 w-40 items-center justify-center">
          {/* Animated outer elements only */}
          <div className="yhpo-preloader-ring absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="yhpo-preloader-ring-reverse absolute inset-3 rounded-full border-2 border-primary/10" />
          <div className="yhpo-preloader-glow absolute inset-6 rounded-full bg-primary/10 blur-xl" />

          {/* Static logo container */}
          <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border border-primary/15 bg-white p-4 shadow-xl shadow-primary/20">
            <img
              src={logoSrc}
              alt={`${orgNameAr} - ${orgNameEn}`}
              className="block h-full w-full object-contain"
              draggable="false"
              onError={(event) => {
                event.currentTarget.src = DEFAULT_LOGO
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h1
            dir="rtl"
            className="text-xl font-bold leading-snug text-primary md:text-2xl"
          >
            {orgNameAr}
          </h1>

          <p
            dir="ltr"
            className="text-sm font-semibold leading-snug text-primary md:text-base"
          >
            {orgNameEn}
          </p>
        </div>
      </div>
    </div>
  )
}
