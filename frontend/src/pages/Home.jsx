import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../App'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, BookOpen,
  GraduationCap, Landmark, Users, ChevronLeft, ChevronRight,
  Newspaper, Sparkles, Eye, Target, Heart, Leaf,
} from 'lucide-react'

const GOALS_DATA = {
  ar: [
    { icon: GraduationCap, title: 'التعليم والبحث العلمي', text: 'الإسهام في تطوير التعليم وبناء نظام تعليمي وبحثي مستدام وشامل يواكب متطلبات العصر ويوفر فرص تعليمية متساوية لجميع فئات المجتمع ويعزز السلام والتعاون الدولي.' },
    { icon: Landmark, title: 'صون التراث الثقافي', text: 'الإسهام في حماية وصون وإحياء الموروث الثقافي وحماية حقوق الملكية الفكرية للتراث اليمني والعمل على تعزيز الثقافة الوطنية والقدرة الإبداعية الفنية والأدبية.' },
    { icon: Leaf, title: 'البيئة والسياحة المستدامة', text: 'الإسهام الفعال في الحفاظ على البيئة وحمايتها من التلوث والتدهور، والسعي لإقامة تنمية سياحية مستدامة تحقق فوائد اقتصادية واجتماعية للأفراد والمجتمع.' },
    { icon: Users, title: 'التنمية والشراكات الدولية', text: 'المساهمة الفعالة إلى جانب الشركاء المحليين والدوليين في تحقيق أهداف التنمية المستدامة وضمان المساواة بين الجنسين في مجالات التمكين الاقتصادي.' },
  ],
  en: [
    { icon: GraduationCap, title: 'Education & Scientific Research', text: 'Contributing to educational development and building a sustainable, inclusive research system that meets modern needs and provides equal opportunities for all without discrimination.' },
    { icon: Landmark, title: 'Cultural Heritage Preservation', text: 'Contributing to the protection, conservation, and revival of cultural heritage, protecting intellectual property rights and working to promote national culture and artistic creativity.' },
    { icon: Leaf, title: 'Environment & Sustainable Tourism', text: 'Actively contributing to environmental preservation and seeking sustainable tourism development that achieves economic, social, and educational benefits for individuals and society.' },
    { icon: Users, title: 'Development & International Partnerships', text: 'Actively contributing alongside local and international partners to achieve Sustainable Development Goals and ensure gender equality and community empowerment.' },
  ],
}

function SectionTitle({ children, align = 'center' }) {
  const isStart = align === 'start'
  return (
    <div className={`inline-flex flex-col ${isStart ? 'items-start' : 'items-center'}`}>
      <h2 className={`section-title whitespace-nowrap ${isStart ? 'text-start' : ''}`}>
        {children}
      </h2>
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mt-2" />
    </div>
  )
}

export default function Home() {
  const { t, lang, settings } = useLang()
  const isRtl = lang === 'ar'

  const [heroSlides, setHeroSlides]       = useState([])
  const [heroIdx, setHeroIdx]             = useState(0)
  const [news, setNews]                   = useState([])
  const [events, setEvents]               = useState([])
  const [partners, setPartners]           = useState([])
  const [partnerErrors, setPartnerErrors] = useState({})

  const Arrow      = isRtl ? ArrowLeft   : ArrowRight
  const ChevronDir = isRtl ? ChevronLeft : ChevronRight
  const goals      = GOALS_DATA[lang] || GOALS_DATA.ar

  const DEFAULT_HERO_SLIDE = {
    id: 'default-hero',
    image_url: '/default-hero.jpg',
    caption_ar: 'قلعة القاهرة – تعز (اليمن)',
    caption_en: 'Al-Qahira Castle - Taiz (Yemen)',
    alt_ar: 'قلعة القاهرة – تعز (اليمن)',
    alt_en: 'Al-Qahira Castle - Taiz (Yemen)',
  }

  const heroSlidesData = heroSlides.length > 0 ? heroSlides : [DEFAULT_HERO_SLIDE]

  const heroAlt = useMemo(() => {
    const img = heroSlidesData[heroIdx] || DEFAULT_HERO_SLIDE
    return isRtl ? (img.alt_ar || '') : (img.alt_en || '')
  }, [heroIdx, isRtl, heroSlidesData])

  useEffect(() => {
    let alive = true
    Promise.allSettled([
      api.get('/hero'),
      api.get('/news?limit=3'),
      api.get('/events?limit=3'),
      api.get('/partners'),
    ]).then(([h, n, e, p]) => {
      if (!alive) return
      setHeroSlides(h.status === 'fulfilled' ? (h.value || []) : [])
      setNews      (n.status === 'fulfilled' ? (n.value || []) : [])
      setEvents    (e.status === 'fulfilled' ? (e.value || []) : [])
      setPartners  (p.status === 'fulfilled' ? (p.value || []) : [])
    })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (heroSlidesData.length <= 1) return
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % heroSlidesData.length), 6500)
    return () => clearInterval(timer)
  }, [heroSlidesData.length])

  useEffect(() => {
    heroSlides.forEach(({ image_url }) => {
      const src = resolveMediaUrl(image_url)
      if (src) {
        const i = new Image()
        i.src = src
      }
    })
  }, [heroSlides])

  useEffect(() => {
    if (heroSlides.length <= 1) return
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % heroSlides.length), 6500)
    return () => clearInterval(timer)
  }, [heroSlides.length])

  const eventIcon = type => {
    if (type === 'seminar')  return <BookOpen size={16} />
    if (type === 'training') return <GraduationCap size={16} />
    return <Calendar size={16} />
  }

  const typeBadge = type => ({
    seminar:  { ar: 'ندوة',   en: 'Seminar',  cls: 'bg-blue-500/80'    },
    training: { ar: 'تدريب',  en: 'Training', cls: 'bg-emerald-600/80' },
    project:  { ar: 'مشروع',  en: 'Project',  cls: 'bg-violet-600/80'  },
    event:    { ar: 'فعالية', en: 'Event',    cls: 'bg-primary/80'     },
  }[type] || { ar: 'فعالية', en: 'Event', cls: 'bg-primary/80' })

  const aboutImageUrl = settings?.home_about_image_url || ''
  const aboutAlt = isRtl
    ? (settings?.home_about_image_alt_ar || '')
    : (settings?.home_about_image_alt_en || '')

  return (
    <main>
      <section id="home-hero" className="relative min-h-[86vh] flex items-center justify-center overflow-hidden py-8">

        {heroSlidesData.map((img, i) => (
          <div
            key={img.id || i}
            className={`absolute inset-0 ${i === heroIdx ? 'opacity-100' : 'opacity-0'}`}
            style={{ transition: 'opacity 1.5s ease' }}
            aria-hidden={i !== heroIdx}
          >
            <img
              src={resolveMediaUrl(img.image_url)}
              alt={i === heroIdx ? heroAlt : ''}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/55" />
            {(img.caption_ar || img.caption_en) && (
              <div className={`absolute bottom-20 ${isRtl ? 'right-8' : 'left-8'} hidden md:block`}>
                <p className="text-white/80 text-xs border-s-2 border-primary ps-3 italic">
                  {isRtl ? img.caption_ar : img.caption_en}
                </p>
              </div>
            )}
          </div>
        ))}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center px-4 w-full max-w-7xl mx-auto">
          {/* Main Hero Title Adjusted below to remain strictly 100% wide and on 1 line */}
          <h1 className="font-bold text-white mt-5 mb-5 leading-tight drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)] whitespace-nowrap overflow-hidden text-center mx-auto w-full max-w-full text-[clamp(1.2rem,4.5vw,2.5rem)] md:text-[clamp(2.2rem,4.2vw,3.8rem)] lg:text-[clamp(3rem,4vw,5rem)]">
            {t.hero.title}
          </h1>
          <p className="text-xl sm:text-2xl text-primary font-semibold mb-5 drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)]">
            {t.hero.subtitle}
          </p>
          <p className="text-white/85 text-base md:text-lg mb-10 leading-relaxed max-w-2xl mx-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
            {t.hero.desc}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/about" className="btn-primary text-base shadow-lg shadow-primary/30">
              {t.hero.btn1}<Arrow size={18} />
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center border border-white/70 text-white hover:bg-white/10 text-base font-semibold py-3 px-6 rounded-xl transition-all duration-300 gap-2 shadow-sm">
              {t.hero.btn2}
            </Link>
          </div>
        </div>

        {heroSlides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                aria-label={isRtl ? `انتقل إلى الشريحة ${i + 1}` : `Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${i === heroIdx ? 'bg-primary w-8' : 'bg-gray-300/60 w-2 hover:bg-gray-400/80'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── من نحن ────────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-6">
              <SectionTitle align="start">
                {isRtl ? 'من نحن' : 'Who We Are'}
              </SectionTitle>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6 text-base">{t.about_short.desc}</p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl p-4">
                <Eye size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-dark text-sm mb-1">{t.vision}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{t.vision_text}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <Target size={20} className="text-dark mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-dark text-sm mb-1">{t.mission}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{t.mission_text}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Link to="/about" className="btn-primary">
                {t.about_short.more}<Arrow size={16} />
              </Link>
            </div>
          </div>

          <div className="relative">
            <img
              src={resolveMediaUrl(aboutImageUrl)|| 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/The_castle_above_Taiz_%288683935588%29.jpg/1280px-The_castle_above_Taiz_%288683935588%29.jpg'}
              alt={aboutAlt || (isRtl ? 'العمارة اليمنية التاريخية' : 'Historic Yemeni Architecture')}
              className="rounded-2xl shadow-xl w-full h-80 object-cover"
              loading="lazy"
            />
            <div className="absolute -bottom-5 -start-5 bg-white rounded-2xl shadow-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-dark text-sm">{isRtl ? 'حماية التراث اليمني' : 'Protecting Yemeni Heritage'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{isRtl ? 'من أجل الأجيال القادمة' : 'For future generations'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── رؤيتنا وأهدافنا ───────────────────────────────── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-10">
            <SectionTitle>{isRtl ? 'رؤيتنا وأهدافنا' : 'Our Vision & Goals'}</SectionTitle>
            <p className="text-gray-500 max-w-xl mx-auto text-sm mt-4">
              {isRtl
                ? 'نعمل من أجل يمن يحتفي بتراثه ويبني مستقبله على أسس من العلم والثقافة والسلام'
                : 'We work for a Yemen that celebrates its heritage and builds its future on science, culture, and peace'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {goals.map((goal, i) => {
              const Icon = goal.icon
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-dark mb-2">{goal.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{goal.text}</p>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-10">
            <Link to="/about" className="btn-primary">
              {isRtl ? 'اقرأ المزيد عن المنظمة' : 'Learn More About Us'}<Arrow size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── الحياة التراثية ───────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-10">
            <SectionTitle>{t.heritage_life_title}</SectionTitle>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/heritage-life?type=tangible"
              className="relative group rounded-2xl overflow-hidden shadow-md border border-gray-100 h-64">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Temple_in_Ancient_city_of_Marib.jpg/1280px-Temple_in_Ancient_city_of_Marib.jpg"
                alt={isRtl ? 'معلم أثري في مأرب' : 'Archaeological site in Marib'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />
              <div className="absolute bottom-0 p-6 text-white text-start">
                <div className="flex items-center gap-2 mb-2">
                  <Landmark size={15} className="text-primary" />
                  <span className="text-primary text-xs font-semibold uppercase tracking-widest">
                    {isRtl ? 'التراث المادي' : 'Tangible'}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1">{t.nav.tangible}</h3>
                <p className="text-sm text-gray-200">{t.tangible_desc}</p>
              </div>
            </Link>

            <Link to="/heritage-life?type=intangible"
              className="relative group rounded-2xl overflow-hidden shadow-md border border-gray-100 h-64">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Janbiya_Dance%2C_Yemen_%2811041030075%29.jpg/1280px-Janbiya_Dance%2C_Yemen_%2811041030075%29.jpg"
                alt={isRtl ? 'رقصة شعبية يمنية' : 'Traditional Yemeni dance'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />
              <div className="absolute bottom-0 p-6 text-white text-start">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={15} className="text-primary" />
                  <span className="text-primary text-xs font-semibold uppercase tracking-widest">
                    {isRtl ? 'التراث اللامادي' : 'Intangible'}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1">{t.nav.intangible}</h3>
                <p className="text-sm text-gray-200">{t.intangible_desc}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── آخر الأخبار ───────────────────────────────────── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <SectionTitle align="start">{t.latest_news}</SectionTitle>
            <Link to="/news" className="hidden md:inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm shrink-0 ms-4">
              {t.view_all}<Arrow size={14} />
            </Link>
          </div>

          {news.length === 0 ? (
            <div className="text-center py-12 text-gray-400">{isRtl ? 'لا توجد أخبار منشورة حالياً' : 'No published news yet'}</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {news.slice(0, 3).map(item => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="relative overflow-hidden h-44">
                    {item.image_url
                      ? <img src={resolveMediaUrl(item.image_url)} alt={isRtl ? item.title : (item.title_en || item.title)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Newspaper size={32} className="text-gray-300" /></div>
                    }
                    <span className="absolute top-3 start-3 text-xs text-white bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
                      {isRtl ? item.category : (item.category_en || item.category)}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-dark mb-2 line-clamp-2 text-base leading-snug">
                      {isRtl ? item.title : (item.title_en || item.title)}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                      {isRtl ? item.content : (item.content_en || item.content)}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Newspaper size={12} />
                        {new Date(item.created_at).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')}
                      </span>
                      <Link to="/news" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                        {t.read_more}<ChevronDir size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── الفعاليات ─────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <SectionTitle align="start">{t.latest_events}</SectionTitle>
            <Link to="/events" className="hidden md:inline-flex items-center gap-2 btn-primary text-sm shrink-0 ms-4">
              {t.view_all}<Arrow size={14} />
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-gray-400">{isRtl ? 'لا توجد فعاليات منشورة حالياً' : 'No upcoming events yet'}</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {events.slice(0, 3).map(item => {
                const badge = typeBadge(item.type)
                return (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                    {item.image_url && (
                      <div className="relative h-44 overflow-hidden">
                        <img src={item.image_url} alt={isRtl ? item.title : (item.title_en || item.title)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark/40 to-transparent" />
                        <span className={`absolute top-3 start-3 text-xs text-white px-2.5 py-1 rounded-full font-medium backdrop-blur-sm ${badge.cls}`}>
                          {isRtl ? badge.ar : badge.en}
                        </span>
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                          {eventIcon(item.type)}
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">{t.date_field}</div>
                          <div className="text-dark font-semibold text-sm">
                            {item.event_date
                              ? new Date(item.event_date).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                              : '—'}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-dark mb-3 leading-snug line-clamp-2">
                        {isRtl ? item.title : (item.title_en || item.title)}
                      </h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <MapPin size={13} className="text-primary shrink-0" />
                        {isRtl ? (item.location || '') : (item.location_en || item.location || '')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── شركاؤنا ───────────────────────────────────────── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-10">
            <SectionTitle>{t.partners_title}</SectionTitle>
          </div>

          {partners.length === 0 ? (
            <div className="text-center text-gray-400 py-10">{isRtl ? 'لا توجد جهات شريكة مضافة بعد' : 'No partners added yet'}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {partners.map((p, i) => (
                <a
                  key={p.id || i}
                  href={p.website_url || '#'}
                  target={p.website_url ? '_blank' : undefined}
                  rel={p.website_url ? 'noreferrer' : undefined}
                  className="bg-white rounded-2xl border border-gray-200 px-4 py-6 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-center gap-4 min-h-[140px]"
                >
                  {p.logo_url && !partnerErrors[p.id || i] ? (
                    <div className="h-12 flex items-center justify-center w-full">
                      <img
                        src={resolveMediaUrl(p.logo_url)}
                        alt={isRtl ? p.name : (p.name_en || p.name)}
                        className="max-h-12 w-auto max-w-[110px] object-contain"
                        loading="lazy"
                        onError={() => setPartnerErrors(prev => ({ ...prev, [p.id || i]: true }))}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                      {(isRtl ? p.name : (p.name_en || p.name)).slice(0, 2)}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-gray-700 text-center leading-snug line-clamp-2 w-full">
                    {isRtl ? p.name : (p.name_en || p.name)}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

    </main>
  )
}
