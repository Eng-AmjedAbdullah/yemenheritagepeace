import { useContext, useEffect, useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { resolveMediaUrl } from '../lib/media'
import ImageUpload from './ImageUpload'
import { Plus, Edit, Trash2, X, Save, Link2 } from 'lucide-react'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const EMPTY = {
  image_url: '',
  caption_ar: '',
  caption_en: '',
  alt_ar: '',
  alt_en: '',
  link_url: '',
  link_text_ar: '',
  link_text_en: '',
  sort_order: 0,
  is_active: true,
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
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#7f1d1d',
    },
  },
}

export default function ManageHero() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)

    try {
      const data = await api.get('/hero/all')
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setForm(EMPTY)
    setEditId(null)
    setModal('form')
  }

  const openEdit = (item) => {
    setForm({
      image_url: item.image_url || '',
      caption_ar: item.caption_ar || '',
      caption_en: item.caption_en || '',
      alt_ar: item.alt_ar || '',
      alt_en: item.alt_en || '',
      link_url: item.link_url || '',
      link_text_ar: item.link_text_ar || '',
      link_text_en: item.link_text_en || '',
      sort_order: item.sort_order || 0,
      is_active: item.is_active !== 0,
    })

    setEditId(item.id)
    setModal('form')
  }

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleSave = async () => {
    if (!form.image_url) {
      toast.error(t.imageRequired || (isRtl ? 'الصورة مطلوبة' : 'Image is required'), toastTheme.error)
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...form,
        sort_order: Number(form.sort_order) || 0,
        is_active: !!form.is_active,
      }

      if (editId) {
        await api.put(`/hero/${editId}`, payload)
      } else {
        await api.post('/hero', payload)
      }

      toast.success(editId ? t.saved : t.added, toastTheme.success)

      await load()
      setModal(null)
    } catch (error) {
      toast.error(error?.message || (isRtl ? 'حدث خطأ' : 'Something went wrong'), toastTheme.error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await requestConfirm({
      title: isRtl ? 'تأكيد حذف الصورة' : 'Delete slide?',
      message: isRtl
        ? 'سيتم حذف صورة الواجهة هذه نهائياً.'
        : 'This hero slide will be permanently removed.',
      variant: 'danger',
      confirmText: t.delete,
    })

    if (!confirmed) return

    try {
      await api.delete(`/hero/${id}`)
      toast.success(t.deleted, toastTheme.success)
      await load()
    } catch (error) {
      toast.error(error?.message || (isRtl ? 'حدث خطأ أثناء الحذف' : 'Failed to delete'), toastTheme.error)
    }
  }

  const getCaption = (item) => {
    if (isRtl) return item.caption_ar || item.caption_en || '—'
    return item.caption_en || item.caption_ar || '—'
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-dark md:text-3xl">
            {t.manageHero}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isRtl
              ? 'إدارة صور الواجهة الرئيسية وترتيب ظهورها'
              : 'Manage homepage hero slides and their order'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark"
        >
          <Plus size={17} />
          <span className="whitespace-nowrap">
            {t.addSlide}
          </span>
        </button>
      </div>

      <div className="md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
            {t.loading}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
            {t.noSlides}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <img
                    src={resolveMediaUrl(item.image_url)}
                    alt=""
                    className="h-20 w-24 shrink-0 rounded-xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-bold text-dark">
                        {getCaption(item)}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                          item.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.is_active ? t.active : t.hidden}
                      </span>
                    </div>

                    {item.caption_en && isRtl && (
                      <p className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                        {item.caption_en}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        {t.order}: {item.sort_order || 0}
                      </span>

                      {item.link_url ? (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary"
                          dir="ltr"
                        >
                          <Link2 size={11} />
                          <span className="max-w-[150px] truncate">
                            {item.link_url}
                          </span>
                        </a>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-400">
                          {t.ctaLink}: —
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600"
                  >
                    <Edit size={15} />
                    {t.edit}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                  >
                    <Trash2 size={15} />
                    {t.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed text-sm">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[240px]" />
              <col className="w-[220px]" />
              <col className="w-[90px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
            </colgroup>

            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-semibold text-gray-600`}>
                  {t.image}
                </th>
                <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-semibold text-gray-600`}>
                  {t.caption}
                </th>
                <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-semibold text-gray-600`}>
                  {t.ctaLink}
                </th>
                <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-semibold text-gray-600`}>
                  {t.order}
                </th>
                <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-semibold text-gray-600`}>
                  {t.status}
                </th>
                <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-semibold text-gray-600`}>
                  {t.actions}
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    {t.loading}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    {t.noSlides}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 transition hover:bg-gray-50/70">
                    <td className="p-4">
                      <img
                        src={resolveMediaUrl(item.image_url)}
                        alt=""
                        className="h-14 w-20 rounded-lg object-cover"
                      />
                    </td>

                    <td className="p-4">
                      <div className="line-clamp-1 font-semibold text-dark">
                        {getCaption(item)}
                      </div>

                      {item.caption_en && isRtl && (
                        <div className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                          {item.caption_en}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-xs text-gray-500">
                      {item.link_url ? (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-full items-center gap-1 text-primary hover:underline"
                          dir="ltr"
                        >
                          <Link2 size={11} />
                          <span className="truncate">
                            {item.link_url}
                          </span>
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="p-4 text-gray-500">
                      {item.sort_order || 0}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          item.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.is_active ? t.active : t.hidden}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 text-blue-500 transition hover:bg-blue-50"
                          aria-label={t.edit}
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                          aria-label={t.delete}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div
          className="modal-overlay"
          onClick={(event) => event.target === event.currentTarget && setModal(null)}
        >
          <div className="modal-box w-[calc(100vw-24px)] max-w-3xl">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <h2 className="text-lg font-bold text-dark sm:text-xl">
                {editId ? t.editSlide : t.addSlide}
              </h2>

              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-gray-400 transition hover:text-gray-600"
                aria-label={isRtl ? 'إغلاق' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4 sm:p-6">
              <ImageUpload
                value={form.image_url}
                onChange={(value) => updateForm('image_url', value)}
                folder="hero"
                label={t.heroImage}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={t.captionAr}
                  value={form.caption_ar}
                  onChange={(value) => updateForm('caption_ar', value)}
                />

                <Field
                  label={t.captionEn}
                  value={form.caption_en}
                  onChange={(value) => updateForm('caption_en', value)}
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={t.altAr}
                  value={form.alt_ar}
                  onChange={(value) => updateForm('alt_ar', value)}
                />

                <Field
                  label={t.altEn}
                  value={form.alt_en}
                  onChange={(value) => updateForm('alt_en', value)}
                  dir="ltr"
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-dashed border-gray-200 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {t.ctaSection}
                </p>

                <Field
                  label={t.ctaLink}
                  value={form.link_url}
                  onChange={(value) => updateForm('link_url', value)}
                  dir="ltr"
                  placeholder="https://..."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label={t.ctaTextAr}
                    value={form.link_text_ar}
                    onChange={(value) => updateForm('link_text_ar', value)}
                    placeholder={isRtl ? 'اعرف المزيد' : ''}
                  />

                  <Field
                    label={t.ctaTextEn}
                    value={form.link_text_en}
                    onChange={(value) => updateForm('link_text_en', value)}
                    dir="ltr"
                    placeholder="Learn More"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={t.order}
                  type="number"
                  value={form.sort_order}
                  onChange={(value) => updateForm('sort_order', value)}
                />

                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) => updateForm('is_active', event.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-gray-700">
                      {t.activePublic}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:justify-end sm:p-6">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn-outline justify-center"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary justify-center"
              >
                <Save size={16} />
                {saving ? t.saving : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  dir,
  placeholder = '',
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="input-field"
        dir={dir || ''}
        placeholder={placeholder}
      />
    </div>
  )
}
