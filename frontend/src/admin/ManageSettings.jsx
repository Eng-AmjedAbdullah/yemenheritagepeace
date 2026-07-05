import { useEffect, useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import ImageUpload from './ImageUpload'
import { Save } from 'lucide-react'
import { useLang } from '../App'
import { useAdminLang } from './adminI18n'

const EMPTY = {
  site_name_ar: '',
  site_name_en: '',
  logo_url: '',
  favicon_url: '',
  contact_phone: '',
  contact_email: '',
  address_ar: '',
  address_en: '',
  footer_desc_ar: '',
  footer_desc_en: '',
  social_facebook: '',
  social_youtube: '',
  social_linkedin: '',
  social_x: '',
  home_about_image_url: '',
  home_about_image_alt_ar: '',
  home_about_image_alt_en: '',
  about_desc_ar: '',
  about_desc_en: '',
  vision_ar: '',
  vision_en: '',
  mission_ar: '',
  mission_en: '',
}

const toastTheme = {
  success: {
    duration: 3000,
    style: {
      background: '#166534',
      color: '#ffffff',
      border: '1px solid #15803d',
      borderRadius: '12px',
      fontSize: '14px',
      padding: '14px 18px',
      boxShadow: '0 8px 24px rgba(22, 101, 52, 0.25)',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#166534',
    },
  },
  error: {
    duration: 4000,
    style: {
      background: '#7f1d1d',
      color: '#ffffff',
      border: '1px solid #991b1b',
      borderRadius: '12px',
      fontSize: '14px',
      padding: '14px 18px',
      boxShadow: '0 8px 24px rgba(127, 29, 29, 0.25)',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#7f1d1d',
    },
  },
}

export default function ManageSettings() {
  const { refreshSettings } = useLang()
  const { t, isRtl } = useAdminLang()

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('identity')

  const tabs = [
    { id: 'identity', label: isRtl ? 'هوية الموقع' : 'Identity' },
    { id: 'contact', label: isRtl ? 'التواصل' : 'Contact' },
    { id: 'about', label: isRtl ? 'من نحن' : 'About' },
    { id: 'social', label: isRtl ? 'السوشيال' : 'Social' },
    { id: 'footer', label: isRtl ? 'التذييل' : 'Footer' },
  ]

  const load = async () => {
    setLoading(true)

    try {
      const data = await api.get('/settings')
      setForm({ ...EMPTY, ...(data || {}) })
    } catch {
      setForm(EMPTY)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const save = async () => {
    setSaving(true)

    try {
      await api.put('/settings', form)

      toast.success(
        t.settingsSaved || (isRtl ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully'),
        toastTheme.success
      )

      refreshSettings?.()
      await load()
    } catch (error) {
      toast.error(
        error?.message || (isRtl ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Failed to save settings'),
        toastTheme.error
      )
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, name, dir, placeholder, type = 'text' }) => (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={form[name] || ''}
        onChange={(event) => updateField(name, event.target.value)}
        className="input-field block w-full max-w-full min-w-0"
        dir={dir || ''}
        placeholder={placeholder || ''}
      />
    </div>
  )

  const TextArea = ({ label, name, rows = 4, dir }) => (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <textarea
        rows={rows}
        value={form[name] || ''}
        onChange={(event) => updateField(name, event.target.value)}
        className="input-field block w-full max-w-full min-w-0 resize-none"
        dir={dir || ''}
      />
    </div>
  )

  const SectionTitle = ({ children }) => (
    <h2 className="text-lg font-bold text-dark md:text-xl">
      {children}
    </h2>
  )

  const UploadBox = ({ label, value, onChange, folder, lightBlue = false }) => (
    <div
      className={`max-w-full overflow-hidden rounded-2xl border p-3 sm:p-4 ${
        lightBlue
          ? 'border-sky-100 bg-sky-50/80 [&_.bg-white]:!bg-sky-50 [&_img]:max-w-full'
          : 'border-gray-100 bg-gray-50/60'
      }`}
    >
      <ImageUpload
        value={value || ''}
        onChange={onChange}
        folder={folder}
        label={label}
      />
    </div>
  )

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-dark md:text-3xl">
            {t.manageSiteSettings}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isRtl
              ? 'إدارة هوية الموقع ومعلومات التواصل والمحتوى العام'
              : 'Manage website identity, contact details, and public content'}
          </p>
        </div>

        <button
          onClick={save}
          disabled={saving || loading}
          className="btn-primary w-full justify-center sm:w-auto"
        >
          <Save size={16} />
          {saving ? t.saving : t.save}
        </button>
      </div>

      <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-max gap-1 rounded-2xl bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-dark shadow-sm'
                  : 'text-gray-500 hover:bg-white/60 hover:text-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 md:p-6">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center text-gray-400">
            {t.loading}
          </div>
        ) : (
          <>
            {activeTab === 'identity' && (
              <div className="space-y-5">
                <SectionTitle>
                  {isRtl ? 'هوية وشعار الموقع' : 'Site Identity & Logo'}
                </SectionTitle>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label={isRtl ? 'اسم الموقع (عربي)' : 'Site Name (Arabic)'}
                    name="site_name_ar"
                  />

                  <Field
                    label={isRtl ? 'اسم الموقع (إنجليزي)' : 'Site Name (English)'}
                    name="site_name_en"
                    dir="ltr"
                  />
                </div>

                <UploadBox
                  value={form.logo_url || ''}
                  onChange={(value) => updateField('logo_url', value)}
                  folder="site"
                  lightBlue
                  label={isRtl ? 'شعار الموقع (Logo)' : 'Site Logo'}
                />

                <Field
                  label={isRtl ? 'رابط الـ Favicon' : 'Favicon URL'}
                  name="favicon_url"
                  dir="ltr"
                  placeholder="https://..."
                />
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-5">
                <SectionTitle>{t.contactInfo}</SectionTitle>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={t.phone} name="contact_phone" dir="ltr" />
                  <Field label={t.email} name="contact_email" dir="ltr" type="email" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={t.addressAr} name="address_ar" />
                  <Field label={t.addressEn} name="address_en" dir="ltr" />
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-5">
                <SectionTitle>
                  {isRtl ? 'محتوى صفحة من نحن' : 'About Page Content'}
                </SectionTitle>

                <UploadBox
                  value={form.home_about_image_url || ''}
                  onChange={(value) => updateField('home_about_image_url', value)}
                  folder="site"
                  label={isRtl ? 'صورة قسم من نحن' : 'About Section Image'}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={t.altAr} name="home_about_image_alt_ar" />
                  <Field label={t.altEn} name="home_about_image_alt_en" dir="ltr" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextArea
                    label={isRtl ? 'وصف المنظمة (عربي)' : 'Organization Description (AR)'}
                    name="about_desc_ar"
                    rows={3}
                  />

                  <TextArea
                    label={isRtl ? 'وصف المنظمة (إنجليزي)' : 'Organization Description (EN)'}
                    name="about_desc_en"
                    rows={3}
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextArea
                    label={isRtl ? 'الرؤية (عربي)' : 'Vision (Arabic)'}
                    name="vision_ar"
                    rows={2}
                  />

                  <TextArea
                    label={isRtl ? 'الرؤية (إنجليزي)' : 'Vision (English)'}
                    name="vision_en"
                    rows={2}
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextArea
                    label={isRtl ? 'الرسالة (عربي)' : 'Mission (Arabic)'}
                    name="mission_ar"
                    rows={2}
                  />

                  <TextArea
                    label={isRtl ? 'الرسالة (إنجليزي)' : 'Mission (English)'}
                    name="mission_en"
                    rows={2}
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-5">
                <SectionTitle>{t.socialLinks}</SectionTitle>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    { name: 'social_facebook', label: 'Facebook' },
                    { name: 'social_youtube', label: 'YouTube' },
                    { name: 'social_linkedin', label: 'LinkedIn' },
                    { name: 'social_x', label: 'X (Twitter)' },
                  ].map((item) => (
                    <Field
                      key={item.name}
                      label={item.label}
                      name={item.name}
                      dir="ltr"
                      placeholder="https://..."
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'footer' && (
              <div className="space-y-5">
                <SectionTitle>{t.footerText}</SectionTitle>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextArea label={t.footerDescAr} name="footer_desc_ar" />
                  <TextArea label={t.footerDescEn} name="footer_desc_en" dir="ltr" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={save}
          disabled={saving || loading}
          className="btn-primary w-full justify-center sm:w-auto"
        >
          <Save size={16} />
          {saving ? t.saving : t.saveSettings}
        </button>
      </div>
    </div>
  )
        }
