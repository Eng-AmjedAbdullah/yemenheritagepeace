import { useContext, useEffect, useState } from 'react'
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
  Link2,
  Image as ImageIcon,
} from 'lucide-react'
import { useAdminLang } from './adminI18n'
import { ConfirmContext } from './AdminLayout'

const EMPTY = {
  name: '',
  name_en: '',
  logo_url: '',
  website_url: '',
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

function isActive(value) {
  return value === true || value === 1 || value === '1'
}

export default function ManagePartners() {
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
      const data = await api.get('/partners/all')
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
    setModal('form')
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

    setEditId(item.id)
    setModal('form')
  }

  const closeModal = () => {
    setModal(null)
    setForm(EMPTY)
    setEditId(null)
  }

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error(
        t.titleRequired || (isRtl ? 'الاسم مطلوب' : 'Name is required'),
        toastTheme.error
      )
      return
    }

    if (saving) return
    setSaving(true)

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        name_en: form.name_en.trim(),
        website_url: form.website_url.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_active: !!form.is_active,
      }

      if (editId) {
        await api.put(`/partners/${editId}`, payload)
      } else {
        await api.post('/partners', payload)
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
      title: isRtl ? 'تأكيد حذف الشريك' : 'Delete partner?',
      message: isRtl
        ? 'سيتم حذف هذا الشريك من قائمة الشركاء.'
        : 'This partner will be removed from the partners list.',
      variant: 'danger',
      confirmText: t.delete,
    })

    if (!confirmed) return

    try {
      await api.delete(`/partners/${id}`)

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

  const getName = (item) => {
    if (isRtl) return item.name || item.name_en || '—'
    return item.name_en || item.name || '—'
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-dark md:text-3xl">
            {t.managePartners}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isRtl
              ? 'إدارة شعارات وروابط الشركاء وترتيب ظهورهم'
              : 'Manage partner logos, links, and display order'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="btn-primary w-full justify-center sm:w-auto"
        >
          <Plus size={16} />
          {t.addPartner}
        </button>
      </div>

      <div className="md:hidden">
        {loading ? (
          <EmptyState text={t.loading} />
        ) : items.length === 0 ? (
          <EmptyState text={t.noPartners} />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  {item.logo_url ? (
                    <img
                      src={resolveMediaUrl(item.logo_url)}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-400">
                      <ImageIcon size={22} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-bold leading-6 text-dark">
                        {getName(item)}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                          isActive(item.is_active)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isActive(item.is_active) ? t.active : t.hidden}
                      </span>
                    </div>

                    {item.name_en && isRtl && (
                      <p className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                        {item.name_en}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                        {t.order}: {item.sort_order || 0}
                      </span>

                      {item.website_url && (
                        <a
                          href={item.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                          dir="ltr"
                        >
                          <Link2 size={12} />
                          <span className="max-w-[160px] truncate">
                            {item.website_url}
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
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
              <col className="w-[130px]" />
              <col className="w-[330px]" />
              <col className="w-[100px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
            </colgroup>

            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <TableHead isRtl={isRtl}>{t.partnerLogo}</TableHead>
                <TableHead isRtl={isRtl}>{t.partnerName}</TableHead>
                <TableHead isRtl={isRtl}>{t.order}</TableHead>
                <TableHead isRtl={isRtl}>{t.status}</TableHead>
                <TableHead isRtl={isRtl}>{t.actions}</TableHead>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    {t.loading}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    {t.noPartners}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 transition hover:bg-gray-50/70"
                  >
                    <td className="p-4">
                      {item.logo_url ? (
                        <img
                          src={resolveMediaUrl(item.logo_url)}
                          alt=""
                          className="h-14 w-20 rounded-lg border border-gray-100 bg-gray-50 object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-400">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-medium text-dark">
                      <div className="line-clamp-1">
                        {getName(item)}
                      </div>

                      {item.name_en && isRtl && (
                        <div className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                          {item.name_en}
                        </div>
                      )}

                      {item.website_url && (
                        <a
                          href={item.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"
                          dir="ltr"
                        >
                          <Link2 size={12} />
                          <span className="truncate">
                            {item.website_url}
                          </span>
                        </a>
                      )}
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
                        {isActive(item.is_active) ? t.active : t.hidden}
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
          <div className="modal-box w-[calc(100vw-24px)] max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <h2 className="text-lg font-bold text-dark sm:text-xl">
                {editId ? t.editPartner : t.addPartner}
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
                value={form.logo_url}
                onChange={(value) => updateForm('logo_url', value)}
                folder="partners"
                label={t.partnerLogo}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={`${t.partnerNameAr} *`}
                  value={form.name}
                  onChange={(value) => updateForm('name', value)}
                />

                <Field
                  label={t.partnerNameEn}
                  value={form.name_en}
                  onChange={(value) => updateForm('name_en', value)}
                  dir="ltr"
                />
              </div>

              <Field
                label={t.websiteUrl}
                value={form.website_url}
                onChange={(value) => updateForm('website_url', value)}
                dir="ltr"
                placeholder="https://..."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={t.order}
                  type="number"
                  value={form.sort_order}
                  onChange={(value) => updateForm('sort_order', value)}
                />

                <div className="flex items-end">
                  <label className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={!!form.is_active}
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
