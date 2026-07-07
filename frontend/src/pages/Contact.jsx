import { useState } from 'react'
import { useLang } from '../App'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  Send,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Youtube,
  Linkedin,
  Instagram,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'

const XIcon = ({ size = 18, className = '' }) => (
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

export default function Contact() {
  const { t, lang, settings } = useLang()
  const isArabic = lang === 'ar'

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name || !form.email || !form.message) {
      toast.error(
        isArabic
          ? 'يرجى ملء جميع الحقول المطلوبة'
          : 'Please fill all required fields'
      )
      return
    }

    setLoading(true)

    try {
      await api.post('/contact', form)

      toast.success(
        isArabic
          ? 'تم إرسال رسالتك بنجاح!'
          : 'Message sent successfully!'
      )

      setForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })
    } catch (error) {
      toast.error(error?.message || (isArabic ? 'حدث خطأ' : 'Error'))
    } finally {
      setLoading(false)
    }
  }

  const contactItems = [
    {
      icon: Phone,
      label: t.phone,
      value: settings?.contact_phone || '',
      href: settings?.contact_phone ? `tel:${settings.contact_phone}` : '',
      dir: 'ltr',
    },
    {
      icon: Mail,
      label: t.email,
      value: settings?.contact_email || '',
      href: settings?.contact_email ? `mailto:${settings.contact_email}` : '',
      dir: 'ltr',
    },
    {
      icon: MapPin,
      label: t.address,
      value: isArabic
        ? settings?.address_ar || t.address_val
        : settings?.address_en || t.address_val,
      href: '',
      dir: isArabic ? 'rtl' : 'ltr',
    },
  ].filter((item) => item.value)

  const socialLinks = [
    {
      label: 'Instagram',
      href: settings?.social_instagram,
      icon: <Instagram size={18} />,
    },
    {
      label: 'X',
      href: settings?.social_x,
      icon: <XIcon size={18} />,
    },
    {
      label: 'Facebook',
      href: settings?.social_facebook,
      icon: <Facebook size={18} />,
    },
    {
      label: 'YouTube',
      href: settings?.social_youtube,
      icon: <Youtube size={18} />,
    },
    {
      label: 'LinkedIn',
      href: settings?.social_linkedin,
      icon: <Linkedin size={18} />,
    },
  ]

  return (
    <main>
      <PageHeader
        title={t.contact_title}
        subtitle={isArabic ? 'يسعدنا تواصلكم معنا' : 'We’d love to hear from you'}
      />

      <section className="bg-gray-50 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-2">
          <div>
            <h2 className="mb-6 text-2xl font-bold text-dark">
              {isArabic ? 'معلومات التواصل' : 'Contact Information'}
            </h2>

            <div className="mb-8 space-y-4">
              {contactItems.map((item, index) => {
                const Icon = item.icon
                const content = (
                  <>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary">
                      <Icon
                        size={20}
                        className="text-primary transition-colors group-hover:text-white"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="mb-0.5 text-xs text-gray-400">
                        {item.label}
                      </div>

                      <div
                        className="break-words font-medium text-dark"
                        dir={item.dir}
                      >
                        {item.value}
                      </div>
                    </div>
                  </>
                )

                if (!item.href) {
                  return (
                    <div
                      key={index}
                      className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-primary/30"
                    >
                      {content}
                    </div>
                  )
                }

                return (
                  <a
                    key={index}
                    href={item.href}
                    className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-primary/30"
                  >
                    {content}
                  </a>
                )
              })}
            </div>

            <p className="mb-4 font-semibold text-dark">
              {isArabic ? 'تابعنا على:' : 'Follow Us:'}
            </p>

            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <SocialIconLink
                  key={social.label}
                  href={social.href}
                  label={social.label}
                  icon={social.icon}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-2xl font-bold text-dark">
              {isArabic ? 'أرسل رسالة' : 'Send a Message'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t.name_field} *
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t.email} *
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    className="input-field"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t.phone || (isArabic ? 'الهاتف' : 'Phone')}
                  </label>

                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                    className="input-field"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {isArabic ? 'الموضوع' : 'Subject'}
                  </label>

                  <input
                    value={form.subject}
                    onChange={(event) =>
                      setForm({ ...form, subject: event.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t.msg_field} *
                </label>

                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(event) =>
                    setForm({ ...form, message: event.target.value })
                  }
                  className="input-field resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  isArabic ? (
                    'جارِ الإرسال...'
                  ) : (
                    'Sending...'
                  )
                ) : (
                  <>
                    <Send size={16} />
                    {t.send}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}

function normalizeHref(href) {
  const value = String(href || '').trim()
  if (!value || value === '#') return ''
  return value
}

function SocialIconLink({ href, label, icon }) {
  const url = normalizeHref(href)

  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
    >
      {icon}
    </a>
  )
}
