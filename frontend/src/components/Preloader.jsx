const DEFAULT_NAME_AR = 'منظمة تراث اليمن لأجل السلام'
const DEFAULT_NAME_EN = 'Yemen Heritage for Peace Organization'

const DEFAULT_LOGO = '/logo.png'

export default function Preloader({ lang = 'ar', settings = null }) {
  const isArabic = lang === 'ar'

  const orgNameAr = settings?.site_name_ar || DEFAULT_NAME_AR
  const orgNameEn = settings?.site_name_en || DEFAULT_NAME_EN
  const logoSrc = settings?.logo_url || DEFAULT_LOGO

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
    >
      <div className="flex w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-6 flex h-40 w-40 items-center justify-center">
          <div className="yhpo-preloader-ring absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="yhpo-preloader-ring-reverse absolute inset-3 rounded-full border-2 border-primary/10" />
          <div className="yhpo-preloader-glow absolute inset-6 rounded-full bg-primary/10 blur-xl" />

          <div className="yhpo-preloader-logo-shell relative z-10 flex h-28 w-28 items-center justify-center">
            <img
              src={logoSrc}
              alt={`${orgNameAr} - ${orgNameEn}`}
              className="yhpo-preloader-logo h-full w-full object-contain"
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
