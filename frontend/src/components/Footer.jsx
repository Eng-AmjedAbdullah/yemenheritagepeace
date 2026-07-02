import { Link } from 'react-router-dom'
import { useLang } from '../App'
import { Facebook, Youtube, Linkedin, Instagram, Phone, Mail, MapPin, Dot } from 'lucide-react'

const XIcon = ({ size = 16, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export default function Footer() {
  const { t, lang, settings } = useLang()
  const year = new Date().getFullYear()
  const isRtl = lang === 'ar'

  const phone = settings?.contact_phone ?? ''
  const email = settings?.contact_email ?? ''
  const address = isRtl
    ? (settings?.address_ar ?? t.address_val)
    : (settings?.address_en ?? t.address_val)

  const footerDesc = isRtl
    ? (settings?.footer_desc_ar ?? t.footer_desc)
    : (settings?.footer_desc_en ?? t.footer_desc)

  return (
    <footer className="relative bg-primary text-white mt-12 sm:mt-24">
      {/* Inward Curve (Concave) SVG Section */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none transform -translate-y-[99%]">
        <svg
          className="block w-full h-[30px] sm:h-[50px] md:h-[70px]"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* This path fills the bottom corners up to a center dip */}
          <path
            d="M0,0 L0,100 L1440,100 L1440,0 C960,100 480,100 0,0 Z"
            className="fill-primary"
          />
        </svg>
      </div>

      <div className="w-full max-w-[1180px] mx-auto px-6 sm:px-8 lg:px-10 pb-12 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 gap-x-8 items-start">
          <div className={`lg:col-span-5 ${isRtl ? 'text-right' : 'text-left'}`}>
            <img
              src="/logowhite.png"
              alt={settings?.site_name_en || settings?.site_name_ar || 'Logo'}
              className={`h-16 w-auto mb-4 ${isRtl ? 'mr-0 ml-auto' : ''}`}
            />

            <h3 className="text-xl font-bold text-white mb-3">
              {isRtl
                ? 'منظمة تراث اليمن لأجل السلام'
                : 'Yemen Heritage for Peace Organization'}
            </h3>

            <p className="text-white/80 text-sm leading-relaxed max-w-[560px]">
              {footerDesc}
            </p>
          </div>

          <div className={`lg:col-span-3 ${isRtl ? 'text-right lg:justify-self-center' : 'text-left lg:justify-self-center'}`}>
            <h4 className="font-bold text-white mb-4 border-b border-primary/30 pb-2">
              {isRtl ? 'روابط سريعة' : 'Quick Links'}
            </h4>

            <ul className="space-y-2 text-sm">
              {[
                { label: t.nav.home, href: '/' },
                { label: t.nav.about, href: '/about' },
                { label: t.nav.news, href: '/news' },
                { label: t.nav.contact, href: '/contact' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`text-white/80 hover:text-white transition-colors flex items-center gap-2 ${isRtl ? 'justify-start' : 'justify-start'}`}
                  >
                    <Dot size={18} className="text-white/60 -ms-2 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={`lg:col-span-4 ${isRtl ? 'text-right lg:justify-self-start' : 'text-left lg:justify-self-end'}`}>
            <h4 className="font-bold text-white mb-4 border-b border-primary/30 pb-2">
              {t.contact_title}
            </h4>

            <ul className="space-y-3 text-sm text-white/90">
              {phone && (
                <li className={`flex items-start gap-3 ${isRtl ? 'justify-start' : 'justify-start'}`}>
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-white" />
                  </span>
                  <span dir="ltr">{phone}</span>
                </li>
              )}

              {email && (
                <li className={`flex items-start gap-3 ${isRtl ? 'justify-start' : 'justify-start'}`}>
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-white" />
                  </span>
                  <a
                    href={`mailto:${email}`}
                    className="hover:text-white transition-colors break-all"
                  >
                    {email}
                  </a>
                </li>
              )}

              {address && (
                <li className={`flex items-start gap-3 ${isRtl ? 'justify-start' : 'justify-start'}`}>
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-white" />
                  </span>
                  <span>{address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {settings?.social_facebook && (
              <a
                href={settings.social_facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm transition hover:scale-105"
              >
                <Facebook size={18} />
              </a>
            )}

            {settings?.social_youtube && (
              <a
                href={settings.social_youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm transition hover:scale-105"
              >
                <Youtube size={18} />
              </a>
            )}

            {settings?.social_linkedin && (
              <a
                href={settings.social_linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm transition hover:scale-105"
              >
                <Linkedin size={18} />
              </a>
            )}

            {settings?.social_x && (
              <a
                href={settings.social_x}
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm transition hover:scale-105"
              >
                <XIcon size={18} />
              </a>
            )}

            {settings?.social_instagram && (
              <a
                href={settings.social_instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm transition hover:scale-105"
              >
                <Instagram size={18} />
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-sm text-white/70">
          © {year} {isRtl
            ? 'منظمة تراث اليمن لأجل السلام'
            : 'Yemen Heritage for Peace Organization'} - {t.rights}
        </div>
      </div>
    </footer>
  )
}
