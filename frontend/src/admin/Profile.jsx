import { useState, useEffect } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  Save,
  Eye,
  EyeOff,
  User,
  Mail,
  Clock,
  CalendarDays,
  ShieldCheck,
  KeyRound,
} from 'lucide-react'
import { useAdminLang } from './adminI18n'

export default function Profile() {
  const { t, isRtl } = useAdminLang()

  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nameForm, setNameForm] = useState({ name: '' })
  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    new_password: '',
    confirm: '',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)

      try {
        const data = await api.get('/auth/me')
        setAdmin(data)
        setNameForm({ name: data?.name || '' })
      } catch {
        setAdmin(null)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleUpdateName = async (event) => {
    event.preventDefault()

    if (!nameForm.name.trim()) {
      toast.error(t.nameRequired || (isRtl ? 'الاسم مطلوب' : 'Name is required'))
      return
    }

    setSaving(true)

    try {
      await api.put('/profile', { name: nameForm.name.trim() })

      const updatedAdmin = {
        ...admin,
        name: nameForm.name.trim(),
      }

      setAdmin(updatedAdmin)
      localStorage.setItem('yhpo_admin', JSON.stringify(updatedAdmin))

      toast.success(t.nameUpdated)
    } catch (error) {
      toast.error(error?.message || (isRtl ? 'حدث خطأ' : 'Something went wrong'))
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()

    if (pwdForm.new_password !== pwdForm.confirm) {
      toast.error(t.passwordsNotMatch)
      return
    }

    if (pwdForm.new_password.length < 6) {
      toast.error(t.passwordShort)
      return
    }

    setSavingPwd(true)

    try {
      await api.put('/profile/password', {
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password,
      })

      toast.success(t.passwordChanged)

      setPwdForm({
        current_password: '',
        new_password: '',
        confirm: '',
      })

      setShowPwd(false)
    } catch (error) {
      toast.error(error?.message || (isRtl ? 'حدث خطأ' : 'Something went wrong'))
    } finally {
      setSavingPwd(false)
    }
  }

  const formatDate = (value) => {
    if (!value) return '—'

    try {
      return new Date(value).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')
    } catch {
      return '—'
    }
  }

  const formatDateTime = (value) => {
    if (!value) return '—'

    try {
      return new Date(value).toLocaleString(isRtl ? 'ar-YE' : 'en-US')
    } catch {
      return '—'
    }
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-dark md:text-3xl">
            {t.myProfile}
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500 md:text-base">
            {isRtl
              ? 'إدارة بيانات حسابك الشخصي وتحديث كلمة المرور'
              : 'Manage your account information and update your password'}
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
          <ShieldCheck size={16} />
          <span>{isRtl ? 'حساب إداري' : 'Admin Account'}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-gray-400 shadow-sm">
          {t.loading}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <User size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold text-dark">
                      {t.accountInfo}
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-400">
                      {isRtl ? 'معلومات الحساب الأساسية' : 'Basic account details'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InfoCard
                    icon={<Mail size={18} />}
                    label={t.email}
                    value={admin?.email || '—'}
                    dir="ltr"
                  />

                  <InfoCard
                    icon={<Clock size={18} />}
                    label={t.lastLogin}
                    value={formatDateTime(admin?.last_login)}
                  />

                  <InfoCard
                    icon={<CalendarDays size={18} />}
                    label={t.createdAt}
                    value={formatDate(admin?.created_at)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="font-bold text-dark">
                  {isRtl ? 'تحديث الاسم' : 'Update Name'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {isRtl
                    ? 'يمكنك تعديل الاسم الظاهر في لوحة الإدارة.'
                    : 'You can update the display name used in the admin dashboard.'}
                </p>
              </div>

              <form
                onSubmit={handleUpdateName}
                className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {t.name}
                  </label>

                  <input
                    type="text"
                    value={nameForm.name}
                    onChange={(event) =>
                      setNameForm({ name: event.target.value })
                    }
                    className="input-field h-12 w-full"
                    placeholder={t.name}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary h-12 w-full justify-center px-5 md:w-auto"
                  >
                    <Save size={16} />
                    {saving ? '...' : t.save}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <KeyRound size={20} />
              </div>

              <div>
                <h2 className="font-bold text-dark">
                  {t.changePassword}
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  {isRtl
                    ? 'استخدم كلمة مرور قوية للحفاظ على أمان الحساب.'
                    : 'Use a strong password to keep your account secure.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <PasswordField
                label={t.currentPassword}
                value={pwdForm.current_password}
                onChange={(value) =>
                  setPwdForm({
                    ...pwdForm,
                    current_password: value,
                  })
                }
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  {t.newPassword}
                </label>

                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwdForm.new_password}
                    onChange={(event) =>
                      setPwdForm({
                        ...pwdForm,
                        new_password: event.target.value,
                      })
                    }
                    className={`input-field h-12 w-full ${
                      isRtl ? 'ps-10' : 'pe-10'
                    }`}
                    dir="ltr"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPwd((current) => !current)}
                    className={`absolute top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-primary ${
                      isRtl ? 'start-3' : 'end-3'
                    }`}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <PasswordField
                label={t.confirmPassword}
                value={pwdForm.confirm}
                onChange={(value) =>
                  setPwdForm({
                    ...pwdForm,
                    confirm: value,
                  })
                }
              />

              <button
                type="submit"
                disabled={savingPwd}
                className="btn-primary h-12 w-full justify-center"
              >
                <Save size={16} />
                {savingPwd ? t.changingPassword : t.changePassword}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCard({ icon, label, value, dir }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-primary">
        {icon}
      </div>

      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </div>

      <div
        className="mt-1 break-words text-sm font-semibold leading-6 text-dark"
        dir={dir || undefined}
      >
        {value}
      </div>
    </div>
  )
}

function PasswordField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-field h-12 w-full"
        dir="ltr"
      />
    </div>
  )
}
