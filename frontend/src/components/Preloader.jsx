export default function Preloader({ lang = 'ar', settings = null }) {
  const isArabic = lang === 'ar'

  const orgNameAr = settings?.site_name_ar || DEFAULT_NAME_AR
  const orgNameEn = settings?.site_name_en || DEFAULT_NAME_EN

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
    >
      <div className="flex w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-6 flex h-40 w-40 items-center justify-center">
          {/* Animated parts only */}
          <div className="yhpo-preloader-ring absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="yhpo-preloader-ring-reverse absolute inset-3 rounded-full border-2 border-primary/10" />
          <div className="yhpo-preloader-glow absolute inset-6 rounded-full bg-primary/10 blur-xl" />

          {/* Static embedded SVG logo without white circle, border, or shadow */}
          <div className="relative z-10 flex h-28 w-28 items-center justify-center">
            <YHPOLogoSvg title={`${orgNameAr} - ${orgNameEn}`} />
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

function YHPOLogoSvg({ title = 'Yemen Heritage for Peace Organization' }) {
  return (
    <svg
      viewBox="0 0 384 294"
      xmlns="http://www.w3.org/2000/svg"
      className="block h-full w-full"
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>

      <image
        href={`data:image/png;base64,${LOGO_PNG_BASE64}`}
        x="0"
        y="0"
        width="384"
        height="294"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  )
}
