import { useContext, useEffect, useMemo, useState } from 'react'
import { resolveMediaUrl } from '../lib/media'
import api from '../lib/api'
import toast from 'react-hot-toast'
import ImageUpload from './ImageUpload'
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  CalendarDays,
  MapPin,
} from 'lucide-react'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const EMPTY = {
  title: '',
  title_en: '',
  content: '',
  content_en: '',
  type: 'event',
  event_date: '',
  location: '',
  location_en: '',
  image_url: '',
  published: true,
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

const typeMap = {
  event: { ar: 'فعالية', en: 'Event' },
  seminar: { ar: 'ندوة', en: 'Seminar' },
  project: { ar: 'مشروع', en: 'Project' },
  training: { ar: 'تدريب', en: 'Training' },
}

function isPublished(value) {
  return value === true || value === 1 || value === '1'
}

function getTypeLabel(type, isRtl) {
  return typeMap[type]?.[isRtl ? 'ar' : 'en'] || type || '—'
}

function getInputDate(value) {
  if (!value) return ''

  try {
    return String(value).split('T')[0]
  } catch {
    return ''
  }
}

export default function ManageEvents() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = async () => {
    setLoading(true)

    try {
      const data = await api.get('/events/all')
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

  const filteredItems = useMemo(() => {
    let nextItems = [...items]

    const query = searchTerm.trim().toLowerCase()

    if (query) {
      nextItems = nextItems.filter((item) => {
        const searchableText = [
          item.title,
          item.title_en,
          item.content,
          item.content_en,
          item.location,
          item.location_en,
          item.type,
          getTypeLabel(item.type, isRtl),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(query)
      })
    }

    if (typeFilter !== 'all') {
      nextItems = nextItems.filter((item) => item.type === typeFilter)
    }

    if (dateFrom) {
      nextItems = nextItems.filter((item) => {
        const itemDate = getInputDate(item.event_date)
        return itemDate && itemDate >= dateFrom
      })
    }

    if (dateTo) {
      nextItems = nextItems.filter((item) => {
        const itemDate = getInputDate(item.event_date)
        return itemDate && itemDate <= dateTo
      })
    }

    return nextItems
  }, [items, searchTerm, typeFilter, dateFrom, dateTo, isRtl])

  const eventCount = items.filter((item) => item.type === 'event').length
  const seminarCount = items.filter((item) => item.type === 'seminar').length
  const projectCount = items.filter((item) => item.type === 'project').length
  const trainingCount = items.filter((item) => item.type === 'training').length

  const hasActiveFilters = Boolean(
    searchTerm.trim() || typeFilter !== 'all' || dateFrom || dateTo
  )

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const openAdd = () => {
    setForm(EMPTY)
    setEditId(null)
    setModal(true)
  }

  const openEdit = (item) => {
    setForm({
      title: item.title || '',
      title_en: item.title_en || '',
      content: item.content || '',
      content_en: item.content_en || '',
      type: item.type || 'event',
      event_date: getInputDate(item.event_date),
      location: item.location || '',
      location_en: item.location_en || '',
      image_url: item.image_url || '',
      published: isPublished(item.published),
    })

    setEditId(item.id)
    setModal(true)
  }

  const closeModal = () => {
    setModal(false)
    setForm(EMPTY)
    setEditId(null)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const handleSave = async () => {
    if (!form.title?.trim()) {
      toast.error(
        t.titleRequired || (isRtl ? 'العنوان مطلوب' : 'Title is required'),
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
        location: form.location.trim(),
        location_en: form.location_en.trim(),
        published: !!form.published,
      }

      if (editId) {
        await api.put(`/events/${editId}`, payload)
      } else {
        await api.post('/events', payload)
      }

      toast.success(
        editId
          ? t.saved || (isRtl ? 'تم الحفظ' : 'Saved')
          : t.added || (isRtl ? 'تمت الإضافة' : 'Added'),
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
      title: isRtl ? 'تأكيد حذف الفعالية' : 'Delete event?',
      message: isRtl
        ? 'سيتم حذف هذه الفعالية نهائياً من لوحة الإدارة.'
        : 'This event will be permanently removed from the admin dashboard.',
      variant: 'danger',
      confirmText: t.delete,
    })

    if (!confirmed) return

    try {
      await api.delete(`/events/${id}`)

      toast.success(
        t.deleted || (isRtl ? 'تم الحذف' : 'Deleted'),
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

  const getTypeName = (type) => {
    return getTypeLabel(type, isRtl)
  }

  const getTitle = (item) => {
    if (isRtl) return item.title || item.title_en || '—'
    return item.title_en || item.title || '—'
  }

  const getLocation = (item) => {
    if (isRtl) return item.location || item.location_en || ''
    return item.location_en || item.location || ''
  }

  const formatDate = (value) => {
    if (!value) return '—'

    try {
      return new Date(value).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')
    } catch {
      return '—'
    }
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-dark md:text-3xl">
            {t.manageEvents}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isRtl
              ? `إدارة الفعاليات والندوات والمشاريع والتدريبات — النتائج: ${filteredItems.length} من ${items.length}`
              : `Manage events, seminars, projects, and trainings — ${filteredItems.length} of ${items.length} shown`}
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="btn-primary w-full justify-center sm:w-auto"
        >
          <Plus size={16} />
          {t.addEvent}
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_220px_180px_180px_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isRtl ? 'بحث' : 'Search'}
            </label>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={
                isRtl
                  ? 'ابحث بالعنوان أو الموقع أو الوصف...'
                  : 'Search by title, location, or description...'
              }
              className={`input-field h-12 w-full px-4 ${
                isRtl ? 'text-right' : 'text-left'
              }`}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isRtl ? 'التصنيف' : 'Category'}
            </label>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="input-field h-12 w-full"
            >
              <option value="all">
                {isRtl ? `كل التصنيفات (${items.length})` : `All categories (${items.length})`}
              </option>
              <option value="event">
                {getTypeName('event')} ({eventCount})
              </option>
              <option value="seminar">
                {getTypeName('seminar')} ({seminarCount})
              </option>
              <option value="project">
                {getTypeName('project')} ({projectCount})
              </option>
              <option value="training">
                {getTypeName('training')} ({trainingCount})
              </option>
            </select>
          </div>

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

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className={`h-12 rounded-xl px-4 text-sm font-semibold transition ${
              hasActiveFilters
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'cursor-not-allowed bg-gray-100 text-gray-400'
            }`}
          >
            {isRtl ? 'إعادة ضبط' : 'Reset'}
          </button>
        </div>
      </div>

      <div className="md:hidden">
        {loading ? (
          <EmptyState text={t.loading} />
        ) : filteredItems.length === 0 ? (
          <EmptyState text={isRtl ? 'لا توجد نتائج مطابقة' : 'No matching results'} />
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
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">
                      {t.image}
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
                        {isPublished(item.published)
                          ? t.published || (isRtl ? 'منشور' : 'Published')
                          : isRtl
                            ? 'مخفي'
                            : 'Hidden'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {getTypeName(item.type)}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                        <CalendarDays size={12} />
                        {formatDate(item.event_date)}
                      </span>
                    </div>

                    {getLocation(item) && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={12} />
                        <span className="line-clamp-1">
                          {getLocation(item)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600"
                  >
                    <Edit size={15} />
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
          <table className="w-full min-w-[760px] table-fixed text-sm">
            <colgroup>
              <col className="w-[110px]" />
              <col className="w-[270px]" />
              <col className="w-[130px]" />
              <col className="w-[140px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
            </colgroup>

            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <TableHead isRtl={isRtl}>{t.image}</TableHead>
                <TableHead isRtl={isRtl}>{t.title}</TableHead>
                <TableHead isRtl={isRtl}>{t.eventType}</TableHead>
                <TableHead isRtl={isRtl}>{t.date}</TableHead>
                <TableHead isRtl={isRtl}>
                  {t.status || (isRtl ? 'الحالة' : 'Status')}
                </TableHead>
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
                    {isRtl ? 'لا توجد نتائج مطابقة' : 'No matching results'}
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
                        <div className="h-14 w-20 rounded-lg bg-gray-100" />
                      )}
                    </td>

                    <td className="p-4 font-medium text-dark">
                      <div className="line-clamp-1">
                        {getTitle(item)}
                      </div>

                      {item.title_en && isRtl && (
                        <div className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                          {item.title_en}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {getTypeName(item.type)}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-gray-400">
                      {formatDate(item.event_date)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          isPublished(item.published)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isPublished(item.published)
                          ? t.published || (isRtl ? 'منشور' : 'Published')
                          : isRtl
                            ? 'مخفي'
                            : 'Hidden'}
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
          onClick={(event) => event.target === event.currentTarget && closeModal()}
        >
          <div className="modal-box max-h-[90vh] w-[calc(100vw-24px)] max-w-3xl overflow-y-auto">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <h2 className="text-lg font-bold text-dark sm:text-xl">
                {editId ? t.editEvent : t.addEvent}
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
                folder="events"
                label={t.eventImage}
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t.eventType}
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) => updateForm('type', event.target.value)}
                    className="input-field"
                  >
                    <option value="event">{t.typeEvent || getTypeName('event')}</option>
                    <option value="seminar">{t.typeSeminar || getTypeName('seminar')}</option>
                    <option value="project">{t.typeProject || getTypeName('project')}</option>
                    <option value="training">{t.typeTraining || getTypeName('training')}</option>
                  </select>
                </div>

                <Field
                  label={t.eventDate}
                  type="date"
                  value={form.event_date}
                  onChange={(value) => updateForm('event_date', value)}
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={t.locationAr}
                  value={form.location}
                  onChange={(value) => updateForm('location', value)}
                />

                <Field
                  label={t.locationEn}
                  value={form.location_en}
                  onChange={(value) => updateForm('location_en', value)}
                  dir="ltr"
                />
              </div>

              <TextArea
                label={t.descriptionAr}
                value={form.content}
                onChange={(value) => updateForm('content', value)}
              />

              <TextArea
                label={t.descriptionEn}
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
                  {t.published}
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
        rows={3}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="input-field resize-none"
        dir={dir || ''}
      />
    </div>
  )
}
