import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../App'
import api from '../lib/api'
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
  Gem,
  Heart,
  Leaf,
  Mail,
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
  const { t, lang, settings } = useLang()
  const isRtl = lang === 'ar'

  const [heroSlides, setHeroSlides] = useState([])
  const [heroIdx, setHeroIdx] = useState(0)
  const [news, setNews] = useState([])
  const [events, setEvents] = useState([])
  const [partners, setPartners] = useState([])
  const [partnerErrors, setPartnerErrors] = useState({})

  const Arrow = isRtl ? ArrowLeft : ArrowRight
  const ChevronDir = isRtl ? ChevronLeft : ChevronRight
  const goals = GOALS_DATA[lang] || GOALS_DATA.ar

  const heroSlidesData = useMemo(
    () => (heroSlides.length > 0 ? heroSlides : [DEFAULT_HERO_SLIDE]),
    [heroSlides]
  )

  const latestNews = useMemo(() => {
    return [...news].sort(
      (a, b) => getDateTime(b?.created_at) - getDateTime(a?.created_at)
    )
  }, [news])

  const latestEvents = useMemo(() => {
    return [...events].sort((a, b) => getEventTime(b) - getEventTime(a))
  }, [events])

  const heroAlt = useMemo(() => {
    const img = heroSlidesData[heroIdx] || DEFAULT_HERO_SLIDE
    return isRtl ? img.alt_ar || '' : img.alt_en || ''
  }, [heroIdx, isRtl, heroSlidesData])

  const whoIntro = isRtl
    ? 'منظمة تراث اليمن لأجل السلام هي منظمة مجتمع مدني غير ربحية، مقرها الرئيسي في محافظة تعز، الجمهورية اليمنية.'
    : 'Yemen Heritage for Peace Organization is a non-profit civil society organization headquartered in Taiz Governorate, Republic of Yemen.'

  const whoFocus = isRtl
    ? 'تعمل المنظمة في مجالات الثقافة والعلوم والتنمية البيئية والسياحية، وتسعى إلى تحويل التراث اليمني إلى مساحة معرفة وسلام وتنمية تشارك فيها المؤسسات والمجتمعات المحلية.'
    : 'The organization works in culture, science, environmental development, and tourism development, seeking to turn Yemeni heritage into a space for knowledge, peace, and development shared by institutions and local communities.'

  const aboutCards = isRtl
    ? [
        {
          Icon: Eye,
          title: 'الرؤية',
          text: 'أن يكون التراث اليمني مصدرًا حيًا للوعي والسلام والتنمية، وأن تصبح الهوية الحضارية اليمنية قوة فاعلة في بناء مجتمع أكثر معرفة وتعاونًا واستدامة.',
        },
        {
          Icon: Mail,
          title: 'الرسالة',
          text: 'صون التراث اليمني المادي وغير المادي، وتعزيز البحث والمعرفة، وتمكين المجتمع من المشاركة في حماية الهوية الثقافية.',
        },
      ]
    : [
        {
          Icon: Eye,
          title: 'Vision',
          text: 'To make Yemeni heritage a living source of awareness, peace, and development for a more knowledgeable, cooperative, and sustainable society.',
        },
        {
          Icon: Mail,
          title: 'Mission',
          text: 'To preserve Yemen’s tangible and intangible heritage, promote research and knowledge, and empower communities to protect cultural identity.',
        },
        {
          Icon: Gem,
          title: 'Values',
          text: 'We believe in identity, peace, knowledge, innovation, transparency, and sustainability as foundations of our institutional work.',
        },
      ]

  useEffect(() => {
    let alive = true

    Promise.allSettled([
      api.get('/hero'),
      api.get('/news?limit=100'),
      api.get('/events?limit=100'),
      api.get('/partners'),
    ]).then(([heroResult, newsResult, eventsResult, partnersResult]) => {
      if (!alive) return

      setHeroSlides(
        heroResult.status === 'fulfilled' && Array.isArray(heroResult.value)
          ? heroResult.value
          : []
      )

      setNews(
        newsResult.status === 'fulfilled' && Array.isArray(newsResult.value)
          ? newsResult.value
          : []
      )

      setEvents(
        eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value)
          ? eventsResult.value
          : []
      )

      setPartners(
        partnersResult.status === 'fulfilled' &&
          Array.isArray(partnersResult.value)
          ? partnersResult.value
          : []
      )
    })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    setHeroIdx(0)
  }, [heroSlidesData.length])

  useEffect(() => {
    if (heroSlidesData.length <= 1) return

    const timer = setInterval(() => {
      setHeroIdx((index) => (index + 1) % heroSlidesData.length)
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
    if (type === 'project') return <Landmark size={16} />
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
        {heroSlidesData.map((img, index) => {
          const imageSrc =
            resolveMediaUrl(img.image_url) || DEFAULT_HERO_SLIDE.image_url

          return (
            <div
              key={img.id || index}
              className={`absolute inset-0 ${
                index === heroIdx ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transition: 'opacity 1.5s ease' }}
              aria-hidden={index !== heroIdx}
            >
              <img
                src={imageSrc}
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
          )
        })}

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

      {/* Who We Are */}
      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:grid-cols-2">
          <div>
            <div className="mb-6">
              <SectionTitle align="start">
                {isRtl ? 'من نحن' : 'Who We Are'}
              </SectionTitle>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm">
              <div className="space-y-4 text-base leading-relaxed text-gray-600">
                <p>{whoIntro}</p>
                <p>{whoFocus}</p>
              </div>
            </div>

            <div className="mb-8 space-y-3">
              {aboutCards.map((item, index) => {
                const Icon = item.Icon

                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon size={20} className="text-primary" />
                    </div>

                    <div>
                      <p className="mb-1 text-sm font-bold text-dark">
                        {item.title}
                      </p>

                      <p className="text-sm leading-relaxed text-gray-600">
                        {item.text}
                      </p>
                    </div>
                  </div>
                )
              })}
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
                    {isRtl
                      ? 'حماية التراث اليمني'
                      : 'Protecting Yemeni Heritage'}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-400">
                    {isRtl
                      ? 'من أجل الأجيال القادمة'
                      : 'For future generations'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 flex flex-col items-center text-center">
            <SectionTitle>
              {isRtl ? 'رؤيتنا وأهدافنا' : 'Our Vision & Goals'}
            </SectionTitle>

            <p className="mx-auto mt-4 max-w-xl text-sm text-gray-500">
              {isRtl
                ? 'نعمل من أجل يمن يحتفي بتراثه ويبني مستقبله على أسس من العلم والثقافة والسلام'
                : 'We work for a Yemen that celebrates its heritage and builds its future on science, culture, and peace'}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {goals.map((goal, index) => {
              const Icon = goal.icon

              return (
                <div
                  key={index}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon size={22} className="text-primary" />
                  </div>

                  <h3 className="mb-2 font-bold text-dark">{goal.title}</h3>

                  <p className="text-sm leading-relaxed text-gray-500">
                    {goal.text}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-10 text-center">
            <Link to="/about" className="btn-primary">
              {isRtl ? 'اقرأ المزيد عن المنظمة' : 'Learn More About Us'}
              <Arrow size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Heritage Life */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 flex flex-col items-center text-center">
            <SectionTitle>{t.heritage_life_title}</SectionTitle>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Link
              to="/heritage-life?type=tangible"
              className="group relative h-64 overflow-hidden rounded-2xl border border-gray-100 shadow-md"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Temple_in_Ancient_city_of_Marib.jpg/1280px-Temple_in_Ancient_city_of_Marib.jpg"
                alt={isRtl ? 'معلم أثري في مأرب' : 'Archaeological site in Marib'}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />

              <div className="absolute bottom-0 p-6 text-start text-white">
                <div className="mb-2 flex items-center gap-2">
                  <Landmark size={15} className="text-primary" />

                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {isRtl ? 'التراث المادي' : 'Tangible'}
                  </span>
                </div>

                <h3 className="mb-1 text-xl font-bold">{t.nav.tangible}</h3>

                <p className="text-sm text-gray-200">{t.tangible_desc}</p>
              </div>
            </Link>

            <Link
              to="/heritage-life?type=intangible"
              className="group relative h-64 overflow-hidden rounded-2xl border border-gray-100 shadow-md"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Janbiya_Dance%2C_Yemen_%2811041030075%29.jpg/1280px-Janbiya_Dance%2C_Yemen_%2811041030075%29.jpg"
                alt={isRtl ? 'رقصة شعبية يمنية' : 'Traditional Yemeni dance'}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />

              <div className="absolute bottom-0 p-6 text-start text-white">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles size={15} className="text-primary" />

                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {isRtl ? 'التراث اللامادي' : 'Intangible'}
                  </span>
                </div>

                <h3 className="mb-1 text-xl font-bold">{t.nav.intangible}</h3>

                <p className="text-sm text-gray-200">{t.intangible_desc}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* News */}
      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 flex items-end justify-between">
            <SectionTitle align="start">{t.latest_news}</SectionTitle>

            <Link
              to="/news"
              className="ms-4 hidden shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline md:inline-flex"
            >
              {t.view_all}
              <Arrow size={14} />
            </Link>
          </div>

          {latestNews.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              {isRtl ? 'لا توجد أخبار منشورة حالياً' : 'No published news yet'}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {latestNews.slice(0, 3).map((item) => {
                const title = isRtl ? item.title : item.title_en || item.title
                const content = isRtl
                  ? item.content
                  : item.content_en || item.content

                return (
                  <Link
                    key={item.id}
                    to={item.id ? `/news?selected=${item.id}` : '/news'}
                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative h-44 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={resolveMediaUrl(item.image_url)}
                          alt={title || ''}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <Newspaper size={32} className="text-gray-300" />
                        </div>
                      )}

                      {(item.category || item.category_en) && (
                        <span className="absolute start-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                          {isRtl
                            ? item.category
                            : item.category_en || item.category}
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-dark">
                        {title}
                      </h3>

                      <p className="mb-4 line-clamp-2 text-sm text-gray-500">
                        {content}
                      </p>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Newspaper size={12} />
                          {formatDate(item.created_at, isRtl)}
                        </span>

                        <span className="flex items-center gap-1 text-xs font-medium text-primary group-hover:underline">
                          {t.read_more}
                          <ChevronDir size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Events */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 flex items-end justify-between">
            <SectionTitle align="start">
              {isRtl ? 'أحدث الفعاليات' : 'Latest Events'}
            </SectionTitle>

            <Link
              to="/events"
              className="btn-primary ms-4 hidden shrink-0 items-center gap-2 text-sm md:inline-flex"
            >
              {t.view_all}
              <Arrow size={14} />
            </Link>
          </div>

          {latestEvents.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              {isRtl ? 'لا توجد فعاليات منشورة حالياً' : 'No published events yet'}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {latestEvents.slice(0, 3).map((item) => {
                const badge = typeBadge(item.type)
                const title = isRtl ? item.title : item.title_en || item.title
                const location = isRtl
                  ? item.location || ''
                  : item.location_en || item.location || ''

                const eventHref =
                  item.type && item.type !== 'event'
                    ? `/events?type=${item.type}`
                    : '/events'

                return (
                  <Link
                    key={item.id}
                    to={eventHref}
                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {item.image_url && (
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={resolveMediaUrl(item.image_url)}
                          alt={title || ''}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-dark/40 to-transparent" />

                        <span
                          className={`absolute start-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm ${badge.cls}`}
                        >
                          {isRtl ? badge.ar : badge.en}
                        </span>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary/20">
                          {eventIcon(item.type)}
                        </div>

                        <div>
                          <div className="text-xs text-gray-400">
                            {t.date_field}
                          </div>

                          <div className="text-sm font-semibold text-dark">
                            {formatDate(
                              item.event_date || item.created_at,
                              isRtl,
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </div>
                        </div>
                      </div>

                      <h3 className="mb-3 line-clamp-2 font-bold leading-snug text-dark">
                        {title}
                      </h3>

                      <p className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin size={13} className="shrink-0 text-primary" />
                        {location}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Partners */}
      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 flex flex-col items-center text-center">
            <SectionTitle>{t.partners_title}</SectionTitle>
          </div>

          {partners.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              {isRtl
                ? 'لا توجد جهات شريكة مضافة بعد'
                : 'No partners added yet'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {partners.map((partner, index) => {
                const partnerKey = partner.id || index
                const partnerName = isRtl
                  ? partner.name
                  : partner.name_en || partner.name

                return (
                  <a
                    key={partnerKey}
                    href={partner.website_url || '#'}
                    target={partner.website_url ? '_blank' : undefined}
                    rel={partner.website_url ? 'noreferrer' : undefined}
                    className="flex min-h-[140px] flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                  >
                    {partner.logo_url && !partnerErrors[partnerKey] ? (
                      <div className="flex h-12 w-full items-center justify-center">
                        <img
                          src={resolveMediaUrl(partner.logo_url)}
                          alt={partnerName}
                          className="max-h-12 w-auto max-w-[110px] object-contain"
                          loading="lazy"
                          onError={() =>
                            setPartnerErrors((current) => ({
                              ...current,
                              [partnerKey]: true,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                        {String(partnerName || '').slice(0, 2)}
                      </div>
                    )}

                    <p className="line-clamp-2 w-full text-center text-sm font-semibold leading-snug text-gray-700">
                      {partnerName}
                    </p>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function getDateTime(value) {
  const time = new Date(value || 0).getTime()
  return Number.isNaN(time) ? 0 : time
}

function getEventTime(item) {
  return getDateTime(item?.event_date || item?.created_at)
}

function formatDate(value, isRtl, options) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString(
    isRtl ? 'ar-YE' : 'en-US',
    options || {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  )
}
