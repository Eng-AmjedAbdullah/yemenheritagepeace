import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../App'
import { resolveMediaUrl } from '../lib/media'
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  ShieldCheck,
  Facebook,
  Youtube,
  Linkedin,
  Instagram,
} from 'lucide-react'

const DEFAULT_LOGO = '/logo.png'
const WHITE_LOGO = '/logowhite.png'

const XIcon = ({ size = 16, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export default function Navbar() {
  const { t, toggleLang, settings, lang } = useLang()
  const isRtl = lang === 'ar'

  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState(null)
  const [mobileDrop, setMobileDrop] = useState(null)
  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    setOpenDrop(null)
    setMobileDrop(null)
  }, [location.pathname, location.search])

  useEffect(() => {
    const uploadedLogo = resolveMediaUrl(settings?.logo_url?.trim() || '')
    setLogoSrc(uploadedLogo || DEFAULT_LOGO)
  }, [settings?.logo_url])

  const navText = 'nav-link-dark'

  const labels = useMemo(
    () => ({
      mediaCenter:
        t.nav.media_center ||
        t.nav.mediaCenter ||
        (isRtl ? 'المركز الإعلامي' : 'Media Center'),

      eventsActivities:
        t.nav.events_activities ||
        t.nav.eventsActivities ||
        (isRtl ? 'الفعاليات والأنشطة' : 'Events & Activities'),

      seminars:
        t.nav.seminars ||
        (isRtl ? 'الندوات' : 'Seminars'),

      projects:
        t.nav.projects ||
        (isRtl ? 'المشاريع' : 'Projects'),

      photoGallery:
        t.nav.photo_gallery ||
        t.nav.photoGallery ||
        (isRtl ? 'معرض الصور' : 'Photo Gallery'),

      videoGallery:
        t.nav.video_gallery ||
        t.nav.videoGallery ||
        (isRtl ? 'معرض الفيديو' : 'Video Gallery'),
    }),
    [t, isRtl]
  )

  const dropdowns = useMemo(
    () => ({
      media_center: [
        { label: t.nav.news, href: '/news' },
        { label: labels.eventsActivities, href: '/events' },
        { label: labels.seminars, href: '/events?type=seminar' },
        { label: labels.projects, href: '/events?type=project' },
        { label: labels.photoGallery, href: '/photo-gallery' },
        { label: labels.videoGallery, href: '/video-gallery' },
      ],

      fields: [
        { label: t.nav.heritage_field, href: '/fields?f=heritage' },
        {
          label: t.nav.studies,
          href: '/fields?f=studies',
          parent: t.nav.science,
        },
        {
          label: t.nav.training,
          href: '/fields?f=training',
          parent: t.nav.science,
        },
        { label: t.nav.culture, href: '/fields?f=culture' },
        { label: t.nav.environment, href: '/fields?f=environment' },
      ],

      heritage_life: [
        { label: t.nav.tangible, href: '/heritage-life?type=tangible' },
        { label: t.nav.intangible, href: '/heritage-life?type=intangible' },
      ],
    }),
    [t, labels]
  )

  const mobileLinks = useMemo(
    () => [
      { label: t.nav.home, href: '/' },
      { label: t.nav.about, href: '/about' },
      {
        label: labels.mediaCenter,
        key: 'media_center',
        children: dropdowns.media_center,
      },
      {
        label: t.nav.fields,
        key: 'fields',
        children: dropdowns.fields,
      },
      {
        label: t.nav.heritage_life,
        key: 'heritage_life',
        children: dropdowns.heritage_life,
      },
      { label: t.nav.contact, href: '/contact' },
    ],
    [t, labels, dropdowns]
  )

  const isActiveQueryLink = (to) => {
    if (!to) return false

    const [path, qs] = String(to).split('?')
    const pathActive =
      location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(`${path}/`))

    if (!qs) return pathActive

    const target = new URLSearchParams(qs)
    const current = new URLSearchParams(location.search)

    for (const [key, value] of target.entries()) {
      if (current.get(key) !== value) return false
    }

    return pathActive
  }

  const dropdownActive = (key) =>
    (dropdowns[key] || []).some((item) => isActiveQueryLink(item.href))

  const toggleDesktopDropdown = (key) => {
    setOpenDrop((current) => (current === key ? null : key))
  }

  const toggleMobileDropdown = (key) => {
    setMobileDrop((current) => (current === key ? null : key))
  }

  const handleAdminClick = () => {
    setMobileOpen(false)
    navigate('/admin/login')
  }

  return (
    <>
      <nav
        className="fixed left-0 right-0 top-0 z-50 bg-white transition-all duration-300"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* DESKTOP TOP BAR */}
        <div className="hidden bg-primary px-4 py-4 md:block">
          <div className="flex w-full items-center justify-between gap-4 px-4">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <img
                src={WHITE_LOGO}
                alt={settings?.site_name_en || settings?.site_name_ar || 'logo'}
                className="h-12 w-auto shrink-0"
                onError={(event) => {
                  event.currentTarget.src = logoSrc
                }}
              />

              <div className="flex min-w-0 flex-col leading-tight text-white">
                <span className="truncate text-base font-semibold">
                  منظمة تراث اليمن لأجل السلام
                </span>

                <span className="truncate text-sm text-white/80">
                  Yemen Heritage for Peace Organization
                </span>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <SocialLink
                href={settings?.social_facebook}
                label="Facebook"
                icon={<Facebook size={18} />}
              />

              <SocialLink
                href={settings?.social_youtube}
                label="YouTube"
                icon={<Youtube size={18} />}
              />

              <SocialLink
                href={settings?.social_linkedin}
                label="LinkedIn"
                icon={<Linkedin size={18} />}
              />

              <SocialLink
                href={settings?.social_x}
                label="X"
                icon={<XIcon size={18} />}
              />

              <SocialLink
                href={settings?.social_instagram}
                label="Instagram"
                icon={<Instagram size={18} />}
              />
            </div>
          </div>
        </div>

        {/* MAIN NAV */}
        <div className="bg-white md:border-b md:border-gray-200 md:shadow-sm">
          <div className="w-full px-0 py-0 md:px-4 md:py-3">
            {/* DESKTOP NAV */}
            <div className="hidden w-full items-center justify-between gap-3 rounded-[999px] border border-gray-200 bg-white px-4 py-2 shadow-sm md:flex">
              <div className="flex min-w-[260px] flex-1 flex-wrap items-center justify-center gap-3">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `${navText} ${isActive ? 'active' : ''}`
                  }
                >
                  {t.nav.home}
                </NavLink>

                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `${navText} ${isActive ? 'active' : ''}`
                  }
                >
                  {t.nav.about}
                </NavLink>

                <DropMenu
                  label={labels.mediaCenter}
                  items={dropdowns.media_center}
                  open={openDrop === 'media_center'}
                  onToggle={() => toggleDesktopDropdown('media_center')}
                  active={dropdownActive('media_center')}
                  navText={navText}
                />

                <DropMenu
                  label={t.nav.fields}
                  items={dropdowns.fields}
                  open={openDrop === 'fields'}
                  onToggle={() => toggleDesktopDropdown('fields')}
                  active={dropdownActive('fields')}
                  navText={navText}
                />

                <DropMenu
                  label={t.nav.heritage_life}
                  items={dropdowns.heritage_life}
                  open={openDrop === 'heritage_life'}
                  onToggle={() => toggleDesktopDropdown('heritage_life')}
                  active={dropdownActive('heritage_life')}
                  navText={navText}
                />

                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    `${navText} ${isActive ? 'active' : ''}`
                  }
                >
                  {t.nav.contact}
                </NavLink>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={toggleLang}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-dark transition hover:border-primary"
                >
                  <Globe size={16} />
                  {t.nav.lang}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-dark transition hover:border-primary"
                >
                  <ShieldCheck size={16} />
                  {t.nav.admin}
                </button>
              </div>
            </div>

            {/* MOBILE TOP BAR */}
            <div className="w-full md:hidden">
              <div className="flex min-h-[56px] w-full items-center justify-between gap-2 bg-primary px-3 py-2">
                <Link
                  to="/"
                  className="order-1 flex shrink-0 items-center"
                  aria-label={settings?.site_name_en || settings?.site_name_ar || 'Home'}
                >
                  <img
                    src={WHITE_LOGO}
                    alt={settings?.site_name_en || settings?.site_name_ar || 'logo'}
                    className="block h-9 w-auto"
                    onError={(event) => {
                      event.currentTarget.src = logoSrc
                    }}
                  />
                </Link>

                <div className="order-2 flex min-w-0 flex-1 items-center justify-center gap-1 px-1">
                  <MobileSocialLink
                    href={settings?.social_instagram}
                    label="Instagram"
                    icon={<Instagram size={14} />}
                  />

                  <MobileSocialLink
                    href={settings?.social_x}
                    label="X"
                    icon={<XIcon size={14} />}
                  />

                  <MobileSocialLink
                    href={settings?.social_linkedin}
                    label="LinkedIn"
                    icon={<Linkedin size={14} />}
                  />

                  <MobileSocialLink
                    href={settings?.social_youtube}
                    label="YouTube"
                    icon={<Youtube size={14} />}
                  />

                  <MobileSocialLink
                    href={settings?.social_facebook}
                    label="Facebook"
                    icon={<Facebook size={14} />}
                  />
                </div>

                <button
                  type="button"
                  className="order-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:bg-white/15"
                  onClick={() => setMobileOpen((open) => !open)}
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileOpen ? <X size={25} /> : <Menu size={25} />}
                </button>
              </div>
            </div>
          </div>

          {mobileOpen && (
            <div className="max-h-[82vh] overflow-y-auto border-t border-gray-200 bg-white px-4 pb-4 shadow-xl md:hidden">
              <div className="pt-2">
                {mobileLinks.map((item) => {
                  if (item.children) {
                    return (
                      <MobileDropMenu
                        key={item.key}
                        label={item.label}
                        items={item.children}
                        open={mobileDrop === item.key}
                        active={dropdownActive(item.key)}
                        onToggle={() => toggleMobileDropdown(item.key)}
                        isActiveQueryLink={isActiveQueryLink}
                      />
                    )
                  }

                  return (
                    <MobileNavItem
                      key={item.href}
                      to={item.href}
                      active={isActiveQueryLink(item.href)}
                    >
                      {item.label}
                    </MobileNavItem>
                  )
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={toggleLang}
                  className="btn-outline inline-flex items-center justify-center gap-2 py-2 text-sm"
                >
                  <Globe size={16} />
                  {t.nav.lang}
                </button>

                <button
                  type="button"
                  onClick={handleAdminClick}
                  className="btn-primary inline-flex items-center justify-center gap-2 py-2 text-sm"
                >
                  <ShieldCheck size={16} />
                  {t.nav.admin}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="h-[56px] md:h-[120px]" aria-hidden="true" />
    </>
  )
}

function normalizeHref(href) {
  const value = String(href || '').trim()
  if (!value || value === '#') return ''
  return value
}

function SocialLink({ href, label, icon }) {
  const url = normalizeHref(href)
  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {icon}
    </a>
  )
}

function MobileSocialLink({ href, label, icon }) {
  const url = normalizeHref(href)
  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm"
    >
      {icon}
    </a>
  )
}

function DropMenu({ label, items, open, onToggle, active, navText = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target) && open) {
        onToggle()
      }
    }

    document.addEventListener('mousedown', handler)

    return () => document.removeEventListener('mousedown', handler)
  }, [open, onToggle])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className={`nav-link ${active ? 'active' : ''} flex items-center gap-1 ${navText}`}
      >
        {label}

        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="dropdown-menu">
          {items.map((item, index) => (
            <Link
              key={`${item.href}-${index}`}
              to={item.href}
              className="dropdown-item"
            >
              {item.parent && (
                <span className="block text-xs text-primary/60">
                  {item.parent} /
                </span>
              )}

              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function MobileNavItem({ to, active, children }) {
  return (
    <Link
      to={to}
      className={[
        'block border-b border-gray-200 py-3 text-dark transition-colors',
        active ? 'font-semibold text-primary' : 'hover:text-primary',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}

function MobileDropMenu({
  label,
  items,
  open,
  active,
  onToggle,
  isActiveQueryLink,
}) {
  return (
    <div className="border-b border-gray-200">
      <button
        type="button"
        onClick={onToggle}
        className={[
          'flex w-full items-center justify-between gap-3 py-3 text-dark transition-colors',
          active ? 'font-semibold text-primary' : 'hover:text-primary',
        ].join(' ')}
      >
        <span>{label}</span>

        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="pb-2">
          {items.map((item, index) => (
            <Link
              key={`${item.href}-${index}`}
              to={item.href}
              className={[
                'block rounded-xl px-3 py-2 text-sm transition-colors',
                isActiveQueryLink(item.href)
                  ? 'bg-primary/10 font-semibold text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-primary',
              ].join(' ')}
            >
              {item.parent && (
                <span className="block text-xs text-primary/60">
                  {item.parent} /
                </span>
              )}

              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
