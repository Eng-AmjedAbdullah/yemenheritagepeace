import { useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  CalendarClock,
  Edit,
  Key,
  Mail,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react'

import api from '../lib/api'
import AdminModal from './AdminModal'
import ValidatedField from './ValidatedField'
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
  success: { duration: 3000, style: { background: '#166534', color: '#fff' } },
  error: { duration: 4500, style: { background: '#7f1d1d', color: '#fff' } },
}

function safeStoredAdmin() {
  try {
    return JSON.parse(localStorage.getItem('yhpo_admin') || 'null')
  } catch {
    return null
  }
}

function isActiveAccount(value) {
  return value === 1 || value === true || value === '1'
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validatePassword(value) {
  return Boolean(value) && value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)
}

function validateForm(form, mode, isRtl, editId, me) {
  const errors = {}
  const name = form.name.trim()
  const email = form.email.trim().toLowerCase()

  if (mode !== 'password') {
    if (name.length < 2) {
      errors.name = isRtl
        ? 'الاسم مطلوب ويجب أن يكون حرفين على الأقل'
        : 'Name is required and must be at least 2 characters'
    }

    if (!email) {
      errors.email = isRtl ? 'البريد الإلكتروني مطلوب' : 'Email is required'
    } else if (!validateEmail(email)) {
      errors.email = isRtl ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email address'
    }

    if (!['admin', 'super_admin'].includes(form.role)) {
      errors.role = isRtl ? 'الصلاحية غير صحيحة' : 'Invalid role'
    }
  }

  if (mode === 'add' || mode === 'password') {
    if (!validatePassword(form.password)) {
      errors.password = isRtl
        ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف وأرقام'
        : 'Password must be at least 8 characters and include letters and numbers'
    }

    if (form.password !== form.confirm_password) {
      errors.confirm_password = isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'
    }
  }

  if (mode === 'edit' && Number(editId) === Number(me?.id)) {
    if (me?.role === 'super_admin' && form.role !== 'super_admin') {
      errors.role = isRtl
        ? 'لا يمكنك تخفيض صلاحيات حسابك الرئيسي'
        : 'You cannot demote your own super-admin account'
    }
    if (!isActiveAccount(form.is_active)) {
      errors.is_active = isRtl
        ? 'لا يمكنك إيقاف حسابك الخاص'
        : 'You cannot deactivate your own account'
    }
  }

  return errors
}

export default function ManageAdmins() {
  const { t, isRtl, admin } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)
  const me = admin || safeStoredAdmin()

  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [touched, setTouched] = useState({})
  const [submitError, setSubmitError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/admins', { loadingLabel: 'admin-users' })
      setAdmins(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load admins:', error)
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const errors = useMemo(
    () => validateForm(form, modal, isRtl, editId, me),
    [form, modal, isRtl, editId, me]
  )
  const hasErrors = modal ? Object.keys(errors).length > 0 : false

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setTouched((current) => ({ ...current, [key]: true }))
    setSubmitError('')
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setTouched({})
    setSubmitError('')
    setEditId(null)
  }

  const closeModal = () => {
    setModal(null)
    resetForm()
  }

  const openAdd = () => {
    resetForm()
    setModal('add')
  }

  const openEdit = (item) => {
    setEditId(item.id)
    setForm({
      name: item.name || '',
      email: item.email || '',
      password: '',
      confirm_password: '',
      role: item.role || 'admin',
      is_active: isActiveAccount(item.is_active) ? 1 : 0,
    })
    setTouched({})
    setSubmitError('')
    setModal('edit')
  }

  const openPassword = (item) => {
    setEditId(item.id)
    setForm({ ...INITIAL_FORM, name: item.name || '' })
    setTouched({})
    setSubmitError('')
    setModal('password')
  }

  const touchRelevant = () => {
    if (modal === 'password') {
      setTouched({ password: true, confirm_password: true })
    } else {
      setTouched({
        name: true,
        email: true,
        password: modal === 'add',
        confirm_password: modal === 'add',
        role: true,
        is_active: modal === 'edit',
      })
    }
  }

  const handleSave = async () => {
    touchRelevant()
    if (hasErrors || saving) return

    setSaving(true)
    setSubmitError('')

    try {
      if (modal === 'add') {
        await api.post(
          '/admins',
          {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
            role: form.role,
          },
          { globalLoading: false, loadingLabel: 'create-admin' }
        )
      } else if (modal === 'edit') {
        await api.put(
          `/admins/${editId}`,
          {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            role: form.role,
            is_active: isActiveAccount(form.is_active) ? 1 : 0,
          },
          { globalLoading: false, loadingLabel: 'update-admin' }
        )
      } else if (modal === 'password') {
        await api.put(
          `/admins/${editId}/password`,
          { password: form.password },
          { globalLoading: false, loadingLabel: 'change-admin-password' }
        )
      }

      toast.success(
        modal === 'password'
          ? isRtl
            ? 'تم تغيير كلمة المرور'
            : 'Password changed'
          : modal === 'edit'
            ? isRtl
              ? 'تم تحديث المشرف'
              : 'Administrator updated'
            : isRtl
              ? 'تمت إضافة المشرف'
              : 'Administrator added',
        toastTheme.success
      )

      await load()
      closeModal()
    } catch (error) {
      const message = error?.message || (isRtl ? 'تعذر الحفظ' : 'Save failed')
      setSubmitError(message)
      toast.error(message, toastTheme.error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (Number(item.id) === Number(me?.id)) {
      toast.error(
        isRtl ? 'لا يمكنك حذف حسابك الخاص' : 'You cannot delete your own account',
        toastTheme.error
      )
      return
    }

    const confirmed = await requestConfirm({
      title: isRtl ? 'حذف المشرف' : 'Delete administrator',
      message: isRtl
        ? `سيتم حذف حساب «${item.name || item.email}» نهائيًا.`
        : `“${item.name || item.email}” will be permanently deleted.`,
      variant: 'danger',
      confirmText: t.delete || (isRtl ? 'حذف' : 'Delete'),
    })
    if (!confirmed) return

    try {
      await api.delete(`/admins/${item.id}`, null, {
        globalLoading: false,
        loadingLabel: 'delete-admin',
      })
      toast.success(isRtl ? 'تم حذف المشرف' : 'Administrator deleted', toastTheme.success)
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
          <h1 className="flex items-center gap-2 text-2xl font-bold text-dark sm:text-3xl">
            <ShieldCheck className="text-primary" />
            {t.manageAdmins || (isRtl ? 'إدارة المشرفين' : 'Manage Administrators')}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isRtl
              ? 'إدارة حسابات المشرفين والصلاحيات وحالة الحساب.'
              : 'Manage administrator accounts, roles, and status.'}
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary">
          <UserPlus size={17} />
          {t.addAdmin || (isRtl ? 'إضافة مشرف' : 'Add Administrator')}
        </button>
      </div>

      {admins.length === 0 ? (
        <EmptyState text={isRtl ? 'لا يوجد مشرفون' : 'No administrators found'} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {admins.map((item) => {
            const active = isActiveAccount(item.is_active)
            const isMe = Number(item.id) === Number(me?.id)

            return (
              <article key={item.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.role === 'super_admin' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                    {item.role === 'super_admin' ? <ShieldCheck size={23} /> : <Shield size={23} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-dark">{item.name || '—'}</h2>
                      {isMe && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{isRtl ? 'أنت' : 'You'}</span>}
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-500"><Mail size={14} />{item.email || '—'}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-gray-400"><CalendarClock size={14} />{formatLastLogin(item.last_login, isRtl)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'متوقف' : 'Inactive')}</span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{item.role === 'super_admin' ? (isRtl ? 'مشرف رئيسي' : 'Super Admin') : (isRtl ? 'مشرف' : 'Admin')}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button type="button" onClick={() => openEdit(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-600"><Edit size={15} />{t.edit || (isRtl ? 'تعديل' : 'Edit')}</button>
                  <button type="button" onClick={() => openPassword(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-600"><Key size={15} />{isRtl ? 'كلمة المرور' : 'Password'}</button>
                  {!isMe && <button type="button" onClick={() => handleDelete(item)} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 sm:col-span-1"><Trash2 size={15} />{t.delete || (isRtl ? 'حذف' : 'Delete')}</button>}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <AdminModal
        open={Boolean(modal)}
        title={getModalTitle(modal, isRtl)}
        subtitle={isRtl ? 'يتم التحقق من البيانات مباشرة قبل الحفظ.' : 'Data is validated in realtime before saving.'}
        icon={modal === 'password' ? Key : UserPlus}
        isRtl={isRtl}
        size="compact"
        onClose={closeModal}
        closeDisabled={saving}
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeModal} disabled={saving} className="btn-outline min-w-32 justify-center">{t.cancel || (isRtl ? 'إلغاء' : 'Cancel')}</button>
            <button type="button" onClick={handleSave} disabled={saving || hasErrors} className="btn-primary min-w-36 justify-center">{saving ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : modal === 'password' ? (isRtl ? 'تغيير كلمة المرور' : 'Change Password') : (t.save || (isRtl ? 'حفظ' : 'Save'))}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {modal !== 'password' && (
            <>
              <ValidatedField label={isRtl ? 'الاسم الكامل' : 'Full name'} value={form.name} onChange={(value) => update('name', value)} error={errors.name} touched={touched.name} required />
              <ValidatedField label={isRtl ? 'البريد الإلكتروني' : 'Email'} value={form.email} onChange={(value) => update('email', value)} error={errors.email} touched={touched.email} required type="email" dir="ltr" placeholder="admin@example.com" />
            </>
          )}

          {(modal === 'add' || modal === 'password') && (
            <>
              <ValidatedField label={isRtl ? 'كلمة المرور' : 'Password'} value={form.password} onChange={(value) => update('password', value)} error={errors.password} touched={touched.password} required type="password" dir="ltr" hint={isRtl ? '8 أحرف على الأقل، وتحتوي على حروف وأرقام.' : 'At least 8 characters with letters and numbers.'} />
              <ValidatedField label={isRtl ? 'تأكيد كلمة المرور' : 'Confirm password'} value={form.confirm_password} onChange={(value) => update('confirm_password', value)} error={errors.confirm_password} touched={touched.confirm_password} required type="password" dir="ltr" />
            </>
          )}

          {modal !== 'password' && (
            <ValidatedField label={isRtl ? 'الصلاحية' : 'Role'} value={form.role} onChange={(value) => update('role', value)} error={errors.role} touched={touched.role} as="select" options={[{ value: 'admin', label: isRtl ? 'مشرف' : 'Admin' }, { value: 'super_admin', label: isRtl ? 'مشرف رئيسي' : 'Super Admin' }]} />
          )}

          {modal === 'edit' && (
            <div>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <input type="checkbox" checked={isActiveAccount(form.is_active)} onChange={(event) => update('is_active', event.target.checked ? 1 : 0)} className="h-5 w-5 accent-primary" />
                <span className="text-sm font-bold text-gray-700">{isRtl ? 'الحساب نشط' : 'Account is active'}</span>
              </label>
              {touched.is_active && errors.is_active && <p className="mt-2 text-xs font-bold text-red-600">{errors.is_active}</p>}
            </div>
          )}

          {submitError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{submitError}</p>}
        </div>
      </AdminModal>
    </div>
  )
}

function getModalTitle(mode, isRtl) {
  if (mode === 'add') return isRtl ? 'إضافة مشرف' : 'Add Administrator'
  if (mode === 'edit') return isRtl ? 'تعديل المشرف' : 'Edit Administrator'
  if (mode === 'password') return isRtl ? 'تغيير كلمة المرور' : 'Change Password'
  return ''
}

function formatLastLogin(value, isRtl) {
  if (!value) return isRtl ? 'لم يسجل الدخول بعد' : 'Never logged in'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">{text}</div>
}
