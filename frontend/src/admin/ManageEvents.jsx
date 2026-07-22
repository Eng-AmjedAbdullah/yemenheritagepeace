import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CalendarDays,
  Edit,
  ExternalLink,
  Images,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Video,
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
  type: 'event',
  event_date: '',
  location: '',
  location_en: '',
  image_url: '',
  published: true,
  collection_ids: [],
}

const EMPTY_TOUCHED = {
  title: false,
  title_en: false,
  content: false,
  content_en: false,
  event_date: false,
  location: false,
  location_en: false,
  image_url: false,
}

const TYPE_MAP = {
  event: { ar: 'فعالية', en: 'Event' },
  seminar: { ar: 'ندوة', en: 'Seminar' },
  project: { ar: 'مشروع', en: 'Project' },
  training: { ar: 'تدريب', en: 'Training' },
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
  },
  error: {
    duration: 4500,
    style: {
      background: '#7f1d1d',
      color: '#ffffff',
      border: '1px solid #991b1b',
      borderRadius: '12px',
      fontSize: '14px',
      padding: '14px 18px',
    },
  },
}

function isPublished(value) {
  return value === true || value === 1 || value === '1'
}

function getInputDate(value) {
  if (!value) return ''
  return String(value).split('T')[0]
}

function isValidHttpUrl(value) {
  if (!value) return true

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeCollectionIds(value) {
  if (!Array.isArray(value)) return []

  return [
    ...new Set(
      value
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ]
}

function validateForm(form, isRtl) {
  const errors = {}

  if (!form.title.trim()) {
    errors.title = isRtl ? 'العنوان العربي مطلوب' : 'Arabic title is required'
  } else if (form.title.trim().length > 180) {
    errors.title = isRtl
      ? 'العنوان طويل جدًا، الحد الأقصى 180 حرفًا'
      : 'Title is too long. Maximum is 180 characters'
  }

  if (form.title_en.trim().length > 180) {
    errors.title_en = isRtl
      ? 'العنوان الإنجليزي طويل جدًا'
      : 'English title is too long'
  }

  if (!form.event_date) {
    errors.event_date = isRtl ? 'تاريخ الفعالية مطلوب' : 'Event date is required'
  }

  if (form.location.trim().length > 220) {
    errors.location = isRtl ? 'الموقع طويل جدًا' : 'Location is too long'
  }

  if (form.location_en.trim().length > 220) {
    errors.location_en = isRtl
      ? 'الموقع الإنجليزي طويل جدًا'
      : 'English location is too long'
  }

  if (form.content.length > 12000) {
    errors.content = isRtl
      ? 'الوصف طويل جدًا، الحد الأقصى 12000 حرفًا'
      : 'Description is too long. Maximum is 12000 characters'
  }

  if (form.content_en.length > 12000) {
    errors.content_en = isRtl
      ? 'الوصف الإنجليزي طويل جدًا'
      : 'English description is too long'
  }

  if (form.image_url && !isValidHttpUrl(form.image_url)) {
    errors.image_url = isRtl ? 'رابط الصورة غير صحيح' : 'Image URL is invalid'
  }

  return errors
}

export default function ManageEvents() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [events, setEvents] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState(EMPTY_TOUCHED)

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = async () => {
    setLoading(true)

    try {
      const [eventData, collectionData] = await Promise.all([
        api.get('/events/all', {
          loadingLabel: 'admin-events',
        }),
        api.get('/gallery/collections/all', {
          loadingLabel: 'admin-event-gallery-options',
        }),
      ])

      setEvents(Array.isArray(eventData) ? eventData : [])
      setCollections(Array.isArray(collectionData) ? collectionData : [])
    } catch (error) {
      console.error('Failed to load event management data:', error)
      setEvents([])
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const errors = useMemo(() => validateForm(form, isRtl), [form, isRtl])
  const hasErrors = Object.keys(errors).length > 0

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return events.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false

      const itemDate = getInputDate(item.event_date)
      if (dateFrom && (!itemDate || itemDate < dateFrom)) return false
      if (dateTo && (!itemDate || itemDate > dateTo)) return false

      if (!query) return true

      return [
        item.title,
        item.title_en,
        item.content,
        item.content_en,
        item.location,
        item.location_en,
        TYPE_MAP[item.type]?.ar,
        TYPE_MAP[item.type]?.en,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [events, searchTerm, typeFilter, dateFrom, dateTo])

  const hasActiveFilters = Boolean(
    searchTerm.trim() || typeFilter !== 'all' || dateFrom || dateTo
  )

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setTouched((current) => ({ ...current, [key]: true }))
  }

  const markTouched = (key) => {
    setTouched((current) => ({ ...current, [key]: true }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setTouched(EMPTY_TOUCHED)
    setEditId(null)
  }

  const openAdd = () => {
    resetForm()
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
      type: item.type || 'event',
      event_date: getInputDate(item.event_date),
      location: item.location || '',
      location_en: item.location_en || '',
      image_url: item.image_url || '',
      published: isPublished(item.published),
      collection_ids: normalizeCollectionIds(
        item.related_collection_ids ||
          item.related_collections?.map((collection) => collection.id)
      ),
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    resetForm()
  }

  const toggleCollection = (collectionId) => {
    const numericId = Number(collectionId)

    setForm((current) => {
      const selected = normalizeCollectionIds(current.collection_ids)
      const exists = selected.includes(numericId)

      return {
        ...current,
        collection_ids: exists
          ? selected.filter((id) => id !== numericId)
          : [...selected, numericId],
      }
    })
  }

  const touchRequiredFields = () => {
    setTouched((current) => ({
      ...current,
      title: true,
      title_en: true,
      content: true,
      content_en: true,
      event_date: true,
      location: true,
      location_en: true,
      image_url: true,
    }))
  }

  const handleSave = async () => {
    touchRequiredFields()

    if (hasErrors || saving) {
      if (hasErrors) {
        toast.error(
          isRtl
            ? 'راجع الحقول المميزة وصحح البيانات قبل الحفظ'
            : 'Review the highlighted fields before saving',
          toastTheme.error
        )
      }
      return
    }

    setSaving(true)

    try {
      const payload = {
        title: form.title.trim(),
        title_en: form.title_en.trim(),
        content: form.content.trim(),
        content_en: form.content_en.trim(),
        type: form.type,
        event_date: form.event_date,
        location: form.location.trim(),
        location_en: form.location_en.trim(),
        image_url: form.image_url.trim(),
        published: Boolean(form.published),
        collection_ids: normalizeCollectionIds(form.collection_ids),
      }

      if (editId) {
        await api.put(`/events/${editId}`, payload, {
          globalLoading: true,
          loadingLabel: 'update-event',
        })
      } else {
        await api.post('/events', payload, {
          globalLoading: true,
          loadingLabel: 'create-event',
        })
      }

      toast.success(
        editId
          ? isRtl
            ? 'تم تحديث الفعالية بنجاح'
            : 'Event updated successfully'
          : isRtl
            ? 'تمت إضافة الفعالية بنجاح'
            : 'Event added successfully',
        toastTheme.success
      )

      await load()
      closeModal()
    } catch (error) {
      toast.error(
        error?.message || (isRtl ? 'حدث خطأ أثناء الحفظ' : 'Save failed'),
        toastTheme.error
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    const confirmed = await requestConfirm({
      title: isRtl ? 'حذف الفعالية' : 'Delete event',
      message: isRtl
        ? `سيتم حذف «${getTitle(item, isRtl)}» نهائيًا.`
        : `“${getTitle(item, isRtl)}” will be permanently deleted.`,
      variant: 'danger',
      confirmText: t.delete || (isRtl ? 'حذف' : 'Delete'),
    })

    if (!confirmed) return

    try {
      await api.delete(`/events/${item.id}`, null, {
        globalLoading: true,
        loadingLabel: 'delete-event',
      })
      toast.success(isRtl ? 'تم حذف الفعالية' : 'Event deleted', toastTheme.success)
      await load()
    } catch (error) {
      toast.error(
        error?.message || (isRtl ? 'تعذر حذف الفعالية' : 'Delete failed'),
        toastTheme.error
      )
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  if (loading) return null

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-dark sm:text-3xl">
            <CalendarDays size={29} className="text-primary" />
            {t.manageEvents || (isRtl ? 'إدارة الفعاليات' : 'Manage Events')}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isRtl
              ? `النتائج: ${filteredEvents.length} من ${events.length}`
              : `${filteredEvents.length} of ${events.length} shown`}
          </p>
        </div>

        <button type="button" onClick={openAdd} className="btn-primary">
          <Plus size={18} />
          {t.addEvent || (isRtl ? 'إضافة فعالية' : 'Add Event')}
        </button>
      </div>

      <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="search-field xl:col-span-2">
            <Search size={18} className="search-icon" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={isRtl ? 'ابحث بالعنوان أو الموقع...' : 'Search title or location...'}
              className="input-field"
            />
          </label>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="input-field"
          >
            <option value="all">{isRtl ? 'كل الأنواع' : 'All types'}</option>
            {Object.entries(TYPE_MAP).map(([value, labels]) => (
              <option key={value} value={value}>
                {labels[isRtl ? 'ar' : 'en']}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="input-field"
            dir="ltr"
            aria-label={isRtl ? 'من تاريخ' : 'From date'}
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="input-field"
            dir="ltr"
            aria-label={isRtl ? 'إلى تاريخ' : 'To date'}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <RotateCcw size={15} />
            {isRtl ? 'إعادة ضبط البحث' : 'Reset filters'}
          </button>
        )}
      </section>

      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">
          {isRtl ? 'لا توجد فعاليات مطابقة' : 'No matching events'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredEvents.map((item) => {
            const relatedCollections = Array.isArray(item.related_collections)
              ? item.related_collections
              : []

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="h-48 bg-gray-100 sm:h-auto sm:w-48">
                    {item.image_url ? (
                      <img
                        src={resolveMediaUrl(item.image_url)}
                        alt={getTitle(item, isRtl)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-40 items-center justify-center text-primary/50">
                        <CalendarDays size={42} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-lg font-bold text-dark">
                          {getTitle(item, isRtl)}
                        </h2>
                        <p className="mt-2 text-sm font-semibold text-primary">
                          {TYPE_MAP[item.type]?.[isRtl ? 'ar' : 'en'] || item.type}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          isPublished(item.published)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isPublished(item.published)
                          ? isRtl
                            ? 'منشور'
                            : 'Published'
                          : isRtl
                            ? 'مخفي'
                            : 'Hidden'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-500">
                      <p className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-primary" />
                        {formatDate(item.event_date, isRtl)}
                      </p>
                      {getLocation(item, isRtl) && (
                        <p className="flex items-center gap-2">
                          <MapPin size={15} className="text-primary" />
                          <span className="line-clamp-1">{getLocation(item, isRtl)}</span>
                        </p>
                      )}
                    </div>

                    {relatedCollections.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {relatedCollections.slice(0, 3).map((collection) => (
                          <span
                            key={collection.id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                          >
                            {collection.type === 'video' ? (
                              <Video size={12} />
                            ) : (
                              <Images size={12} />
                            )}
                            {getCollectionTitle(collection, isRtl)}
                          </span>
                        ))}
                        {relatedCollections.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                            +{relatedCollections.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                      >
                        <Edit size={15} />
                        {t.edit || (isRtl ? 'تعديل' : 'Edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 size={15} />
                        {t.delete || (isRtl ? 'حذف' : 'Delete')}
                      </button>

                      {relatedCollections.length > 0 && (
                        <Link
                          to={`/events/${item.id}/collections`}
                          target="_blank"
                          className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                        >
                          <ExternalLink size={15} />
                          {isRtl ? 'عرض المجموعات' : 'View collections'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        closeDisabled={saving}
        title={
          editId
            ? isRtl
              ? 'تعديل الفعالية'
              : 'Edit Event'
            : isRtl
              ? 'إضافة فعالية'
              : 'Add Event'
        }
        subtitle={
          isRtl
            ? 'يتم التحقق من البيانات مباشرة أثناء الكتابة. ويمكن ربط الفعالية بمجموعات صور أو فيديو اختيارياً.'
            : 'Fields are validated while typing. Photo and video collections can be linked optionally.'
        }
        icon={CalendarDays}
        isRtl={isRtl}
        size="wide"
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="btn-outline min-w-32 justify-center"
            >
              {t.cancel || (isRtl ? 'إلغاء' : 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || hasErrors}
              className="btn-primary min-w-36 justify-center"
            >
              <Save size={16} />
              {saving
                ? t.saving || (isRtl ? 'جارٍ الحفظ...' : 'Saving...')
                : t.save || (isRtl ? 'حفظ' : 'Save')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <ImageUpload
            value={form.image_url}
            onChange={(value) => updateForm('image_url', value)}
            folder="events"
            label={t.eventImage || (isRtl ? 'صورة الفعالية' : 'Event image')}
          />
          {touched.image_url && errors.image_url && (
            <p className="text-xs font-semibold text-red-600">{errors.image_url}</p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedField
              label={isRtl ? 'العنوان العربي' : 'Arabic title'}
              value={form.title}
              onChange={(value) => updateForm('title', value)}
              onBlur={() => markTouched('title')}
              error={errors.title}
              touched={touched.title}
              required
              dir="rtl"
            />
            <ValidatedField
              label={isRtl ? 'العنوان الإنجليزي' : 'English title'}
              value={form.title_en}
              onChange={(value) => updateForm('title_en', value)}
              onBlur={() => markTouched('title_en')}
              error={errors.title_en}
              touched={touched.title_en}
              dir="ltr"
            />
            <ValidatedField
              label={isRtl ? 'النوع' : 'Type'}
              value={form.type}
              onChange={(value) => updateForm('type', value)}
              as="select"
              touched
              options={Object.entries(TYPE_MAP).map(([value, labels]) => ({
                value,
                label: labels[isRtl ? 'ar' : 'en'],
              }))}
            />
            <ValidatedField
              label={isRtl ? 'تاريخ الفعالية' : 'Event date'}
              value={form.event_date}
              onChange={(value) => updateForm('event_date', value)}
              onBlur={() => markTouched('event_date')}
              error={errors.event_date}
              touched={touched.event_date}
              required
              type="date"
              dir="ltr"
            />
            <ValidatedField
              label={isRtl ? 'الموقع بالعربية' : 'Arabic location'}
              value={form.location}
              onChange={(value) => updateForm('location', value)}
              onBlur={() => markTouched('location')}
              error={errors.location}
              touched={touched.location}
              dir="rtl"
            />
            <ValidatedField
              label={isRtl ? 'الموقع بالإنجليزية' : 'English location'}
              value={form.location_en}
              onChange={(value) => updateForm('location_en', value)}
              onBlur={() => markTouched('location_en')}
              error={errors.location_en}
              touched={touched.location_en}
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedField
              label={isRtl ? 'الوصف العربي' : 'Arabic description'}
              value={form.content}
              onChange={(value) => updateForm('content', value)}
              onBlur={() => markTouched('content')}
              error={errors.content}
              touched={touched.content}
              as="textarea"
              rows={5}
              dir="rtl"
            />
            <ValidatedField
              label={isRtl ? 'الوصف الإنجليزي' : 'English description'}
              value={form.content_en}
              onChange={(value) => updateForm('content_en', value)}
              onBlur={() => markTouched('content_en')}
              error={errors.content_en}
              touched={touched.content_en}
              as="textarea"
              rows={5}
              dir="ltr"
            />
          </div>

          <CollectionSelector
            collections={collections}
            selectedIds={form.collection_ids}
            onToggle={toggleCollection}
            isRtl={isRtl}
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <input
              type="checkbox"
              checked={Boolean(form.published)}
              onChange={(event) => updateForm('published', event.target.checked)}
              className="h-5 w-5 accent-primary"
            />
            <span className="text-sm font-semibold text-gray-700">
              {isRtl ? 'نشر الفعالية في الموقع' : 'Publish this event on the website'}
            </span>
          </label>
        </div>
      </AdminModal>
    </div>
  )
}

function CollectionSelector({ collections, selectedIds, onToggle, isRtl }) {
  const selected = normalizeCollectionIds(selectedIds)

  return (
    <section className="rounded-2xl border border-primary/15 bg-primary/[0.035] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-dark">
            <Images size={18} className="text-primary" />
            {isRtl ? 'المجموعات المرتبطة' : 'Related collections'}
          </h3>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            {isRtl
              ? 'اختياري: اختر مجموعات الصور أو الفيديو التي تخص هذه الفعالية.'
              : 'Optional: select photo or video collections related to this event.'}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary shadow-sm">
          {selected.length} {isRtl ? 'محدد' : 'selected'}
        </span>
      </div>

      {collections.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-center text-sm text-gray-400">
          {isRtl
            ? 'لا توجد مجموعات بعد. أضفها من صفحة إدارة المعرض.'
            : 'No collections yet. Add them from Manage Gallery.'}
        </p>
      ) : (
        <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pe-1 sm:grid-cols-2">
          {collections.map((collection) => {
            const checked = selected.includes(Number(collection.id))

            return (
              <label
                key={collection.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  checked
                    ? 'border-primary bg-white shadow-sm'
                    : 'border-gray-100 bg-white/70 hover:border-primary/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(collection.id)}
                  className="h-4 w-4 shrink-0 accent-primary"
                />

                <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-primary">
                  {collection.cover_url ? (
                    <img
                      src={resolveMediaUrl(collection.cover_url)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : collection.type === 'video' ? (
                    <Video size={20} />
                  ) : (
                    <Images size={20} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold text-dark">
                    {getCollectionTitle(collection, isRtl)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {collection.type === 'video'
                      ? isRtl
                        ? 'فيديو'
                        : 'Video'
                      : isRtl
                        ? 'صور'
                        : 'Photos'}
                    {' · '}
                    {Number(collection.items_count) || 0}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      )}
    </section>
  )
}

function getTitle(item, isRtl) {
  return isRtl
    ? item.title || item.title_en || '—'
    : item.title_en || item.title || '—'
}

function getCollectionTitle(item, isRtl) {
  return getTitle(item, isRtl)
}

function getLocation(item, isRtl) {
  return isRtl
    ? item.location || item.location_en || ''
    : item.location_en || item.location || ''
}

function formatDate(value, isRtl) {
  if (!value) return '—'

  try {
    return new Date(value).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}
