const DEFAULT_NAME_AR = 'منظمة تراث اليمن لأجل السلام'
const DEFAULT_NAME_EN = 'Yemen Heritage for Peace Organization'
const DEFAULT_LOGO = '/logo.png'

export default function AdminPreloader({
  lang = 'ar',
  text,
  fullScreen = false,
  compact = false,
}) {
  const isRtl = lang === 'ar'

  const loadingText =
    text || (isRtl ? 'جارٍ التحميل...' : 'Loading...')

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={
        fullScreen
          ? 'fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-slate-950'
          : 'flex min-h-[260px] w-full items-center justify-center rounded-2xl bg-white'
      }
    >
      <div className="relative flex flex-col items-center justify-center text-center">
        <div
          className={`yhpo-preloader-glow absolute rounded-full bg-primary/20 blur-2xl ${
            compact ? 'h-24 w-24' : 'h-36 w-36'
          }`}
        />

        <div
          className={`relative flex items-center justify-center ${
            compact ? 'h-28 w-28' : 'h-40 w-40'
          }`}
        >
          <div
            className={`yhpo-preloader-ring absolute rounded-full border-4 border-white/10 ${
              compact ? 'h-24 w-24' : 'h-36 w-36'
            }`}
          />

          <div
            className={`yhpo-preloader-ring-reverse absolute rounded-full border-4 border-white/10 ${
              compact ? 'h-16 w-16' : 'h-24 w-24'
            }`}
          />

          <div className="yhpo-preloader-logo-shell relative z-10 flex items-center justify-center">
            <img
              src={DEFAULT_LOGO}
              alt={isRtl ? DEFAULT_NAME_AR : DEFAULT_NAME_EN}
              className={`yhpo-preloader-logo object-contain ${
                compact ? 'h-14 w-14' : 'h-20 w-20'
              }`}
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </div>

        {!compact && (
          <div className="mt-5 space-y-1">
            <h2 className="text-lg font-bold text-white">
              {DEFAULT_NAME_AR}
            </h2>

            <p className="text-sm font-medium text-white/70" dir="ltr">
              {DEFAULT_NAME_EN}
            </p>
          </div>
        )}

        <p
          className={`font-semibold text-primary-light ${
            compact ? 'mt-3 text-sm' : 'mt-5 text-sm'
          }`}
        >
          {loadingText}
        </p>
      </div>
    </div>
  )
}
