import { useLang } from '../App'


export default function PageHeader({ title, subtitle, children }) {
  const { lang } = useLang()
  const isRtl = lang === 'ar'

  return (
    <section className="relative pt-32 md:pt-8 pb-4 md:pb-10 bg-gradient-to-b from-gray-50 to-white overflow-hidden" style={{ scrollMarginTop: '8rem' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 start-10 w-40 md:w-56 h-40 md:h-56 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 end-10 w-48 md:w-72 h-48 md:h-72 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col items-center text-center ${isRtl ? 'font-ar' : 'font-en'}`}>

          <div className="mb-4" />

          {/* Title + line grouped so line matches title width */}
          <div className="inline-flex flex-col items-center mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark mb-3 leading-tight max-w-3xl">
              {title}
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
          </div>

          {subtitle && (
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed text-pretty">
              {subtitle}
            </p>
          )}

          {children && <div className="mt-5 w-full">{children}</div>}
        </div>
      </div>
    </section>
  )
}
