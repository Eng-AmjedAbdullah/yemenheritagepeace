import { useContext, useEffect, useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  Trash2,
  Edit,
  X,
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Mail,
  CalendarClock,
} from 'lucide-react'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  confirm_password: '',
  role: 'admin',
  is_active: 1,
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

function safeStoredAdmin() {
  try {
    return JSON.parse(localStorage.getItem('yhpo_admin') || 'null')
  } catch {
    return null
  }
}

function isActiveAccount(value) {
  return value === 1 || value === true
}

export default function ManageAdmins() {
  const { t, isRtl, admin } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const me = admin || safeStoredAdmin()

  const load = async () => {
    setLoading(true)

    try {
      const data = await api.get('/admins')
      setAdmins(Array.isArray(data) ? data : [])
    } catch {
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function validatePassword(password) {
    return (
      !!password &&
      password.length >= 8 &&
      /[A-Za-z]/.test(password) &&
      /\d/.test(password)
    )
  }

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setEditId(null)
    setFormErrors({})
  }

  const handleAdd = async () => {
    const name = (form.name || '').trim()
    const email = (form.email || '').toLowerCase().trim()
    const password = form.password || ''
    const confirmPassword = form.confirm_password || ''
    const role = form.role

    const errors = {}

    if (!name || name.length < 2) {
      errors.name = isRtl
        ? 'الاسم مطلوب ويجب أن يكون حرفين على الأقل'
        : 'Name is required and must be at least 2 characters'
    }

    if (!email) {
      errors.email = t.emailRequired || (isRtl ? 'البريد الإلكتروني مطلوب' : 'Email is required')
    } else if (!validateEmail(email)) {
      errors.email = isRtl ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email address'
    }

    if (!validatePassword(password)) {
      errors.password = isRtl
        ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام'
        : 'Password must be at least 8 characters and include letters and numbers'
    }

    if (password !== confirmPassword) {
      errors.confirm = isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'
    }

    if (!['admin', 'super_admin'].includes(role)) {
      errors.role = isRtl ? 'صلاحية غير مسموح بها' : 'Invalid role'
    }

    setFormErrors(errors)
    if (Object.keys(errors).length) return
    if (saving) return

    setSaving(true)

    try {
      await api.post('/admins', {
        name,
        email,
        password,
        role,
      })

      toast.success(t.added || (isRtl ? 'تمت الإضافة بنجاح' : 'Added successfully'), toastTheme.success)

      await load()
      setModal(null)
      resetForm()
    } catch (error) {
      setFormErrors({ submit: error?.message })
      toast.error(error?.message || (isRtl ? 'حدث خطأ' : 'Something went wrong'), toastTheme.error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    const name = (form.name || '').trim()
    const email = (form.email || '').toLowerCase().trim()
    const role = form.role
    const is_active = form.is_active

    const errors = {}

    if (!name || name.length < 2) {
      errors.name = isRtl
        ? 'الاسم مطلوب'
        : 'Name is required'
    }

    if (!email) {
      errors.email = t.emailRequired || (isRtl ? 'البريد الإلكتروني مطلوب' : 'Email is required')
    } else if (!validateEmail(email)) {
      errors.email = isRtl ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email address'
    }

    if (!['admin', 'super_admin'].includes(role)) {
      errors.role = isRtl ? 'صلاحية غير مسموح بها' : 'Invalid role'
    }

    if (editId === me?.id) {
      if (me.role === 'super_admin' && role !== 'super_admin') {
        errors.role = isRtl
          ? 'لا يمكنك تخفيض صلاحيات حسابك الرئيسي'
          : 'You cannot demote your own super admin account'
      }

      if (is_active !== 1) {
        errors.is_active = isRtl
          ? 'لا يمكنك إيقاف حسابك الخاص'
          : 'You cannot deactivate your own account'
      }
    }

    setFormErrors(errors)
    if (Object.keys(errors).length) return
    if (saving) return

    setSaving(true)

    try {
      await api.put(`/admins/${editId}`, {
        name,
        email,
        role,
        is_active,
      })

      toast.success(t.saved || (isRtl ? 'تم الحفظ بنجاح' : 'Saved successfully'), toastTheme.success)

      await load()
      setModal(null)
      resetForm()
    } catch (error) {
      setFormErrors({ submit: error?.message })
      toast.error(error?.message || (isRtl ? 'حدث خطأ' : 'Something went wrong'), toastTheme.error)
    } finally {
      setSaving(false)
    }
  }

  const handlePassword = async () => {
    const password = form.password || ''
    const confirmPassword = form.confirm_password || ''

    const errors = {}

    if (!validatePassword(password)) {
      errors.password = isRtl
        ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام'
        : 'Password must be at least 8 characters and include letters and numbers'
    }

    if (password !== confirmPassword) {
      errors.confirm = isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'
    }

    setFormErrors(errors)
    if (Object.keys(errors).length) return
    if (saving) return

    setSaving(true)

    try {
      await api.put(`/admins/${editId}/password`, { password })

      toast.success(
        t.passwordChanged || (isRtl ? 'تم تغيير كلمة المرور' : 'Password changed'),
        toastTheme.success
      )

      setModal(null)
      resetForm()
    } catch (error) {
      setFormErrors({ submit: error?.message })
      toast.error(error?.message || (isRtl ? 'حدث خطأ' : 'Something went wrong'), toastTheme.error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (id === me?.id) {
      toast.error(
        t.cannotDeleteSelf || (isRtl ? 'لا يمكنك حذف حسابك الخاص' : 'You cannot delete your own account'),
        toastTheme.error
      )
      return
    }

    const confirmed = await requestConfirm({
      title: isRtl ? 'تأكيد حذف المشرف' : 'Delete administrator?',
      message: isRtl
        ? 'سيتم حذف هذا الحساب الإداري نهائياً.'
        : 'This administrator account will be permanently removed.',
      variant: 'danger',
      confirmText: t.delete,
    })

    if (!confirmed) return

    try {
      await api.delete(`/admins/${id}`)

      toast.success(t.deleted || (isRtl ? 'تم الحذف' : 'Deleted'), toastTheme.success)

      await load()
    } catch (error) {
      toast.error(error?.message || (isRtl ? 'حدث خطأ أثناء الحذف' : 'Failed to delete'), toastTheme.error)
    }
  }

  const openAdd = () => {
    setForm(INITIAL_FORM)
    setEditId(null)
    setFormErrors({})
    setModal('add')
  }

  const openEdit = (adminItem) => {
    setForm({
      name: adminItem.name || '',
      email: adminItem.email || '',
      password: '',
      confirm_password: '',
      role: adminItem.role || 'admin',
      is_active: isActiveAccount(adminItem.is_active) ? 1 : 0,
    })

    setEditId(adminItem.id)
    setFormErrors({})
    setModal('edit')
  }

  const openPassword = (adminItem) => {
    setForm({
      ...INITIAL_FORM,
      password: '',
      confirm_password: '',
    })

    setEditId(adminItem.id)
    setFormErrors({})
    setModal('password')
  }

  const closeModal = () => {
    setModal(null)
    resetForm()
  }

  const formatLastLogin = (value) => {
    if (!value) return t.neverLoggedIn

    try {
      return new Date(value).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')
    } catch {
      return t.neverLoggedIn
    }
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-dark md:text-3xl">
            {t.manageAdmins}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isRtl
              ? 'إدارة المشرفين والصلاحيات وحالة الحسابات'
              : 'Manage administrators, roles, and account status'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="btn-primary w-full justify-center sm:w-auto"
        >
          <UserPlus size={16} />
          {t.addAdmin}
        </button>
      </div>

      <div className="md:hidden">
        {loading ? (
          <EmptyState text={t.loading} />
        ) : admins.length === 0 ? (
          <EmptyState text={isRtl ? 'لا يوجد مشرفون' : 'No administrators found'} />
        ) : (
          <div className="space-y-3">
            {admins.map((adminItem) => {
              const active = isActiveAccount(adminItem.is_active)
              const isMe = adminItem.id === me?.id

              return (
                <div
                  key={adminItem.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {adminItem.role === 'super_admin' ? (
                          <ShieldCheck size={16} className="shrink-0 text-primary" />
                        ) : (
                          <Shield size={16} className="shrink-0 text-gray-400" />
                        )}

                        <h3 className="truncate text-base font-bold text-dark">
                          {adminItem.name || '—'}
                        </h3>

                        {isMe && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {t.you}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-gray-500" dir="ltr">
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate">{adminItem.email || '—'}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <CalendarClock size={14} />
                        <span>{formatLastLogin(adminItem.last_login)}</span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                        active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {active ? t.active : t.inactive}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        adminItem.role === 'super_admin'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {adminItem.role === 'super_admin'
                        ? isRtl
                          ? 'مشرف رئيسي'
                          : 'Super Admin'
                        : isRtl
                          ? 'مشرف'
                          : 'Admin'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(adminItem)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600"
                    >
                      <Edit size={15} />
                      {t.edit}
                    </button>

                    <button
                      type="button"
                      onClick={() => openPassword(adminItem)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-600"
                    >
                      <Key size={15} />
                      {t.changePassword}
                    </button>

                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => handleDelete(adminItem.id)}
                        className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                      >
                        <Trash2 size={15} />
                        {t.delete}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
        <div className="overflow-x-auto p-4 md:p-6">
          <table className="w-full min-w-[820px] table-fixed text-sm">
            <colgroup>
              <col className="w-[190px]" />
              <col className="w-[230px]" />
              <col className="w-[130px]" />
              <col className="w-[110px]" />
              <col className="w-[150px]" />
              <col className="w-[140px]" />
            </colgroup>

            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <TableHead isRtl={isRtl}>{t.name}</TableHead>
                <TableHead isRtl={isRtl}>{t.email}</TableHead>
                <TableHead isRtl={isRtl}>{t.role}</TableHead>
                <TableHead isRtl={isRtl}>{t.status}</TableHead>
                <TableHead isRtl={isRtl}>{t.lastLogin}</TableHead>
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
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    {isRtl ? 'لا يوجد مشرفون' : 'No administrators found'}
                  </td>
                </tr>
              ) : (
                admins.map((adminItem) => {
                  const active = isActiveAccount(adminItem.is_active)
                  const isMe = adminItem.id === me?.id

                  return (
                    <tr
                      key={adminItem.id}
                      className="border-b border-gray-50 transition hover:bg-gray-50/70"
                    >
                      <td className="p-4 font-medium text-dark">
                        <div className="flex min-w-0 items-center gap-2">
                          {adminItem.role === 'super_admin' ? (
                            <ShieldCheck size={14} className="shrink-0 text-primary" />
                          ) : (
                            <Shield size={14} className="shrink-0 text-gray-400" />
                          )}

                          <span className="truncate">
                            {adminItem.name || '—'}
                          </span>

                          {isMe && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                              {t.you}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-gray-500" dir="ltr">
                        <div className="truncate">{adminItem.email || '—'}</div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            adminItem.role === 'super_admin'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {adminItem.role === 'super_admin'
                            ? isRtl
                              ? 'رئيسي'
                              : 'Super Admin'
                            : isRtl
                              ? 'مشرف'
                              : 'Admin'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {active ? t.active : t.inactive}
                        </span>
                      </td>

                      <td className="p-4 text-xs text-gray-400">
                        {formatLastLogin(adminItem.last_login)}
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(adminItem)}
                            className="rounded-lg p-2 text-blue-500 transition hover:bg-blue-50"
                            title={t.edit}
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openPassword(adminItem)}
                            className="rounded-lg p-2 text-amber-500 transition hover:bg-amber-50"
                            title={t.changePassword}
                          >
                            <Key size={15} />
                          </button>

                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => handleDelete(adminItem.id)}
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                              title={t.delete}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'add' && (
        <AdminModal
          title={t.addNewAdmin}
          onClose={closeModal}
          isRtl={isRtl}
        >
          <AdminForm
            type="add"
            form={form}
            setForm={setForm}
            formErrors={formErrors}
            t={t}
            isRtl={isRtl}
          />

          <ModalActions>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="btn-primary w-full justify-center sm:w-auto"
            >
              <UserPlus size={16} />
              {saving ? '...' : t.add}
            </button>

            <button
              type="button"
              onClick={closeModal}
              className="btn-outline w-full justify-center sm:w-auto"
            >
              {t.cancel}
            </button>
          </ModalActions>
        </AdminModal>
      )}

      {modal === 'edit' && (
        <AdminModal
          title={t.editAdmin}
          onClose={closeModal}
          isRtl={isRtl}
        >
          <AdminForm
            type="edit"
            form={form}
            setForm={setForm}
            formErrors={formErrors}
            t={t}
            isRtl={isRtl}
          />

          <ModalActions>
            <button
              type="button"
              onClick={handleEdit}
              disabled={saving}
              className="btn-primary w-full justify-center sm:w-auto"
            >
              <Edit size={16} />
              {saving ? '...' : t.save}
            </button>

            <button
              type="button"
              onClick={closeModal}
              className="btn-outline w-full justify-center sm:w-auto"
            >
              {t.cancel}
            </button>
          </ModalActions>
        </AdminModal>
      )}

      {modal === 'password' && (
        <AdminModal
          title={t.changePassword}
          onClose={closeModal}
          isRtl={isRtl}
        >
          <div className="space-y-4 p-4 sm:p-6">
            <PasswordField
              label={t.newPassword}
              value={form.password}
              onChange={(value) => updateForm('password', value)}
              placeholder={t.min8Chars}
              error={formErrors.password}
            />

            <PasswordField
              label={t.confirmPassword || (isRtl ? 'تأكيد كلمة المرور' : 'Confirm password')}
              value={form.confirm_password}
              onChange={(value) => updateForm('confirm_password', value)}
              placeholder={t.min8Chars}
              error={formErrors.confirm}
            />

            {formErrors.submit && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {formErrors.submit}
              </div>
            )}
          </div>

          <ModalActions>
            <button
              type="button"
              onClick={handlePassword}
              disabled={saving}
              className="btn-primary w-full justify-center sm:w-auto"
            >
              <Key size={16} />
              {saving ? '...' : t.changePassword}
            </button>

            <button
              type="button"
              onClick={closeModal}
              className="btn-outline w-full justify-center sm:w-auto"
            >
              {t.cancel}
            </button>
          </ModalActions>
        </AdminModal>
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

function AdminModal({ title, children, onClose, isRtl }) {
  return (
    <div
      className="modal-overlay"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="modal-box w-[calc(100vw-24px)] max-w-md max-h-[90vh] overflow-y-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between border-b p-4 sm:p-6">
          <h2 className="text-lg font-bold text-dark sm:text-xl">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition hover:text-gray-600"
            aria-label={isRtl ? 'إغلاق' : 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

function ModalActions({ children }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:p-6">
      {children}
    </div>
  )
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  dir,
  placeholder,
  error,
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

      {error && (
        <div className="mt-1 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  )
}

function PasswordField({ label, value, onChange, placeholder, error }) {
  return (
    <TextInput
      label={label}
      type="password"
      value={value}
      onChange={onChange}
      dir="ltr"
      placeholder={placeholder}
      error={error}
    />
  )
}

function AdminForm({ type, form, setForm, formErrors, t, isRtl }) {
  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <TextInput
        label={t.name}
        value={form.name}
        onChange={(value) => update('name', value)}
        placeholder={t.fullName}
        error={formErrors.name}
      />

      <TextInput
        label={`${t.email} *`}
        type="email"
        value={form.email}
        onChange={(value) => update('email', value)}
        dir="ltr"
        placeholder="admin@example.com"
        error={formErrors.email}
      />

      {type === 'add' && (
        <>
          <PasswordField
            label={`${t.password} *`}
            value={form.password}
            onChange={(value) => update('password', value)}
            placeholder={t.min8Chars}
            error={formErrors.password}
          />

          <PasswordField
            label={t.confirmPassword || (isRtl ? 'تأكيد كلمة المرور' : 'Confirm password')}
            value={form.confirm_password}
            onChange={(value) => update('confirm_password', value)}
            placeholder={t.min8Chars}
            error={formErrors.confirm}
          />
        </>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t.role}
        </label>

        <select
          value={form.role}
          onChange={(event) => update('role', event.target.value)}
          className="input-field"
        >
          <option value="admin">
            {isRtl ? 'مشرف عادي' : 'Admin'}
          </option>
          <option value="super_admin">
            {isRtl ? 'مشرف رئيسي' : 'Super Admin'}
          </option>
        </select>

        {formErrors.role && (
          <div className="mt-1 text-xs text-red-500">
            {formErrors.role}
          </div>
        )}
      </div>

      {type === 'edit' && (
        <>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 py-3">
            <input
              type="checkbox"
              checked={form.is_active === 1}
              onChange={(event) => update('is_active', event.target.checked ? 1 : 0)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm text-gray-700">
              {t.activeAccount}
            </span>
          </label>

          {formErrors.is_active && (
            <div className="text-xs text-red-500">
              {formErrors.is_active}
            </div>
          )}
        </>
      )}

      {formErrors.submit && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {formErrors.submit}
        </div>
      )}
    </div>
  )
}
