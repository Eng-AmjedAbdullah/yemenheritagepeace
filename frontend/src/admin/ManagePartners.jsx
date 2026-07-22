import { useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Edit, Handshake, Link2, Plus, Save, Trash2 } from 'lucide-react'

import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import ImageUpload from './ImageUpload'
import AdminModal from './AdminModal'
import ValidatedField from './ValidatedField'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const EMPTY_FORM = {
  name: '',
  name_en: '',
  logo_url: '',
  website_url: '',
  sort_order: 0,
  is_active: true,
}

const toastTheme = {
  success: { duration: 3000, style: { background: '#166534', color: '#fff' } },
  error: { duration: 4500, style: { background: '#7f1d1d', color: '#fff' } },
}

function isActive(value) {
  return value === true || value === 1 || value === '1'
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
  if (!form.name.trim()) errors.name = isRtl ? 'اسم الشريك مطلوب' : 'Partner name is required'
  else if (form.name.trim().length > 180) errors.name = isRtl ? 'الاسم طويل جدًا' : 'Name is too long'
  if (form.name_en.trim().length > 180) errors.name_en = isRtl ? 'الاسم الإنجليزي طويل جدًا' : 'English name is too long'
  if (form.website_url && !isValidUrl(form.website_url)) errors.website_url = isRtl ? 'رابط الموقع غير صحيح' : 'Website URL is invalid'
  if (Number(form.sort_order) < 0) errors.sort_order = isRtl ? 'الترتيب لا يمكن أن يكون سالبًا' : 'Order cannot be negative'
  return errors
}

export default function ManagePartners() {
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
      const data = await api.get('/partners/all', { loadingLabel: 'admin-partners' })
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load partners:', error)
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
      name: item.name || '',
      name_en: item.name_en || '',
      logo_url: item.logo_url || '',
      website_url: item.website_url || '',
      sort_order: item.sort_order || 0,
      is_active: isActive(item.is_active),
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
    setTouched({ name: true, name_en: true, website_url: true, sort_order: true })
    if (hasErrors || saving) return
    setSaving(true)

    try {
      const payload = {
        name: form.name.trim(),
        name_en: form.name_en.trim(),
        logo_url: form.logo_url,
        website_url: form.website_url.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_active: Boolean(form.is_active),
      }

      if (editId) {
        await api.put(`/partners/${editId}`, payload, { globalLoading: false, loadingLabel: 'update-partner' })
      } else {
        await api.post('/partners', payload, { globalLoading: false, loadingLabel: 'create-partner' })
      }

      toast.success(editId ? (isRtl ? 'تم تحديث الشريك' : 'Partner updated') : (isRtl ? 'تمت إضافة الشريك' : 'Partner added'), toastTheme.success)
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
      title: isRtl ? 'حذف الشريك' : 'Delete partner',
      message: isRtl ? `سيتم حذف «${getName(item, isRtl)}» من قائمة الشركاء.` : `“${getName(item, isRtl)}” will be removed.`,
      variant: 'danger',
      confirmText: t.delete || (isRtl ? 'حذف' : 'Delete'),
    })
    if (!confirmed) return

    try {
      await api.delete(`/partners/${item.id}`, null, { globalLoading: false, loadingLabel: 'delete-partner' })
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
          <h1 className="flex items-center gap-2 text-2xl font-bold text-dark sm:text-3xl"><Handshake className="text-primary" />{t.managePartners || (isRtl ? 'إدارة الشركاء' : 'Manage Partners')}</h1>
          <p className="mt-2 text-sm text-gray-500">{items.length} {isRtl ? 'شريك' : 'partners'}</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary"><Plus size={17} />{isRtl ? 'إضافة شريك' : 'Add Partner'}</button>
      </div>

      {items.length === 0 ? (
        <EmptyState text={isRtl ? 'لا يوجد شركاء' : 'No partners found'} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex h-28 items-center justify-center rounded-2xl bg-gray-50 p-4">
                {item.logo_url ? <img src={resolveMediaUrl(item.logo_url)} alt={getName(item, isRtl)} className="max-h-full max-w-full object-contain" /> : <Handshake size={38} className="text-primary/45" />}
              </div>
              <h2 className="mt-4 text-center font-bold text-dark">{getName(item, isRtl)}</h2>
              {item.website_url && <a href={item.website_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-primary"><Link2 size={13} />{item.website_url}</a>}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => openEdit(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-600"><Edit size={15} />{t.edit || (isRtl ? 'تعديل' : 'Edit')}</button>
                <button type="button" onClick={() => handleDelete(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600"><Trash2 size={15} />{t.delete || (isRtl ? 'حذف' : 'Delete')}</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title={editId ? (isRtl ? 'تعديل الشريك' : 'Edit Partner') : (isRtl ? 'إضافة شريك' : 'Add Partner')}
        subtitle={isRtl ? 'تحقق مباشر من الاسم والرابط والترتيب.' : 'Realtime validation for name, URL, and order.'}
        icon={Handshake}
        isRtl={isRtl}
        size="normal"
        onClose={closeModal}
        closeDisabled={saving}
        footer={<div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={closeModal} className="btn-outline min-w-32 justify-center">{t.cancel || (isRtl ? 'إلغاء' : 'Cancel')}</button><button type="button" onClick={handleSave} disabled={saving || hasErrors} className="btn-primary min-w-36 justify-center"><Save size={16} />{saving ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (t.save || (isRtl ? 'حفظ' : 'Save'))}</button></div>}
      >
        <div className="space-y-5">
          <ImageUpload value={form.logo_url} onChange={(value) => update('logo_url', value)} folder="partners" label={isRtl ? 'شعار الشريك' : 'Partner logo'} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedField label={isRtl ? 'الاسم العربي' : 'Arabic name'} value={form.name} onChange={(value) => update('name', value)} error={errors.name} touched={touched.name} required dir="rtl" />
            <ValidatedField label={isRtl ? 'الاسم الإنجليزي' : 'English name'} value={form.name_en} onChange={(value) => update('name_en', value)} error={errors.name_en} touched={touched.name_en} dir="ltr" />
            <ValidatedField label={isRtl ? 'رابط الموقع' : 'Website URL'} value={form.website_url} onChange={(value) => update('website_url', value)} error={errors.website_url} touched={touched.website_url} type="url" dir="ltr" placeholder="https://example.com" />
            <ValidatedField label={isRtl ? 'الترتيب' : 'Sort order'} value={form.sort_order} onChange={(value) => update('sort_order', value)} error={errors.sort_order} touched={touched.sort_order} type="number" min="0" dir="ltr" />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => update('is_active', event.target.checked)} className="h-5 w-5 accent-primary" /><span className="text-sm font-bold text-gray-700">{isRtl ? 'الشريك نشط ويظهر في الموقع' : 'Partner is active and visible'}</span></label>
        </div>
      </AdminModal>
    </div>
  )
}

function getName(item, isRtl) {
  return isRtl ? item.name || item.name_en || '—' : item.name_en || item.name || '—'
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">{text}</div>
}
