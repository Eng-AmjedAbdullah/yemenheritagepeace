import { useContext, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import toast from 'react-hot-toast'
import ImageUpload from './ImageUpload'
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Image as ImageIcon,
  Video,
  Link2,
} from 'lucide-react'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const EMPTY = {
  title: '',
  title_en: '',
  description: '',
  description_en: '',
  type: 'photo',
  image_url: '',
  thumbnail_url: '',
  video_url: '',
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
  },
}

function isActive(value) {
  return value === true || value === 1 || value === '1'
}

export default function ManageGallery() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const pageTitle = isRtl ? 'إدارة المعرض' : 'Manage Gallery'
  const addLabel = isRtl ? 'إضافة عنصر' : 'Add Item'

  const load = async () => {
    setLoading(true)

    try {
      const data = await api.get('/gallery/all')
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
    if (filter === 'all') return items
    return items.filter((item) => item.type === filter)
  }, [items, filter])

  const photosCount = items.filter((item) => item.type === 'photo').length
  const videosCount = items.filter((item) => item.type === 'video').length

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const openAdd = (type = 'photo') => {
    setForm({
      ...EMPTY,
      type,
    })
    setEditId(null)
    setModal(true)
  }

  const openEdit = (item) => {
    setForm({
      title: item.title || '',
      title_en: item.title_en || '',
      description: item.description || '',
      description_en: item.description_en || '',
      type: item.type || 'photo',
      image_url: item.image_url || '',
      thumbnail_url: item.thumbnail_url || '',
      video_url: item.video_url || '',
      sort_order: item.sort_order || 0,
      is_active: isActive(item.is_active),
    })

    setEditId(item.id)
    setModal(true)
  }

  const closeModal = () => {
    setModal(false)
    setForm(EMPTY)
    setEditId(null)
  }

  const validate = () => {
    if (!form.title.trim()) {
      return isRtl ? 'العنوان العربي مطلوب' : 'Arabic title is required'
    }

    if (form.type === 'photo' && !form.image_url) {
      return isRtl ? 'صورة المعرض مطلوبة' : 'Gallery image is required'
    }

    if (form.type === 'video' && !form.video_url.trim()) {
      return isRtl ? 'رابط الفيديو مطلوب' : 'Video URL is required'
    }

    return ''
  }

  const handleSave = async () => {
    const error = validate()

    if (error) {
      toast.error(error, toastTheme.error)
      return
    }

    if (saving) return
    setSaving(true)

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        title_en: form.title_en.trim(),
        description: form.description.trim(),
        description_en: form.description_en.trim(),
        video_url: form.video_url.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_active: !!form.is_active,
      }

      if (editId) {
        await api.put(`/gallery/${editId}`, payload)
      } else {
        await api.post('/gallery', payload)
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

  const handleDelete = async (item) => {
    const confirmed = await requestConfirm({
      title: isRtl ? 'تأكيد حذف عنصر المعرض' : 'Delete gallery item?',
      message: isRtl
        ? 'سيتم حذف هذا العنصر من المعرض نهائيًا.'
        : 'This item will be permanently removed from the gallery.',
      variant: 'danger',
      confirmText: t.delete,
    })

    if (!confirmed) return

    try {
      await api.delete(`/gallery/${item.id}`)

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

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark md:text-3xl">
            {pageTitle}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isRtl
              ? 'إدارة معرض الصور والفيديوهات في الموقع'
              : 'Manage public photo and video galleries'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => openAdd('photo')}
            className="btn-primary justify-center"
          >
            <ImageIcon size={16} />
            {isRtl ? 'صورة' : 'Photo'}
          </button>

          <button
            type="button"
            onClick={() => openAdd('video')}
            className="btn-primary justify-center"
          >
            <Video size={16} />
            {isRtl ? 'فيديو' : 'Video'}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label={`${isRtl ? 'الكل' : 'All'} (${items.length})`}
          />

          <FilterButton
            active={filter === 'photo'}
            onClick={() => setFilter('photo')}
            label={`${isRtl ? 'الصور' : 'Photos'} (${photosCount})`}
          />

          <FilterButton
            active={filter === 'video'}
            onClick={() => setFilter('video')}
            label={`${isRtl ? 'الفيديو' : 'Videos'} (${videosCount})`}
          />
        </div>
      </div>

      <div className="md:hidden">
        {loading ? (
          <EmptyState text={t.loading} />
        ) : filteredItems.length === 0 ? (
          <EmptyState text={isRtl ? 'لا توجد عناصر' : 'No items found'} />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <GalleryThumb item={item} />

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-bold leading-6 text-dark">
                        {getTitle(item)}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                          isActive(item.is_active)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isActive(item.is_active)
                          ? isRtl
                            ? 'نشط'
                            : 'Active'
                          : isRtl
                            ? 'مخفي'
                            : 'Hidden'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {item.type === 'photo'
                          ? isRtl
                            ? 'صورة'
                            : 'Photo'
                          : isRtl
                            ? 'فيديو'
                            : 'Video'}
                      </span>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                        {isRtl ? 'الترتيب' : 'Order'}: {item.sort_order || 0}
                      </span>
                    </div>

                    {item.video_url && (
                      <a
                        href={item.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex max-w-full items-center gap-1 text-xs text-primary"
                        dir="ltr"
                      >
                        <Link2 size={12} />
                        <span className="truncate">{item.video_url}</span>
                      </a>
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
                    onClick={() => handleDelete(item)}
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
          <table className="w-full min-w-[840px] table-fixed text-sm">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[270px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
              <col className="w-[120px]" />
            </colgroup>

            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <TableHead isRtl={isRtl}>{isRtl ? 'الصورة' : 'Preview'}</TableHead>
                <TableHead isRtl={isRtl}>{t.title}</TableHead>
                <TableHead isRtl={isRtl}>{isRtl ? 'النوع' : 'Type'}</TableHead>
                <TableHead isRtl={isRtl}>{isRtl ? 'الترتيب' : 'Order'}</TableHead>
                <TableHead isRtl={isRtl}>{t.status}</TableHead>
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
                    {isRtl ? 'لا توجد عناصر' : 'No items found'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 transition hover:bg-gray-50/70"
                  >
                    <td className="p-4">
                      <GalleryThumb item={item} small />
                    </td>

                    <td className="p-4 font-medium text-dark">
                      <div className="line-clamp-1">{getTitle(item)}</div>

                      {item.title_en && isRtl && (
                        <div className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                          {item.title_en}
                        </div>
                      )}

                      {item.video_url && (
                        <a
                          href={item.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-primary"
                          dir="ltr"
                        >
                          <Link2 size={12} />
                          <span className="truncate">{item.video_url}</span>
                        </a>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {item.type === 'photo'
                          ? isRtl
                            ? 'صورة'
                            : 'Photo'
                          : isRtl
                            ? 'فيديو'
                            : 'Video'}
                      </span>
                    </td>

                    <td className="p-4 text-gray-500">
                      {item.sort_order || 0}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          isActive(item.is_active)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isActive(item.is_active)
                          ? isRtl
                            ? 'نشط'
                            : 'Active'
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
                          onClick={() => handleDelete(item)}
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
          <div className="modal-box w-[calc(100vw-24px)] max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <h2 className="text-lg font-bold text-dark sm:text-xl">
                {editId
                  ? isRtl
                    ? 'تعديل عنصر المعرض'
                    : 'Edit Gallery Item'
                  : addLabel}
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {isRtl ? 'نوع العنصر' : 'Item Type'}
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) => updateForm('type', event.target.value)}
                    className="input-field"
                  >
                    <option value="photo">{isRtl ? 'صورة' : 'Photo'}</option>
                    <option value="video">{isRtl ? 'فيديو' : 'Video'}</option>
                  </select>
                </div>

                <Field
                  label={isRtl ? 'الترتيب' : 'Order'}
                  type="number"
                  value={form.sort_order}
                  onChange={(value) => updateForm('sort_order', value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={`${isRtl ? 'العنوان العربي' : 'Arabic Title'} *`}
                  value={form.title}
                  onChange={(value) => updateForm('title', value)}
                />

                <Field
                  label={isRtl ? 'العنوان الإنجليزي' : 'English Title'}
                  value={form.title_en}
                  onChange={(value) => updateForm('title_en', value)}
                  dir="ltr"
                />
              </div>

              {form.type === 'photo' && (
                <ImageUpload
                  value={form.image_url}
                  onChange={(value) => updateForm('image_url', value)}
                  folder="gallery/photos"
                  label={isRtl ? 'صورة المعرض' : 'Gallery Image'}
                />
              )}

              {form.type === 'video' && (
                <>
                  <ImageUpload
                    value={form.thumbnail_url}
                    onChange={(value) => updateForm('thumbnail_url', value)}
                    folder="gallery/videos"
                    label={isRtl ? 'صورة مصغرة للفيديو' : 'Video Thumbnail'}
                  />

                  <Field
                    label={`${isRtl ? 'رابط الفيديو' : 'Video URL'} *`}
                    value={form.video_url}
                    onChange={(value) => updateForm('video_url', value)}
                    dir="ltr"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </>
              )}

              <TextArea
                label={isRtl ? 'الوصف العربي' : 'Arabic Description'}
                value={form.description}
                onChange={(value) => updateForm('description', value)}
              />

              <TextArea
                label={isRtl ? 'الوصف الإنجليزي' : 'English Description'}
                value={form.description_en}
                onChange={(value) => updateForm('description_en', value)}
                dir="ltr"
              />

              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(event) => updateForm('is_active', event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />

                <span className="text-sm text-gray-700">
                  {isRtl ? 'إظهار في الموقع' : 'Show on website'}
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

function GalleryThumb({ item, small = false }) {
  const src = item.type === 'photo'
    ? item.image_url
    : item.thumbnail_url || item.image_url

  const sizeClass = small ? 'h-14 w-20' : 'h-24 w-24'

  if (src) {
    return (
      <img
        src={resolveMediaUrl(src)}
        alt=""
        className={`${sizeClass} shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-cover`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-400`}
    >
      {item.type === 'video' ? <Video size={22} /> : <ImageIcon size={22} />}
    </div>
  )
}

function FilterButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
        active
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
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
