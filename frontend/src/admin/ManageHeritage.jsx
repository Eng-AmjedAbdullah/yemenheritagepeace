import { useState, useEffect, useContext } from 'react'
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
  MapPin,
  Clock,
  Image as ImageIcon,
} from 'lucide-react'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const EMPTY = {
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
  return value === true || value === 1 || value === '1'
}

export default function ManageHeritage() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)

    try {
      const data = await api.get('/heritage/all')
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
      type: item.type || 'tangible',
      image_url: item.image_url || '',
      location: item.location || '',
      period: item.period || '',
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
        period: form.period.trim(),
        published: !!form.published,
      }

      if (editId) {
        await api.put(`/heritage/${editId}`, payload)
      } else {
        await api.post('/heritage', payload)
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
      title: isRtl ? 'تأكيد حذف العنصر' : 'Delete heritage item?',
      message: isRtl
        ? 'سيتم حذف هذا العنصر التراثي نهائياً.'
        : 'This heritage item will be permanently removed.',
      variant: 'danger',
      confirmText: t.delete,
    })

    if (!confirmed) return

    try {
      await api.delete(`/heritage/${id}`)

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

  const getTitle = (item) => {
    if (isRtl) return item.title || item.title_en || '—'
    return item.title_en || item.title || '—'
  }

  const getTypeLabel = (type) => {
    return type === 'tangible' ? t.tangible : t.intangible
  }

  const getTypeClass = (type) => {
    return type === 'tangible'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-purple-100 text-purple-700'
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-dark md:text-3xl">
            {t.manageHeritage}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isRtl
              ? 'إدارة عناصر التراث المادي وغير المادي'
              : 'Manage tangible and intangible heritage items'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="btn-primary w-full justify-center sm:w-auto"
        >
          <Plus size={16} />
          {t.addHeritage}
        </button>
      </div>

      <div className="md:hidden">
        {loading ? (
          <EmptyState text={t.loading} />
        ) : items.length === 0 ? (
          <EmptyState text={t.noHeritage} />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
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
                        {isPublished(item.published)
                          ? t.published || (isRtl ? 'منشور' : 'Published')
                          : isRtl
                            ? 'مخفي'
                            : 'Hidden'}
                      </span>
                    </div>

                    {item.title_en && isRtl && (
                      <p className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                        {item.title_en}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${getTypeClass(
                          item.type
                        )}`}
                      >
                        {getTypeLabel(item.type)}
                      </span>

                      {item.period && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {item.period}
                        </span>
                      )}
                    </div>

                    {item.location && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={12} />
                        <span className="line-clamp-1">{item.location}</span>
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
              <col className="w-[280px]" />
              <col className="w-[130px]" />
              <col className="w-[180px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
            </colgroup>

            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <TableHead isRtl={isRtl}>{t.image}</TableHead>
                <TableHead isRtl={isRtl}>{t.title}</TableHead>
                <TableHead isRtl={isRtl}>{t.eventType}</TableHead>
                <TableHead isRtl={isRtl}>{t.location}</TableHead>
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
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    {t.noHeritage}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
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

                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${getTypeClass(
                          item.type
                        )}`}
                      >
                        {getTypeLabel(item.type)}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-gray-500">
                      <div className="line-clamp-1">
                        {item.location || '—'}
                      </div>

                      {item.period && (
                        <div className="mt-1 line-clamp-1 text-gray-400">
                          {item.period}
                        </div>
                      )}
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
          <div className="modal-box w-[calc(100vw-24px)] max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <h2 className="text-lg font-bold text-dark sm:text-xl">
                {editId ? t.editHeritage : t.addHeritageItem}
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
                folder="heritage"
                label={t.heritageImage}
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
                    <option value="tangible">{t.tangible}</option>
                    <option value="intangible">{t.intangible}</option>
                  </select>
                </div>

                <Field
                  label={t.period}
                  value={form.period}
                  onChange={(value) => updateForm('period', value)}
                  placeholder={t.periodPlaceholder}
                />
              </div>

              <Field
                label={t.location}
                value={form.location}
                onChange={(value) => updateForm('location', value)}
                placeholder={t.locationPlaceholder}
              />

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
        placeholder={placeholder || ''}
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
