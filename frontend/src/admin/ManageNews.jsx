import { useState, useEffect, useContext } from 'react'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import toast from 'react-hot-toast'
import ImageUpload from './ImageUpload'
import {
  Plus,
  SquarePen,
  Trash2,
  X,
  Save,
  CalendarDays,
  Tag,
  Image as ImageIcon,
} from 'lucide-react'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const EMPTY = {
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

function isPublished(value) {
  return value === 1 || value === true || value === '1'
}

function getInputDate(value) {
  if (!value) return ''

  try {
    return String(value).split('T')[0]
  } catch {
    return ''
  }
}

export default function ManageNews() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const hasDateFilter = Boolean(dateFrom || dateTo)

  const load = async () => {
    setLoading(true)

    try {
      const data = await api.get('/news/all')
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

  useEffect(() => {
    let filtered = [...items]

    if (dateFrom) {
      filtered = filtered.filter((item) => {
        const itemDate = getInputDate(item.created_at)
        return itemDate && itemDate >= dateFrom
      })
    }

    if (dateTo) {
      filtered = filtered.filter((item) => {
        const itemDate = getInputDate(item.created_at)
        return itemDate && itemDate <= dateTo
      })
    }

    setFilteredItems(filtered)
  }, [items, dateFrom, dateTo])

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const resetDateFilter = () => {
    setDateFrom('')
    setDateTo('')
  }

  const closeModal = () => {
    setModal(null)
    setForm(EMPTY)
    setEditId(null)
  }

  const openAdd = () => {
    setForm({
      ...EMPTY,
      created_at: new Date().toISOString().split('T')[0],
    })
    setEditId(null)
    setModal('form')
  }

  const openEdit = (item) => {
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

    setEditId(item.id)
    setModal('form')
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(
        isRtl ? 'العنوان العربي مطلوب' : 'Arabic title is required',
        toastTheme.error
      )
      return
    }

    if (saving) return
    setSaving(true)

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        title_en: form.title_en.trim(),
        category: form.category.trim(),
        category_en: form.category_en.trim(),
        published: !!form.published,
        created_at: form.created_at || null,
      }

      if (editId) {
        await api.put(`/news/${editId}`, payload)
      } else {
        await api.post('/news', payload)
      }

      toast.success(
        editId
          ? isRtl
            ? 'تم الحفظ بنجاح'
            : 'Saved successfully'
          : isRtl
            ? 'تمت الإضافة بنجاح'
            : 'Added successfully',
        toastTheme.success
      )

      await load()
      closeModal()
    } catch (error) {
      toast.error(
        error?.message || (isRtl ? 'حدث خطأ' : 'Something went wrong'),
        toastTheme.error
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await requestConfirm({
      title: isRtl ? 'تأكيد حذف الخبر' : 'Delete news item?',
      message: isRtl
        ? 'هل أنت متأكد من حذف هذا الخبر؟ لا يمكن التراجع عن هذا الإجراء.'
        : 'Are you sure you want to delete this news item? This action cannot be undone.',
      variant: 'danger',
      confirmText: t.delete,
    })

    if (!confirmed) return

    try {
      await api.delete(`/news/${id}`)

      toast.success(
        isRtl ? 'تم الحذف بنجاح' : 'Deleted successfully',
        toastTheme.success
      )

      await load()
    } catch (error) {
      toast.error(
        error?.message || (isRtl ? 'حدث خطأ أثناء الحذف' : 'Failed to delete'),
        toastTheme.error
      )
    }
  }

  const getTitle = (item) => {
    if (isRtl) return item.title || item.title_en || '—'
    return item.title_en || item.title || '—'
  }

  const getCategory = (item) => {
    if (isRtl) return item.category || item.category_en || '—'
    return item.category_en || item.category || '—'
  }

  const formatDate = (date) => {
    if (!date) return '—'

    try {
      return new Date(date).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')
    } catch {
      return '—'
    }
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className="text-2xl font-bold text-dark md:text-3xl">
            {t.manageNews}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {hasDateFilter
              ? isRtl
                ? `${t.totalNews}: ${items.length} — النتائج: ${filteredItems.length}`
                : `${t.totalNews}: ${items.length} — Results: ${filteredItems.length}`
              : `${t.totalNews}: ${items.length}`}
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="btn-primary w-full justify-center sm:w-auto"
        >
          <Plus size={16} />
          {t.addNews}
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isRtl ? 'من تاريخ' : 'From Date'}
            </label>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="input-field h-12 w-full"
              dir="ltr"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isRtl ? 'إلى تاريخ' : 'To Date'}
            </label>

            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="input-field h-12 w-full"
              dir="ltr"
            />
          </div>

          {hasDateFilter && (
            <button
              type="button"
              onClick={resetDateFilter}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
              aria-label={isRtl ? 'مسح فلتر التاريخ' : 'Clear date filter'}
              title={isRtl ? 'مسح فلتر التاريخ' : 'Clear date filter'}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="md:hidden">
        {loading ? (
          <EmptyState text={t.loading} />
        ) : filteredItems.length === 0 ? (
          <EmptyState text={t.noResults} />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  {item.image_url ? (
                    <img
                      src={resolveMediaUrl(item.image_url)}
                      alt=""
                      className="h-24 w-24 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                      <ImageIcon size={22} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-bold leading-6 text-dark">
                        {getTitle(item)}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                          isPublished(item.published)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isPublished(item.published) ? t.published : t.draft}
                      </span>
                    </div>

                    {item.title_en && isRtl && (
                      <p className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                        {item.title_en}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        <Tag size={12} />
                        {getCategory(item)}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                        <CalendarDays size={12} />
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600"
                  >
                    <SquarePen size={15} />
                    {t.edit}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
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
          <table className="w-full min-w-[820px] table-fixed text-sm">
            <colgroup>
              <col className="w-[110px]" />
              <col className="w-[280px]" />
              <col className="w-[140px]" />
              <col className="w-[110px]" />
              <col className="w-[140px]" />
              <col className="w-[120px]" />
            </colgroup>

            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <TableHead isRtl={isRtl}>{t.image}</TableHead>
                <TableHead isRtl={isRtl}>{t.title}</TableHead>
                <TableHead isRtl={isRtl}>{t.category}</TableHead>
                <TableHead isRtl={isRtl}>{t.status}</TableHead>
                <TableHead isRtl={isRtl}>{t.date}</TableHead>
                <TableHead isRtl={isRtl}>{t.actions}</TableHead>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    {t.loading}
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    {t.noResults}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 transition hover:bg-gray-50/70"
                  >
                    <td className="p-4">
                      {item.image_url ? (
                        <img
                          src={resolveMediaUrl(item.image_url)}
                          alt=""
                          className="h-14 w-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-medium text-dark">
                      <div className="line-clamp-1">{getTitle(item)}</div>

                      {item.title_en && isRtl && (
                        <div className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                          {item.title_en}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-gray-500">
                      <span className="line-clamp-1">
                        {getCategory(item)}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          isPublished(item.published)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isPublished(item.published) ? t.published : t.draft}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-gray-400">
                      {formatDate(item.created_at)}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                          title={t.edit}
                        >
                          <SquarePen size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100"
                          title={t.delete}
                        >
                          <Trash2 size={16} />
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
          onClick={(event) => event.target === event.currentTarget && closeModal()}
        >
          <div className="modal-box max-h-[90vh] w-[calc(100vw-24px)] max-w-3xl overflow-y-auto">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <h2 className="text-lg font-bold text-dark sm:text-xl">
                {editId ? t.editNews : t.addNewNews}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 transition hover:text-gray-600"
                aria-label={isRtl ? 'إغلاق' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <ImageUpload
                value={form.image_url}
                onChange={(value) => updateForm('image_url', value)}
                folder="news"
                label={t.newsImage}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={`${t.titleAr} *`}
                  value={form.title}
                  onChange={(value) => updateForm('title', value)}
                />

                <Field
                  label={t.titleEn}
                  value={form.title_en}
                  onChange={(value) => updateForm('title_en', value)}
                  dir="ltr"
                />
              </div>

              <Field
                label={t.date}
                type="date"
                value={form.created_at}
                onChange={(value) => updateForm('created_at', value)}
                dir="ltr"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={t.categoryAr}
                  value={form.category}
                  onChange={(value) => updateForm('category', value)}
                />

                <Field
                  label={t.categoryEn}
                  value={form.category_en}
                  onChange={(value) => updateForm('category_en', value)}
                  dir="ltr"
                />
              </div>

              <TextArea
                label={t.contentAr}
                value={form.content}
                onChange={(value) => updateForm('content', value)}
              />

              <TextArea
                label={t.contentEn}
                value={form.content_en}
                onChange={(value) => updateForm('content_en', value)}
                dir="ltr"
              />

              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={!!form.published}
                  onChange={(event) => updateForm('published', event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />

                <span className="text-sm text-gray-700">
                  {t.publishedPublic}
                </span>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:justify-end sm:p-6">
              <button
                type="button"
                onClick={closeModal}
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

function TableHead({ children, isRtl }) {
  return (
    <th
      className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-semibold text-gray-600`}
    >
      {children}
    </th>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
      {text}
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

function TextArea({ label, value, onChange, dir }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <textarea
        rows={4}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="input-field resize-none"
        dir={dir || ''}
      />
    </div>
  )
}
