const DEFAULT_NAME_AR = 'منظمة تراث اليمن لأجل السلام'
const DEFAULT_NAME_EN = 'Yemen Heritage for Peace Organization'

const DEFAULT_LOGO = '/logo.png'

export default function AdminPreloader({
  lang = 'ar',
  settings = null,
  fullScreen = false,
  compact = false,
}) {
  const isArabic = lang === 'ar'

  const orgNameAr = settings?.site_name_ar || DEFAULT_NAME_AR
  const orgNameEn = settings?.site_name_en || DEFAULT_NAME_EN
  const logoSrc = settings?.logo_url || DEFAULT_LOGO

  const wrapperClass = fullScreen
    ? 'fixed inset-0 z-[9999] flex items-center justify-center bg-white'
    : 'flex min-h-[260px] w-full items-center justify-center bg-white'

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className={wrapperClass}
    >
      <div className="flex w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div
          className={`relative mb-7 flex items-center justify-center ${
            compact ? 'h-40 w-40' : 'h-48 w-48'
          }`}
        >
          <div className="yhpo-preloader-ring absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="yhpo-preloader-ring-reverse absolute inset-4 rounded-full border-2 border-primary/10" />
          <div className="yhpo-preloader-glow absolute inset-10 rounded-full bg-primary/10 blur-xl" />

          <div
            className={`yhpo-preloader-logo-shell relative z-10 flex items-center justify-center ${
              compact ? 'h-24 w-24' : 'h-28 w-28'
            }`}
          >
            <img
              src={logoSrc}
              alt={`${orgNameAr} - ${orgNameEn}`}
              className="yhpo-preloader-logo h-full w-full object-contain"
              draggable="false"
              onError={(event) => {
                const image = event.currentTarget

                if (image.dataset.fallbackApplied === 'true') {
                  image.style.display = 'none'
                  return
                }

                image.dataset.fallbackApplied = 'true'
                image.src = DEFAULT_LOGO
              }}
            />
          </div>
        </div>

        {!compact && (
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
        )}
      </div>
    </div>
  )
}
