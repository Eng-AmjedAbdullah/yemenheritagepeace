import { useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Clock,
  Edit,
  Image as ImageIcon,
  MapPin,
  Mountain,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'

import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import ImageUpload from './ImageUpload'
import AdminModal from './AdminModal'
import ValidatedField from './ValidatedField'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const EMPTY_FORM = {
  title: '',
  title_en: '',
  content: '',
  content_en: '',
  type: 'tangible',
  image_url: '',
  location: '',
  period: '',
  published: true,
}

const EMPTY_TOUCHED = {
  title: false,
  title_en: false,
  content: false,
  content_en: false,
  location: false,
  period: false,
}

const toastTheme = {
  success: { duration: 3000, style: { background: '#166534', color: '#fff' } },
  error: { duration: 4500, style: { background: '#7f1d1d', color: '#fff' } },
}

function isPublished(value) {
  return value === true || value === 1 || value === '1'
}

function validateForm(form, isRtl) {
  const errors = {}

  if (!form.title.trim()) {
    errors.title = isRtl ? 'العنوان العربي مطلوب' : 'Arabic title is required'
  } else if (form.title.trim().length > 220) {
    errors.title = isRtl ? 'العنوان طويل جدًا' : 'Title is too long'
  }

  if (form.title_en.trim().length > 220) {
    errors.title_en = isRtl ? 'العنوان الإنجليزي طويل جدًا' : 'English title is too long'
  }

  if (form.location.trim().length > 220) {
    errors.location = isRtl ? 'الموقع طويل جدًا' : 'Location is too long'
  }

  if (form.period.trim().length > 160) {
    errors.period = isRtl ? 'الفترة التاريخية طويلة جدًا' : 'Historical period is too long'
  }

  if (form.content.length > 20000) {
    errors.content = isRtl ? 'الوصف العربي طويل جدًا' : 'Arabic description is too long'
  }

  if (form.content_en.length > 20000) {
    errors.content_en = isRtl ? 'الوصف الإنجليزي طويل جدًا' : 'English description is too long'
  }

  return errors
}

export default function ManageHeritage() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState(EMPTY_TOUCHED)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/heritage/all', {
        loadingLabel: 'admin-heritage',
      })
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load heritage:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const errors = useMemo(() => validateForm(form, isRtl), [form, isRtl])
  const hasErrors = Object.keys(errors).length > 0

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setTouched((current) => ({ ...current, [key]: true }))
  }

  const openAdd = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setTouched(EMPTY_TOUCHED)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditId(item.id)
    setTouched(EMPTY_TOUCHED)
    setForm({
      title: item.title || '',
      title_en: item.title_en || '',
      content: item.content || '',
      content_en: item.content_en || '',
      type: item.type || 'tangible',
      image_url: item.image_url || '',
      location: item.location || '',
      period: item.period || '',
      published: isPublished(item.published),
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setTouched(EMPTY_TOUCHED)
  }

  const handleSave = async () => {
    setTouched({
      title: true,
      title_en: true,
      content: true,
      content_en: true,
      location: true,
      period: true,
    })

    if (hasErrors || saving) return

    setSaving(true)
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        title_en: form.title_en.trim(),
        content: form.content.trim(),
        content_en: form.content_en.trim(),
        location: form.location.trim(),
        period: form.period.trim(),
        published: Boolean(form.published),
      }

      if (editId) {
        await api.put(`/heritage/${editId}`, payload, {
          globalLoading: false,
          loadingLabel: 'update-heritage',
        })
      } else {
        await api.post('/heritage', payload, {
          globalLoading: false,
          loadingLabel: 'create-heritage',
        })
      }

      toast.success(
        editId
          ? isRtl
            ? 'تم تحديث العنصر التراثي'
            : 'Heritage item updated'
          : isRtl
            ? 'تمت إضافة العنصر التراثي'
            : 'Heritage item added',
        toastTheme.success
      )
      await load()
      closeModal()
    } catch (error) {
      toast.error(error?.message || (isRtl ? 'تعذر الحفظ' : 'Save failed'), toastTheme.error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    const confirmed = await requestConfirm({
      title: isRtl ? 'حذف العنصر التراثي' : 'Delete heritage item',
      message: isRtl
        ? `سيتم حذف «${getTitle(item, isRtl)}» نهائيًا.`
        : `“${getTitle(item, isRtl)}” will be permanently deleted.`,
      variant: 'danger',
      confirmText: t.delete || (isRtl ? 'حذف' : 'Delete'),
    })
    if (!confirmed) return

    try {
      await api.delete(`/heritage/${item.id}`, null, {
        globalLoading: false,
        loadingLabel: 'delete-heritage',
      })
      toast.success(isRtl ? 'تم الحذف' : 'Deleted', toastTheme.success)
      await load()
    } catch (error) {
      toast.error(error?.message || (isRtl ? 'تعذر الحذف' : 'Delete failed'), toastTheme.error)
    }
  }

  if (loading) return null

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-dark sm:text-3xl">
            <Mountain className="text-primary" size={28} />
            {t.manageHeritage || (isRtl ? 'إدارة التراث' : 'Manage Heritage')}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isRtl ? `${items.length} عنصر تراثي` : `${items.length} heritage items`}
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary">
          <Plus size={17} />
          {t.addHeritageItem || (isRtl ? 'إضافة عنصر' : 'Add Item')}
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState text={isRtl ? 'لا توجد عناصر تراثية' : 'No heritage items'} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="aspect-[16/10] bg-gray-100">
                {item.image_url ? (
                  <img src={resolveMediaUrl(item.image_url)} alt={getTitle(item, isRtl)} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-primary/45"><ImageIcon size={44} /></div>
                )}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="line-clamp-2 font-bold leading-7 text-dark">{getTitle(item, isRtl)}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.type === 'tangible' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                    {item.type === 'tangible' ? (t.tangible || (isRtl ? 'مادي' : 'Tangible')) : (t.intangible || (isRtl ? 'غير مادي' : 'Intangible'))}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs text-gray-500">
                  {item.location && <p className="flex items-center gap-2"><MapPin size={14} className="text-primary" />{item.location}</p>}
                  {item.period && <p className="flex items-center gap-2"><Clock size={14} className="text-primary" />{item.period}</p>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => openEdit(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-600"><Edit size={15} />{t.edit || (isRtl ? 'تعديل' : 'Edit')}</button>
                  <button type="button" onClick={() => handleDelete(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600"><Trash2 size={15} />{t.delete || (isRtl ? 'حذف' : 'Delete')}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title={editId ? (isRtl ? 'تعديل العنصر التراثي' : 'Edit Heritage Item') : (isRtl ? 'إضافة عنصر تراثي' : 'Add Heritage Item')}
        subtitle={isRtl ? 'تظهر أخطاء التحقق مباشرة أثناء الكتابة.' : 'Validation errors appear while typing.'}
        icon={Mountain}
        isRtl={isRtl}
        size="wide"
        onClose={closeModal}
        closeDisabled={saving}
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeModal} disabled={saving} className="btn-outline min-w-32 justify-center">{t.cancel || (isRtl ? 'إلغاء' : 'Cancel')}</button>
            <button type="button" onClick={handleSave} disabled={saving || hasErrors} className="btn-primary min-w-36 justify-center"><Save size={16} />{saving ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (t.save || (isRtl ? 'حفظ' : 'Save'))}</button>
          </div>
        }
      >
        <div className="space-y-6">
          <ImageUpload value={form.image_url} onChange={(value) => updateForm('image_url', value)} folder="heritage" label={t.heritageImage || (isRtl ? 'صورة العنصر' : 'Heritage image')} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedField label={isRtl ? 'العنوان العربي' : 'Arabic title'} value={form.title} onChange={(value) => updateForm('title', value)} error={errors.title} touched={touched.title} required dir="rtl" />
            <ValidatedField label={isRtl ? 'العنوان الإنجليزي' : 'English title'} value={form.title_en} onChange={(value) => updateForm('title_en', value)} error={errors.title_en} touched={touched.title_en} dir="ltr" />
            <ValidatedField label={isRtl ? 'نوع التراث' : 'Heritage type'} value={form.type} onChange={(value) => updateForm('type', value)} as="select" options={[{ value: 'tangible', label: t.tangible || (isRtl ? 'مادي' : 'Tangible') }, { value: 'intangible', label: t.intangible || (isRtl ? 'غير مادي' : 'Intangible') }]} />
            <ValidatedField label={isRtl ? 'الفترة التاريخية' : 'Historical period'} value={form.period} onChange={(value) => updateForm('period', value)} error={errors.period} touched={touched.period} />
            <ValidatedField label={isRtl ? 'الموقع' : 'Location'} value={form.location} onChange={(value) => updateForm('location', value)} error={errors.location} touched={touched.location} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedField label={isRtl ? 'الوصف العربي' : 'Arabic description'} value={form.content} onChange={(value) => updateForm('content', value)} error={errors.content} touched={touched.content} as="textarea" rows={6} dir="rtl" />
            <ValidatedField label={isRtl ? 'الوصف الإنجليزي' : 'English description'} value={form.content_en} onChange={(value) => updateForm('content_en', value)} error={errors.content_en} touched={touched.content_en} as="textarea" rows={6} dir="ltr" />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <input type="checkbox" checked={Boolean(form.published)} onChange={(event) => updateForm('published', event.target.checked)} className="h-5 w-5 accent-primary" />
            <span className="text-sm font-bold text-gray-700">{isRtl ? 'نشر العنصر في الموقع' : 'Publish this item'}</span>
          </label>
        </div>
      </AdminModal>
    </div>
  )
}

function getTitle(item, isRtl) {
  return isRtl ? item.title || item.title_en || '—' : item.title_en || item.title || '—'
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">{text}</div>
}
