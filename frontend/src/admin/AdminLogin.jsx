import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Globe,
} from 'lucide-react'

const TEXT = {
  ar: {
    title: 'تسجيل الدخول',
    subtitle: 'لوحة إدارة منظمة تراث اليمن لأجل السلام',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    emailPlaceholder: 'أدخل البريد الإلكتروني',
    passwordPlaceholder: 'أدخل كلمة المرور',
    submit: 'تسجيل الدخول',
    loading: 'جارٍ التحقق...',
    back: 'العودة إلى الموقع',
    switchLang: 'English',
    success: 'مرحباً! تم تسجيل الدخول بنجاح',
    error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  },
  en: {
    title: 'Admin Login',
    subtitle: 'Yemen Heritage for Peace Organization Admin Panel',
    email: 'Email Address',
    password: 'Password',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    submit: 'Login',
    loading: 'Verifying...',
    back: 'Back to Website',
    switchLang: 'عربي',
    success: 'Welcome! Logged in successfully',
    error: 'Incorrect email or password',
  },
}

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uiLang, setUiLang] = useState('ar')

  const navigate = useNavigate()
  const txt = TEXT[uiLang]
  const isRtl = uiLang === 'ar'

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await api.post('/auth/login', form)

      localStorage.setItem('yhpo_token', data.token)
      localStorage.setItem('yhpo_admin', JSON.stringify(data.admin))

      toast.success(txt.success, {
        duration: 3000,
        style: {
          background: '#ffffff',
          color: '#0d7a91',
          border: '2px solid #18a2be',
          borderRadius: '12px',
          fontSize: '14px',
          padding: '14px 18px',
          boxShadow: '0 4px 12px rgba(24, 162, 190, 0.15)',
        },
        iconTheme: { primary: '#0d7a91', secondary: '#fff' },
      })

      navigate('/admin')
    } catch (err) {
      toast.error(err?.message || txt.error, {
        duration: 4000,
        style: {
          background: '#ffffff',
          color: '#991b1b',
          border: '2px solid #dc2626',
          borderRadius: '12px',
          fontSize: '14px',
          padding: '14px 18px',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
        },
        iconTheme: { primary: '#991b1b', secondary: '#fff' },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 flex items-center justify-center px-4 py-8"
      style={{
        fontFamily: isRtl
          ? "'Noto Kufi Arabic', sans-serif"
          : "'Inter', 'Exo 2', sans-serif",
      }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <button
            type="button"
            onClick={() => setUiLang((lang) => (lang === 'ar' ? 'en' : 'ar'))}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-md transition hover:border-primary hover:shadow-lg"
          >
            <span>{txt.switchLang}</span>
            <Globe size={15} className="text-primary" />
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl border border-primary/10">
          <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-8 sm:px-8 text-center">
            <img
              src="/logowhite.png"
              alt="Yemen Heritage for Peace"
              className="mx-auto mb-4 h-14 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />

            <h1 className="text-2xl font-bold text-white">{txt.title}</h1>

            <p className="mt-2 text-sm leading-7 text-white/90">
              {txt.subtitle}
            </p>
          </div>

          <div className="px-6 py-7 sm:px-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  className={`mb-2 block text-sm font-semibold text-slate-700 ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                >
                  {txt.email}
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-primary ${
                      isRtl ? 'right-4' : 'left-4'
                    }`}
                  />

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder={txt.emailPlaceholder}
                    dir="ltr"
                    required
                    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-sm text-slate-800 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/20 ${
                      isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`mb-2 block text-sm font-semibold text-slate-700 ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                >
                  {txt.password}
                </label>

                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder={txt.passwordPlaceholder}
                    dir="ltr"
                    required
                    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-sm text-slate-800 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/20 ${
                      isRtl ? 'pl-12 pr-4 text-right' : 'pr-12 pl-4 text-left'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPwd((state) => !state)}
                    className={`absolute top-1/2 -translate-y-1/2 text-primary transition hover:text-primary-dark ${
                      isRtl ? 'left-4' : 'right-4'
                    }`}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ width: '50%' }}
                >
                  {loading ? txt.loading : txt.submit}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-primary"
          >
            {isRtl ? (
              <ArrowRight size={15} className="text-primary" />
            ) : (
              <ArrowLeft size={15} className="text-primary" />
            )}

            {txt.back}
          </Link>
        </div>
      </div>
    </div>
  )
}
