const ORG_NAME_AR = 'منظمة تراث اليمن لأجل السلام'
const ORG_NAME_EN = 'Yemen Heritage for Peace Organization'

export default function Preloader({ settings = null }) {
  const orgNameAr = settings?.site_name_ar || ORG_NAME_AR
  const orgNameEn = settings?.site_name_en || ORG_NAME_EN

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
    >
      <div className="flex w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-7 flex h-40 w-40 items-center justify-center">
          <div className="yhpo-preloader-ring absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="yhpo-preloader-ring-reverse absolute inset-3 rounded-full border-2 border-primary/10" />
          <div className="yhpo-preloader-glow absolute inset-6 rounded-full bg-primary/10 blur-xl" />

          <div className="yhpo-preloader-logo relative flex h-28 w-28 items-center justify-center rounded-full border border-primary/15 bg-white p-4 shadow-xl shadow-primary/20">
            <YemenHeritageLogo className="h-full w-full text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold leading-snug text-primary md:text-2xl">
            {orgNameAr}
          </h1>

          <p
            dir="ltr"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-primary md:text-base"
          >
            {orgNameEn}
          </p>
        </div>
      </div>
    </div>
  )
}

function YemenHeritageLogo({ className = '' }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Yemen Heritage for Peace Organization"
    >
      <path
        fill="currentColor"
        d="M15 91h101c61 0 112 12 153 36 40 24 70 57 88 99 18-42 48-75 88-99 41-24 92-36 153-36h101v62H598c-47 0-86 8-117 25-32 17-56 42-72 75-16 32-24 72-24 120v18h-64v-18c0-48-8-88-24-120-16-33-40-58-72-75-31-17-70-25-117-25H15V91Z"
        transform="scale(.73)"
      />

      <path
        fill="currentColor"
        d="M15 192h99c41 0 75 7 103 22 28 14 50 36 65 64 15 29 23 65 23 108v24H15V192Zm50 62v94h178c-4-32-17-56-39-72-22-15-52-22-91-22H65Z"
        transform="scale(.73)"
      />

      <path
        fill="currentColor"
        d="M409 192h99v218H218v-24c0-43 8-79 23-108 15-28 37-50 65-64 28-15 62-22 103-22Zm1 62c-39 0-69 7-91 22-22 16-35 40-39 72h178v-94h-48Z"
        transform="scale(.73)"
      />

      <path
        fill="currentColor"
        d="M203 385h64v126h-64V385Zm123 0h64v126h-64V385Z"
        transform="scale(.73)"
      />

      <path
        fill="currentColor"
        d="M76 276h33l15-23 16 23h35l15-23 16 23h34v54H76v-54Zm438 0h33l15-23 16 23h35l15-23 16 23h34v54H514v-54Z"
        transform="scale(.73)"
      />
    </svg>
  )
}
