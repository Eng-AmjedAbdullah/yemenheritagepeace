import { useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Edit, Images, Link2, Plus, Save, Trash2 } from 'lucide-react'

import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import ImageUpload from './ImageUpload'
import AdminModal from './AdminModal'
import ValidatedField from './ValidatedField'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const EMPTY_FORM = {
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
  success: { duration: 3000, style: { background: '#166534', color: '#fff' } },
  error: { duration: 4500, style: { background: '#7f1d1d', color: '#fff' } },
}

function isValidUrl(value) {
  if (!value) return true
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function validateForm(form, isRtl) {
  const errors = {}
  if (!form.image_url) errors.image_url = isRtl ? 'صورة الواجهة مطلوبة' : 'Hero image is required'
  if (form.caption_ar.length > 300) errors.caption_ar = isRtl ? 'النص العربي طويل جدًا' : 'Arabic caption is too long'
  if (form.caption_en.length > 300) errors.caption_en = isRtl ? 'النص الإنجليزي طويل جدًا' : 'English caption is too long'
  if (form.link_url && !isValidUrl(form.link_url)) errors.link_url = isRtl ? 'الرابط غير صحيح' : 'Link URL is invalid'
  if (Number(form.sort_order) < 0) errors.sort_order = isRtl ? 'الترتيب لا يمكن أن يكون سالبًا' : 'Order cannot be negative'
  return errors
}

export default function ManageHero() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/hero/all', { loadingLabel: 'admin-hero' })
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load hero slides:', error)
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

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setTouched((current) => ({ ...current, [key]: true }))
  }

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setTouched({})
    setEditId(null)
    setModalOpen(true)
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
    setTouched({})
    setEditId(item.id)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setTouched({})
    setEditId(null)
  }

  const handleSave = async () => {
    setTouched({ image_url: true, caption_ar: true, caption_en: true, link_url: true, sort_order: true })
    if (hasErrors || saving) return
    setSaving(true)

    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0, is_active: Boolean(form.is_active) }
      if (editId) await api.put(`/hero/${editId}`, payload, { globalLoading: false, loadingLabel: 'update-hero' })
      else await api.post('/hero', payload, { globalLoading: false, loadingLabel: 'create-hero' })
      toast.success(editId ? (isRtl ? 'تم تحديث صورة الواجهة' : 'Slide updated') : (isRtl ? 'تمت إضافة صورة الواجهة' : 'Slide added'), toastTheme.success)
      await load()
      closeModal()
    } catch (error) {
      toast.error(error?.message || (isRtl ? 'تعذر الحفظ' : 'Save failed'), toastTheme.error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    const confirmed = await requestConfirm({ title: isRtl ? 'حذف صورة الواجهة' : 'Delete hero slide', message: isRtl ? 'سيتم حذف صورة الواجهة نهائيًا.' : 'This hero slide will be permanently deleted.', variant: 'danger', confirmText: t.delete || (isRtl ? 'حذف' : 'Delete') })
    if (!confirmed) return
    try {
      await api.delete(`/hero/${item.id}`, null, { globalLoading: false, loadingLabel: 'delete-hero' })
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
        <div><h1 className="flex items-center gap-2 text-2xl font-bold text-dark sm:text-3xl"><Images className="text-primary" />{isRtl ? 'إدارة صور الواجهة' : 'Manage Hero Slides'}</h1><p className="mt-2 text-sm text-gray-500">{items.length} {isRtl ? 'صورة' : 'slides'}</p></div>
        <button type="button" onClick={openAdd} className="btn-primary"><Plus size={17} />{isRtl ? 'إضافة صورة' : 'Add Slide'}</button>
      </div>

      {items.length === 0 ? <EmptyState text={isRtl ? 'لا توجد صور واجهة' : 'No hero slides'} /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <img src={resolveMediaUrl(item.image_url)} alt={item.alt_ar || item.alt_en || ''} className="aspect-[16/9] w-full object-cover" />
              <div className="p-4"><h2 className="line-clamp-2 font-bold text-dark">{isRtl ? item.caption_ar || item.caption_en || '—' : item.caption_en || item.caption_ar || '—'}</h2>{item.link_url && <p className="mt-2 flex items-center gap-2 truncate text-xs text-primary"><Link2 size={13} />{item.link_url}</p>}<div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => openEdit(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-600"><Edit size={15} />{t.edit || (isRtl ? 'تعديل' : 'Edit')}</button><button type="button" onClick={() => handleDelete(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600"><Trash2 size={15} />{t.delete || (isRtl ? 'حذف' : 'Delete')}</button></div></div>
            </article>
          ))}
        </div>
      )}

      <AdminModal open={modalOpen} title={editId ? (isRtl ? 'تعديل صورة الواجهة' : 'Edit Hero Slide') : (isRtl ? 'إضافة صورة واجهة' : 'Add Hero Slide')} subtitle={isRtl ? 'تحقق مباشر من الصورة والنص والرابط.' : 'Realtime validation for image, text, and link.'} icon={Images} isRtl={isRtl} size="wide" onClose={closeModal} closeDisabled={saving} footer={<div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={closeModal} className="btn-outline min-w-32 justify-center">{t.cancel || (isRtl ? 'إلغاء' : 'Cancel')}</button><button type="button" onClick={handleSave} disabled={saving || hasErrors} className="btn-primary min-w-36 justify-center"><Save size={16} />{saving ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (t.save || (isRtl ? 'حفظ' : 'Save'))}</button></div>}>
        <div className="space-y-5">
          <ImageUpload value={form.image_url} onChange={(value) => update('image_url', value)} folder="hero" label={isRtl ? 'صورة الواجهة' : 'Hero image'} />
          {touched.image_url && errors.image_url && <p className="text-xs font-bold text-red-600">{errors.image_url}</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedField label={isRtl ? 'النص العربي' : 'Arabic caption'} value={form.caption_ar} onChange={(value) => update('caption_ar', value)} error={errors.caption_ar} touched={touched.caption_ar} dir="rtl" />
            <ValidatedField label={isRtl ? 'النص الإنجليزي' : 'English caption'} value={form.caption_en} onChange={(value) => update('caption_en', value)} error={errors.caption_en} touched={touched.caption_en} dir="ltr" />
            <ValidatedField label={isRtl ? 'النص البديل العربي' : 'Arabic alt text'} value={form.alt_ar} onChange={(value) => update('alt_ar', value)} dir="rtl" />
            <ValidatedField label={isRtl ? 'النص البديل الإنجليزي' : 'English alt text'} value={form.alt_en} onChange={(value) => update('alt_en', value)} dir="ltr" />
            <ValidatedField label={isRtl ? 'رابط الزر' : 'Button URL'} value={form.link_url} onChange={(value) => update('link_url', value)} error={errors.link_url} touched={touched.link_url} type="url" dir="ltr" />
            <ValidatedField label={isRtl ? 'نص الزر العربي' : 'Arabic button text'} value={form.link_text_ar} onChange={(value) => update('link_text_ar', value)} dir="rtl" />
            <ValidatedField label={isRtl ? 'نص الزر الإنجليزي' : 'English button text'} value={form.link_text_en} onChange={(value) => update('link_text_en', value)} dir="ltr" />
            <ValidatedField label={isRtl ? 'الترتيب' : 'Sort order'} value={form.sort_order} onChange={(value) => update('sort_order', value)} error={errors.sort_order} touched={touched.sort_order} type="number" min="0" dir="ltr" />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => update('is_active', event.target.checked)} className="h-5 w-5 accent-primary" /><span className="text-sm font-bold text-gray-700">{isRtl ? 'الصورة نشطة' : 'Slide is active'}</span></label>
        </div>
      </AdminModal>
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">{text}</div>
}
