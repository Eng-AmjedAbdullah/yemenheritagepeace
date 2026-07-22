import { useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  CalendarDays,
  Image as ImageIcon,
  Plus,
  Save,
  Search,
  SquarePen,
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
  category: 'أخبار',
  category_en: 'News',
  image_url: '',
  published: true,
  created_at: '',
}

const EMPTY_TOUCHED = {
  title: false,
  title_en: false,
  content: false,
  content_en: false,
  category: false,
  category_en: false,
  created_at: false,
}

const toastTheme = {
  success: { duration: 3000, style: { background: '#166534', color: '#fff' } },
  error: { duration: 4500, style: { background: '#7f1d1d', color: '#fff' } },
}

function isPublished(value) {
  return value === true || value === 1 || value === '1'
}

function getInputDate(value) {
  return value ? String(value).split('T')[0] : ''
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

  if (!form.category.trim()) {
    errors.category = isRtl ? 'التصنيف العربي مطلوب' : 'Arabic category is required'
  }

  if (form.category_en.trim().length > 100) {
    errors.category_en = isRtl ? 'التصنيف الإنجليزي طويل جدًا' : 'English category is too long'
  }

  if (!form.created_at) {
    errors.created_at = isRtl ? 'تاريخ الخبر مطلوب' : 'News date is required'
  }

  if (form.content.length > 20000) {
    errors.content = isRtl ? 'المحتوى العربي طويل جدًا' : 'Arabic content is too long'
  }

  if (form.content_en.length > 20000) {
    errors.content_en = isRtl ? 'المحتوى الإنجليزي طويل جدًا' : 'English content is too long'
  }

  return errors
}

export default function ManageNews() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState(EMPTY_TOUCHED)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/news/all', { loadingLabel: 'admin-news' })
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load news:', error)
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

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return items.filter((item) => {
      const date = getInputDate(item.created_at)
      if (dateFrom && (!date || date < dateFrom)) return false
      if (dateTo && (!date || date > dateTo)) return false
      if (!query) return true

      return [item.title, item.title_en, item.category, item.category_en]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [items, searchTerm, dateFrom, dateTo])

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setTouched((current) => ({ ...current, [key]: true }))
  }

  const openAdd = () => {
    setEditId(null)
    setTouched(EMPTY_TOUCHED)
    setForm({ ...EMPTY_FORM, created_at: new Date().toISOString().split('T')[0] })
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
      category: item.category || 'أخبار',
      category_en: item.category_en || 'News',
      image_url: item.image_url || '',
      published: isPublished(item.published),
      created_at: getInputDate(item.created_at),
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setTouched(EMPTY_TOUCHED)
  }

  const touchAll = () => {
    setTouched({
      title: true,
      title_en: true,
      content: true,
      content_en: true,
      category: true,
      category_en: true,
      created_at: true,
    })
  }

  const handleSave = async () => {
    touchAll()
    if (hasErrors || saving) return

    setSaving(true)
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        title_en: form.title_en.trim(),
        content: form.content.trim(),
        content_en: form.content_en.trim(),
        category: form.category.trim(),
        category_en: form.category_en.trim(),
        created_at: form.created_at || null,
        published: Boolean(form.published),
      }

      if (editId) {
        await api.put(`/news/${editId}`, payload, {
          globalLoading: true,
          loadingLabel: 'update-news',
        })
      } else {
        await api.post('/news', payload, {
          globalLoading: true,
          loadingLabel: 'create-news',
        })
      }

      toast.success(
        editId
          ? isRtl
            ? 'تم تحديث الخبر بنجاح'
            : 'News updated successfully'
          : isRtl
            ? 'تمت إضافة الخبر بنجاح'
            : 'News added successfully',
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
      title: isRtl ? 'حذف الخبر' : 'Delete news item',
      message: isRtl
        ? `سيتم حذف «${getTitle(item, isRtl)}» نهائيًا.`
        : `“${getTitle(item, isRtl)}” will be permanently deleted.`,
      variant: 'danger',
      confirmText: t.delete || (isRtl ? 'حذف' : 'Delete'),
    })
    if (!confirmed) return

    try {
      await api.delete(`/news/${item.id}`, null, {
        globalLoading: true,
        loadingLabel: 'delete-news',
      })
      toast.success(isRtl ? 'تم حذف الخبر' : 'News deleted', toastTheme.success)
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
          <h1 className="text-2xl font-bold text-dark sm:text-3xl">
            {t.manageNews || (isRtl ? 'إدارة الأخبار' : 'Manage News')}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isRtl ? `${filteredItems.length} من ${items.length}` : `${filteredItems.length} of ${items.length}`}
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary">
          <Plus size={17} />
          {t.addNews || (isRtl ? 'إضافة خبر' : 'Add News')}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_190px_190px]">
        <label className="search-field">
          <Search size={18} className="search-icon" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={isRtl ? 'ابحث في الأخبار...' : 'Search news...'}
            className="input-field"
          />
        </label>
        <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="input-field" dir="ltr" />
        <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="input-field" dir="ltr" />
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState text={isRtl ? 'لا توجد أخبار' : 'No news found'} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="aspect-[16/9] bg-gray-100">
                {item.image_url ? (
                  <img src={resolveMediaUrl(item.image_url)} alt={getTitle(item, isRtl)} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-primary/45"><ImageIcon size={42} /></div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 font-bold leading-7 text-dark">{getTitle(item, isRtl)}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${isPublished(item.published) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {isPublished(item.published) ? (isRtl ? 'منشور' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <CalendarDays size={14} className="text-primary" />
                  {formatDate(item.created_at, isRtl)}
                </p>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => openEdit(item)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-600">
                    <SquarePen size={15} /> {t.edit || (isRtl ? 'تعديل' : 'Edit')}
                  </button>
                  <button type="button" onClick={() => handleDelete(item)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
                    <Trash2 size={15} /> {t.delete || (isRtl ? 'حذف' : 'Delete')}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title={editId ? (isRtl ? 'تعديل الخبر' : 'Edit News') : (isRtl ? 'إضافة خبر' : 'Add News')}
        subtitle={isRtl ? 'يتم التحقق من الحقول مباشرة أثناء الكتابة.' : 'Fields are validated while typing.'}
        icon={SquarePen}
        isRtl={isRtl}
        size="wide"
        onClose={closeModal}
        closeDisabled={saving}
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeModal} disabled={saving} className="btn-outline min-w-32 justify-center">{t.cancel || (isRtl ? 'إلغاء' : 'Cancel')}</button>
            <button type="button" onClick={handleSave} disabled={saving || hasErrors} className="btn-primary min-w-36 justify-center">
              <Save size={16} /> {saving ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (t.save || (isRtl ? 'حفظ' : 'Save'))}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <ImageUpload value={form.image_url} onChange={(value) => updateForm('image_url', value)} folder="news" label={t.newsImage || (isRtl ? 'صورة الخبر' : 'News image')} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedField label={isRtl ? 'العنوان العربي' : 'Arabic title'} value={form.title} onChange={(value) => updateForm('title', value)} error={errors.title} touched={touched.title} required dir="rtl" />
            <ValidatedField label={isRtl ? 'العنوان الإنجليزي' : 'English title'} value={form.title_en} onChange={(value) => updateForm('title_en', value)} error={errors.title_en} touched={touched.title_en} dir="ltr" />
            <ValidatedField label={isRtl ? 'التصنيف العربي' : 'Arabic category'} value={form.category} onChange={(value) => updateForm('category', value)} error={errors.category} touched={touched.category} required dir="rtl" />
            <ValidatedField label={isRtl ? 'التصنيف الإنجليزي' : 'English category'} value={form.category_en} onChange={(value) => updateForm('category_en', value)} error={errors.category_en} touched={touched.category_en} dir="ltr" />
            <ValidatedField label={isRtl ? 'تاريخ النشر' : 'Publication date'} value={form.created_at} onChange={(value) => updateForm('created_at', value)} error={errors.created_at} touched={touched.created_at} required type="date" dir="ltr" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedField label={isRtl ? 'المحتوى العربي' : 'Arabic content'} value={form.content} onChange={(value) => updateForm('content', value)} error={errors.content} touched={touched.content} as="textarea" rows={7} dir="rtl" />
            <ValidatedField label={isRtl ? 'المحتوى الإنجليزي' : 'English content'} value={form.content_en} onChange={(value) => updateForm('content_en', value)} error={errors.content_en} touched={touched.content_en} as="textarea" rows={7} dir="ltr" />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <input type="checkbox" checked={Boolean(form.published)} onChange={(event) => updateForm('published', event.target.checked)} className="h-5 w-5 accent-primary" />
            <span className="text-sm font-bold text-gray-700">{isRtl ? 'نشر الخبر في الموقع' : 'Publish this news item'}</span>
          </label>
        </div>
      </AdminModal>
    </div>
  )
}

function getTitle(item, isRtl) {
  return isRtl ? item.title || item.title_en || '—' : item.title_en || item.title || '—'
}

function formatDate(value, isRtl) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">{text}</div>
}
