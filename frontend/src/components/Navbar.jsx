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

const XIcon = ({ size = 16, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export default function Navbar() {
  const { t, toggleLang, settings } = useLang()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState(null)
  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    setOpenDrop(null)
  }, [location.pathname, location.search])

  useEffect(() => {
    setLogoSrc(resolveMediaUrl(settings?.logo_url?.trim() || '') || DEFAULT_LOGO)
  }, [settings?.logo_url])

  const navText = 'nav-link-dark'

  const dropdowns = useMemo(
    () => ({
      activities: [
        { label: t.nav.events, href: '/events' },
        { label: t.nav.seminars, href: '/events?type=seminar' },
        { label: t.nav.projects, href: '/events?type=project' },
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
    [t]
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

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300">
        {/* Desktop Top Bar */}
        <div className="hidden bg-primary px-4 py-4 md:block">
          <div className="flex w-full items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <img
                src="/logowhite.png"
                alt={settings?.site_name_en || settings?.site_name_ar || 'logo'}
                className="h-12 w-auto"
              />

              <div className="flex flex-col leading-tight text-white">
                <span className="text-base font-semibold">
                  منظمة تراث اليمن لأجل السلام
                </span>
                <span className="text-sm text-white/80">
                  Yemen Heritage for Peace Organization
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

        {/* Main Nav */}
        <div className="bg-white md:border-b md:border-gray-200 md:shadow-sm">
          <div className="w-full px-0 py-0 md:px-4 md:py-3">
            {/* Desktop Nav */}
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

                <NavLink
                  to="/news"
                  className={({ isActive }) =>
                    `${navText} ${isActive ? 'active' : ''}`
                  }
                >
                  {t.nav.news}
                </NavLink>

                <DropMenu
                  label={t.nav.activities}
                  items={dropdowns.activities}
                  open={openDrop === 'activities'}
                  onToggle={() =>
                    setOpenDrop((open) =>
                      open === 'activities' ? null : 'activities'
                    )
                  }
                  active={dropdownActive('activities')}
                  navText={navText}
                />

                <DropMenu
                  label={t.nav.fields}
                  items={dropdowns.fields}
                  open={openDrop === 'fields'}
                  onToggle={() =>
                    setOpenDrop((open) => (open === 'fields' ? null : 'fields'))
                  }
                  active={dropdownActive('fields')}
                  navText={navText}
                />

                <DropMenu
                  label={t.nav.heritage_life}
                  items={dropdowns.heritage_life}
                  open={openDrop === 'heritage_life'}
                  onToggle={() =>
                    setOpenDrop((open) =>
                      open === 'heritage_life' ? null : 'heritage_life'
                    )
                  }
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

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLang}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-dark transition hover:border-primary"
                >
                  <Globe size={16} />
                  {t.nav.lang}
                </button>

                <button
                  onClick={() => navigate('/admin/login')}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-dark transition hover:border-primary"
                >
                  <ShieldCheck size={16} />
                  {t.nav.admin}
                </button>
              </div>
            </div>

            {/* Mobile Top Bar - full width, no white side padding */}
            <div className="w-full md:hidden">
              <div className="flex min-h-[52px] w-full items-center justify-between gap-2 bg-primary px-3 py-2">
                <div className="shrink-0">
                  <img
                    src="/logowhite.png"
                    alt={settings?.site_name_en || settings?.site_name_ar || 'logo'}
                    className="block h-8 w-auto"
                  />
                </div>

                <div className="flex flex-1 items-center justify-center gap-1.5 px-1">
                  <MobileSocialLink
                    href={settings?.social_facebook}
                    label="Facebook"
                    icon={<Facebook size={14} />}
                  />
                  <MobileSocialLink
                    href={settings?.social_youtube}
                    label="YouTube"
                    icon={<Youtube size={14} />}
                  />
                  <MobileSocialLink
                    href={settings?.social_linkedin}
                    label="LinkedIn"
                    icon={<Linkedin size={14} />}
                  />
                  <MobileSocialLink
                    href={settings?.social_x}
                    label="X"
                    icon={<XIcon size={14} />}
                  />
                  <MobileSocialLink
                    href={settings?.social_instagram}
                    label="Instagram"
                    icon={<Instagram size={14} />}
                  />
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    className="block p-1 text-white"
                    onClick={() => setMobileOpen((open) => !open)}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {mobileOpen && (
            <div className="max-h-[80vh] overflow-y-auto border-t border-gray-200 bg-white px-4 pb-4 shadow-xl md:hidden">
              {[
                { label: t.nav.home, href: '/' },
                { label: t.nav.about, href: '/about' },
                { label: t.nav.news, href: '/news' },
                { label: t.nav.events, href: '/events' },
                { label: t.nav.fields, href: '/fields' },
                { label: t.nav.heritage_life, href: '/heritage-life' },
                { label: t.nav.contact, href: '/contact' },
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={[
                    'block border-b border-gray-200 py-3 text-dark transition-colors',
                    isActiveQueryLink(item.href)
                      ? 'font-semibold text-primary'
                      : 'hover:text-primary',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-4 flex gap-3">
                <button
                  onClick={toggleLang}
                  className="btn-outline inline-flex flex-1 items-center justify-center gap-2 py-2 text-sm"
                >
                  <Globe size={16} />
                  {t.nav.lang}
                </button>

                <button
                  onClick={() => navigate('/admin/login')}
                  className="btn-primary inline-flex flex-1 items-center justify-center gap-2 py-2 text-sm"
                >
                  <ShieldCheck size={16} />
                  {t.nav.admin}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="h-[52px] md:h-[120px]" aria-hidden="true" />
    </>
  )
}

function SocialLink({ href, label, icon }) {
  return (
    <a
      href={href || '#'}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm"
    >
      {icon}
    </a>
  )
}

function MobileSocialLink({ href, label, icon }) {
  return (
    <a
      href={href || '#'}
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
  const ref = useRef()

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
            <Link key={index} to={item.href} className="dropdown-item">
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
