import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../App'
import { resolveMediaUrl } from '../lib/media'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  BookOpen,
  GraduationCap,
  Landmark,
  Users,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Sparkles,
  Eye,
  Target,
  Heart,
  Leaf,
} from 'lucide-react'

const GOALS_DATA = {
  ar: [
    {
      icon: GraduationCap,
      title: 'التعليم والبحث العلمي',
      text: 'الإسهام في تطوير التعليم وبناء نظام تعليمي وبحثي مستدام وشامل يواكب متطلبات العصر ويوفر فرص تعليمية متساوية لجميع فئات المجتمع ويعزز السلام والتعاون الدولي.',
    },
    {
      icon: Landmark,
      title: 'صون التراث الثقافي',
      text: 'الإسهام في حماية وصون وإحياء الموروث الثقافي وحماية حقوق الملكية الفكرية للتراث اليمني والعمل على تعزيز الثقافة الوطنية والقدرة الإبداعية الفنية والأدبية.',
    },
    {
      icon: Leaf,
      title: 'البيئة والسياحة المستدامة',
      text: 'الإسهام الفعال في الحفاظ على البيئة وحمايتها من التلوث والتدهور، والسعي لإقامة تنمية سياحية مستدامة تحقق فوائد اقتصادية واجتماعية للأفراد والمجتمع.',
    },
    {
      icon: Users,
      title: 'التنمية والشراكات الدولية',
      text: 'المساهمة الفعالة إلى جانب الشركاء المحليين والدوليين في تحقيق أهداف التنمية المستدامة وضمان المساواة بين الجنسين في مجالات التمكين الاقتصادي.',
    },
  ],
  en: [
    {
      icon: GraduationCap,
      title: 'Education & Scientific Research',
      text: 'Contributing to educational development and building a sustainable, inclusive research system that meets modern needs and provides equal opportunities for all without discrimination.',
    },
    {
      icon: Landmark,
      title: 'Cultural Heritage Preservation',
      text: 'Contributing to the protection, conservation, and revival of cultural heritage, protecting intellectual property rights and working to promote national culture and artistic creativity.',
    },
    {
      icon: Leaf,
      title: 'Environment & Sustainable Tourism',
      text: 'Actively contributing to environmental preservation and seeking sustainable tourism development that achieves economic, social, and educational benefits for individuals and society.',
    },
    {
      icon: Users,
      title: 'Development & International Partnerships',
      text: 'Actively contributing alongside local and international partners to achieve Sustainable Development Goals and ensure gender equality and community empowerment.',
    },
  ],
}

const DEFAULT_HERO_SLIDE = {
  id: 'default-hero',
  image_url: '/default-hero.jpg',
  caption_ar: 'قلعة القاهرة – تعز (اليمن)',
  caption_en: 'Al-Qahira Castle - Taiz (Yemen)',
  alt_ar: 'قلعة القاهرة – تعز (اليمن)',
  alt_en: 'Al-Qahira Castle - Taiz (Yemen)',
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.items)) return value.items
  return []
}

function SectionTitle({ children, align = 'center' }) {
  const isStart = align === 'start'

  return (
    <div
      className={`inline-flex flex-col ${
        isStart ? 'items-start' : 'items-center'
      }`}
    >
      <h2
        className={`section-title whitespace-nowrap ${
          isStart ? 'text-start' : ''
        }`}
      >
        {children}
      </h2>

      <div className="mt-2 h-1 w-full rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
    </div>
  )
}

export default function Home() {
  const {
    t,
    lang,
    settings,
    publicData,
    refreshPublicData,
  } = useLang()

  const isRtl = lang === 'ar'

  const [heroIdx, setHeroIdx] = useState(0)
  const [partnerErrors, setPartnerErrors] = useState({})

  const Arrow = isRtl ? ArrowLeft : ArrowRight
  const ChevronDir = isRtl ? ChevronLeft : ChevronRight
  const goals = GOALS_DATA[lang] || GOALS_DATA.ar

  const heroSlides = useMemo(
    () => normalizeArray(publicData?.heroSlides),
    [publicData?.heroSlides]
  )

  const news = useMemo(
    () => normalizeArray(publicData?.news),
    [publicData?.news]
  )

  const events = useMemo(
    () => normalizeArray(publicData?.events),
    [publicData?.events]
  )

  const partners = useMemo(
    () => normalizeArray(publicData?.partners),
    [publicData?.partners]
  )

  const heroSlidesData = useMemo(
    () => (heroSlides.length > 0 ? heroSlides : [DEFAULT_HERO_SLIDE]),
    [heroSlides]
  )

  const heroAlt = useMemo(() => {
    const img = heroSlidesData[heroIdx] || DEFAULT_HERO_SLIDE
    return isRtl ? img.alt_ar || '' : img.alt_en || ''
  }, [heroIdx, isRtl, heroSlidesData])

  useEffect(() => {
    if (publicData?.loaded) return

    refreshPublicData?.().catch((error) => {
      console.error('Failed to refresh public home data:', error)
    })
  }, [publicData?.loaded, refreshPublicData])

  useEffect(() => {
    setHeroIdx(0)
  }, [heroSlidesData.length])

  useEffect(() => {
    if (heroSlidesData.length <= 1) return

    const timer = setInterval(() => {
      setHeroIdx((currentIndex) => (currentIndex + 1) % heroSlidesData.length)
    }, 6500)

    return () => clearInterval(timer)
  }, [heroSlidesData.length])

  useEffect(() => {
    heroSlidesData.forEach(({ image_url }) => {
      const src = resolveMediaUrl(image_url)

      if (src) {
        const image = new Image()
        image.src = src
      }
    })
  }, [heroSlidesData])

  const eventIcon = (type) => {
    if (type === 'seminar') return <BookOpen size={16} />
    if (type === 'training') return <GraduationCap size={16} />
    return <Calendar size={16} />
  }

  const typeBadge = (type) =>
    ({
      seminar: {
        ar: 'ندوة',
        en: 'Seminar',
        cls: 'bg-blue-500/80',
      },
      training: {
        ar: 'تدريب',
        en: 'Training',
        cls: 'bg-emerald-600/80',
      },
      project: {
        ar: 'مشروع',
        en: 'Project',
        cls: 'bg-violet-600/80',
      },
      event: {
        ar: 'فعالية',
        en: 'Event',
        cls: 'bg-primary/80',
      },
    }[type] || {
      ar: 'فعالية',
      en: 'Event',
      cls: 'bg-primary/80',
    })

  const aboutImageUrl = settings?.home_about_image_url || ''

  const aboutAlt = isRtl
    ? settings?.home_about_image_alt_ar || ''
    : settings?.home_about_image_alt_en || ''

  return (
    <main>
      <section
        id="home-hero"
        className="relative flex min-h-[86vh] items-center justify-center overflow-hidden py-8"
      >
        {heroSlidesData.map((img, index) => (
          <div
            key={img.id || index}
            className={`absolute inset-0 ${
              index === heroIdx ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transition: 'opacity 1.5s ease' }}
            aria-hidden={index !== heroIdx}
          >
            <img
              src={resolveMediaUrl(img.image_url)}
              alt={index === heroIdx ? heroAlt : ''}
              className="h-full w-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/55" />

            {(img.caption_ar || img.caption_en) && (
              <div
                className={`absolute bottom-20 ${
                  isRtl ? 'right-8' : 'left-8'
                } hidden md:block`}
              >
                <p className="border-s-2 border-primary ps-3 text-xs italic text-white/80">
                  {isRtl ? img.caption_ar : img.caption_en}
                </p>
              </div>
            )}
          </div>
        ))}

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-center">
          <h1 className="mx-auto mb-5 w-full max-w-full overflow-hidden whitespace-nowrap text-center font-bold leading-tight text-white drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)] text-[clamp(1.2rem,4.5vw,2.5rem)] md:text-[clamp(2.2rem,4.2vw,3.8rem)] lg:text-[clamp(3rem,4vw,5rem)]">
            {t.hero.title}
          </h1>

          <p className="mb-5 text-xl font-semibold text-primary drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)] sm:text-2xl">
            {t.hero.subtitle}
          </p>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/85 drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)] md:text-lg">
            {t.hero.desc}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/about"
              className="btn-primary text-base shadow-lg shadow-primary/30"
            >
              {t.hero.btn1}
              <Arrow size={18} />
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/70 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-300 hover:bg-white/10"
            >
              {t.hero.btn2}
            </Link>
          </div>
        </div>

        {heroSlidesData.length > 1 && (
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
            {heroSlidesData.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setHeroIdx(index)}
                aria-label={
                  isRtl
                    ? `انتقل إلى الشريحة ${index + 1}`
                    : `Go to slide ${index + 1}`
                }
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === heroIdx
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-gray-300/60 hover:bg-gray-400/80'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:grid-cols-2">
          <div>
            <div className="mb-6">
              <SectionTitle align="start">
                {isRtl ? 'من نحن' : 'Who We Are'}
              </SectionTitle>
            </div>

            <p className="mb-6 text-base leading-relaxed text-gray-600">
              {t.about_short.desc}
            </p>

            <div className="mb-8 space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
                <Eye size={20} className="mt-0.5 shrink-0 text-primary" />

                <div>
                  <p className="mb-1 text-sm font-bold text-dark">
                    {t.vision}
                  </p>

                  <p className="text-sm leading-relaxed text-gray-600">
                    {t.vision_text}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <Target size={20} className="mt-0.5 shrink-0 text-dark" />

                <div>
                  <p className="mb-1 text-sm font-bold text-dark">
                    {t.mission}
                  </p>

                  <p className="text-sm leading-relaxed text-gray-600">
                    {t.mission_text}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Link to="/about" className="btn-primary">
                {t.about_short.more}
                <Arrow size={16} />
              </Link>
            </div>
          </div>

          <div className="relative">
            <img
              src={
                resolveMediaUrl(aboutImageUrl) ||
                'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/The_castle_above_Taiz_%288683935588%29.jpg/1280px-The_castle_above_Taiz_%288683935588%29.jpg'
              }
              alt={
                aboutAlt ||
                (isRtl
                  ? 'العمارة اليمنية التاريخية'
                  : 'Historic Yemeni Architecture')
              }
              className="h-80 w-full rounded-2xl object-cover shadow-xl"
              loading="lazy"
            />

            <div className="absolute -bottom-5 -start-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Heart size={18} className="text-primary" />
                </div>

                <div>
                  <p className="text-sm font-bold text-dark">
                    {isRtl ? 'حماية التراث اليمني' : 'Protecting Yemeni Heritage'}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-400">
                    {isRtl ? 'من أجل الأجيال القادمة' : 'For future generations'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
