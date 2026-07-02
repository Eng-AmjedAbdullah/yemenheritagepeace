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
  const { t, dir, toggleLang, settings } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState(null)
  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setOpenDrop(null)
  }, [location.pathname, location.search])

  useEffect(() => {
    setLogoSrc(resolveMediaUrl(settings?.logo_url?.trim() || '') || DEFAULT_LOGO)
  }, [settings?.logo_url])

  const navBg = 'bg-white'
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
        { label: t.nav.studies, href: '/fields?f=studies', parent: t.nav.science },
        { label: t.nav.training, href: '/fields?f=training', parent: t.nav.science },
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
    const pathActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'))
    if (!qs) return pathActive
    const target = new URLSearchParams(qs)
    const current = new URLSearchParams(location.search)
    for (const [k, v] of target.entries()) {
      if (current.get(k) !== v) return false
    }
    return pathActive
  }

  const dropdownActive = (key) => (dropdowns[key] || []).some((it) => isActiveQueryLink(it.href))

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        {/* Top bar (Desktop Layout) */}
        <div className="bg-primary py-4 px-4 hidden md:block">
          <div className="w-full flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <img src="/logowhite.png" alt={settings?.site_name_en || settings?.site_name_ar || 'logo'} className="h-12 w-auto" />
              <div className="flex flex-col text-white leading-tight">
                <span className="font-semibold text-base">منظمة تراث اليمن لأجل السلام</span>
                <span className="text-sm text-white/80">Yemen Heritage for Peace Organization</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a href={settings?.social_facebook || '#'} target="_blank" rel="noreferrer" aria-label="Facebook" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm"><Facebook size={18} /></a>
              <a href={settings?.social_youtube || '#'} target="_blank" rel="noreferrer" aria-label="YouTube" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm"><Youtube size={18} /></a>
              <a href={settings?.social_linkedin || '#'} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm"><Linkedin size={18} /></a>
              <a href={settings?.social_x || '#'} target="_blank" rel="noreferrer" aria-label="X" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm"><XIcon size={18} /></a>
              <a href={settings?.social_instagram || '#'} target="_blank" rel="noreferrer" aria-label="Instagram" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm"><Instagram size={18} /></a>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="w-full px-4 py-3">
            <div className="hidden md:flex w-full items-center justify-between gap-3 bg-white rounded-[999px] border border-gray-200 px-4 py-2 shadow-sm">
              <div className="flex flex-wrap items-center justify-center gap-3 flex-1 min-w-[260px]">
                <NavLink to="/" end className={({ isActive }) => `${navText} ${isActive ? 'active' : ''}`}>{t.nav.home}</NavLink>
                <NavLink to="/about" className={({ isActive }) => `${navText} ${isActive ? 'active' : ''}`}>{t.nav.about}</NavLink>
                <NavLink to="/news" className={({ isActive }) => `${navText} ${isActive ? 'active' : ''}`}>{t.nav.news}</NavLink>
                <DropMenu label={t.nav.activities} items={dropdowns.activities} open={openDrop === 'activities'} onToggle={() => setOpenDrop((o) => (o === 'activities' ? null : 'activities'))} active={dropdownActive('activities')} navText={navText} />
                <DropMenu label={t.nav.fields} items={dropdowns.fields} open={openDrop === 'fields'} onToggle={() => setOpenDrop((o) => (o === 'fields' ? null : 'fields'))} active={dropdownActive('fields')} navText={navText} />
                <DropMenu label={t.nav.heritage_life} items={dropdowns.heritage_life} open={openDrop === 'heritage_life'} onToggle={() => setOpenDrop((o) => (o === 'heritage_life' ? null : 'heritage_life'))} active={dropdownActive('heritage_life')} navText={navText} />
                <NavLink to="/contact" className={({ isActive }) => `${navText} ${isActive ? 'active' : ''}`}>{t.nav.contact}</NavLink>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleLang} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-dark hover:border-primary transition"><Globe size={16} />{t.nav.lang}</button>
                <button onClick={() => navigate('/admin/login')} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-dark hover:border-primary transition"><ShieldCheck size={16} />{t.nav.admin}</button>
              </div>
            </div>

            {/* RESPONSIVE MOBILE TOP BAR */}
            <div className="md:hidden">
              <div className="bg-primary px-3 py-2 flex items-center justify-between gap-2 min-h-[52px]">
                
                {/* 1. Logo (Proportionally sized) */}
                <div className="shrink-0">
                  <img 
                    src="/logowhite.png" 
                    alt={settings?.site_name_en || settings?.site_name_ar || 'logo'} 
                    className="h-8 w-auto block" 
                  />
                </div>
                
                {/* 2. Scaled Down Social Containers (Clean size alignment) */}
                <div className="flex items-center justify-center gap-1.5 flex-1 px-1">
                  <a href={settings?.social_facebook || '#'} target="_blank" rel="noreferrer" aria-label="Facebook" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
                    <Facebook size={14} />
                  </a>
                  <a href={settings?.social_youtube || '#'} target="_blank" rel="noreferrer" aria-label="YouTube" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
                    <Youtube size={14} />
                  </a>
                  <a href={settings?.social_linkedin || '#'} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
                    <Linkedin size={14} />
                  </a>
                  <a href={settings?.social_x || '#'} target="_blank" rel="noreferrer" aria-label="X" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
                    <XIcon size={14} />
                  </a>
                  <a href={settings?.social_instagram || '#'} target="_blank" rel="noreferrer" aria-label="Instagram" className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
                    <Instagram size={14} />
                  </a>
                </div>

                {/* 3. Action Drawer Toggle */}
                <div className="shrink-0">
                  <button className="text-white p-1 block" onClick={() => setMobileOpen((o) => !o)}>
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>

              </div>
            </div>

          </div>
          {mobileOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 px-4 pb-4 max-h-[80vh] overflow-y-auto shadow-xl">
              {[
                { label: t.nav.home, href: '/' },
                { label: t.nav.about, href: '/about' },
                { label: t.nav.news, href: '/news' },
                { label: t.nav.events, href: '/events' },
                { label: t.nav.fields, href: '/fields' },
                { label: t.nav.heritage_life, href: '/heritage-life' },
                { label: t.nav.contact, href: '/contact' },
              ].map((item) => (
                <Link key={item.href} to={item.href} className={['block py-3 border-b border-gray-200 transition-colors text-dark', isActiveQueryLink(item.href) ? 'font-semibold text-primary' : 'hover:text-primary'].join(' ')}>
                  {item.label}
                </Link>
              ))}

              <div className="flex gap-3 mt-4">
                <button onClick={toggleLang} className="flex-1 btn-outline py-2 text-sm justify-center inline-flex items-center gap-2"><Globe size={16} />{t.nav.lang}</button>
                <button onClick={() => navigate('/admin/login')} className="flex-1 btn-primary py-2 text-sm justify-center inline-flex items-center gap-2"><ShieldCheck size={16} />{t.nav.admin}</button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <div className="h-[92px] md:h-[120px]" aria-hidden="true" />
    </>
  )
}

function DropMenu({ label, items, open, onToggle, active, navText = '' }) {
  const ref = useRef()
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target) && open) onToggle() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onToggle])

  return (
    <div className="relative" ref={ref}>
      <button onClick={onToggle} className={`nav-link ${active ? 'active' : ''} flex items-center gap-1 ${navText}`}>
        {label}
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="dropdown-menu">
          {items.map((item, i) => (
            <Link key={i} to={item.href} className="dropdown-item">
              {item.parent && <span className="text-primary/60 text-xs block">{item.parent} /</span>}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
