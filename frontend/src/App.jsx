import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from 'react'
import { Toaster } from 'react-hot-toast'

import { translations } from './lib/i18n'
import api from './lib/api'
import {
  finishInitialLoading,
  useGlobalLoading,
} from './context/LoadingContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Preloader from './components/Preloader'

import Home from './pages/Home'
import About from './pages/About'
import News from './pages/News'
import Events from './pages/Events'
import Fields from './pages/Fields'
import HeritageLive from './pages/HeritageLive'
import Contact from './pages/Contact'
import PhotoGallery from './pages/PhotoGallery'
import VideoGallery from './pages/VideoGallery'
import EventCollections from './pages/EventCollections'

import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import ManageNews from './admin/ManageNews'
import ManageEvents from './admin/ManageEvents'
import ManageHeritage from './admin/ManageHeritage'
import ManageAdmins from './admin/ManageAdmins'
import ManageMessages from './admin/ManageMessages'
import Profile from './admin/Profile'
import ManagePartners from './admin/ManagePartners'
import ManageHero from './admin/ManageHero'
import ManageSettings from './admin/ManageSettings'
import ManageGallery from './admin/ManageGallery'

export const AppContext = createContext(null)

export const useLang = () => useContext(AppContext)


function getInitialLang() {
  const savedLang = localStorage.getItem('yhpo_lang')

  return savedLang === 'en' ? 'en' : 'ar'
}

function PublicLayout() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />
        <Route path="/events" element={<Events />} />
        <Route
          path="/events/:eventId/collections"
          element={<EventCollections />}
        />
        <Route path="/fields" element={<Fields />} />
        <Route
          path="/heritage-life"
          element={<HeritageLive />}
        />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/photo-gallery"
          element={<PhotoGallery />}
        />
        <Route
          path="/video-gallery"
          element={<VideoGallery />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </>
  )
}

function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          padding: '14px 18px',
          maxWidth: '420px',
          color: '#ffffff',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.22)',
        },
        success: {
          duration: 3000,
          style: {
            background: '#166534',
            color: '#ffffff',
            border: '1px solid #15803d',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            padding: '14px 18px',
            maxWidth: '420px',
            boxShadow:
              '0 10px 30px rgba(22, 101, 52, 0.28)',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#166534',
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
            fontWeight: '600',
            padding: '14px 18px',
            maxWidth: '420px',
            boxShadow:
              '0 10px 30px rgba(127, 29, 29, 0.28)',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#7f1d1d',
          },
        },
      }}
    />
  )
}


function BootstrapError({ lang, onRetry }) {
  const isArabic = lang === 'ar'

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-white px-6"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-xl">
        <h2 className="text-xl font-bold text-red-700">
          {isArabic
            ? 'تعذر تحميل الموقع'
            : 'Unable to load the website'}
        </h2>

        <p className="mt-3 text-sm leading-7 text-gray-600">
          {isArabic
            ? 'حدث خطأ أثناء تحميل البيانات. تحقق من الاتصال ثم أعد المحاولة.'
            : 'An error occurred while loading the data. Check the connection and try again.'}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-w-[160px] items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark"
        >
          {isArabic ? 'إعادة المحاولة' : 'Try again'}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState(getInitialLang)
  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] =
    useState(false)
  const [settingsError, setSettingsError] = useState(null)
  const [bootLoading, setBootLoading] = useState(true)
  const [bootError, setBootError] = useState(null)

  const { isLoading } = useGlobalLoading()

  const t = translations[lang]
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    localStorage.setItem('yhpo_lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    document.body.dir = dir
  }, [lang, dir])

  const toggleLang = () => {
    setLang((currentLang) =>
      currentLang === 'ar' ? 'en' : 'ar'
    )
  }

  const loadSettings = useCallback(async () => {
    const siteSettings = await api.get('/settings', {
      loadingLabel: 'site-settings',
    })

    setSettings(siteSettings)
    setSettingsError(null)

    return siteSettings
  }, [])

  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true)
    setSettingsError(null)

    try {
      return await loadSettings()
    } catch (error) {
      console.error(
        'Failed to refresh site settings:',
        error
      )

      setSettingsError(error)
      throw error
    } finally {
      setSettingsLoading(false)
    }
  }, [loadSettings])


  const bootstrapApp = useCallback(async () => {
    setBootLoading(true)
    setBootError(null)
    setSettingsError(null)

    try {
      // The router and current page are already mounted behind the global
      // preloader. Page-level GET requests are tracked automatically by
      // api.js, so App only loads shared site settings here.
      await loadSettings()
    } catch (error) {
      console.error('App bootstrap failed:', error)
      setBootError(error)
    } finally {
      setBootLoading(false)
      finishInitialLoading()
    }
  }, [loadSettings])

  useEffect(() => {
    bootstrapApp()
  }, [bootstrapApp])

  const contextValue = {
    lang,
    t,
    dir,
    toggleLang,
    settings,
    settingsLoading,
    settingsError,
    refreshSettings,
    bootLoading,
    bootError,
    retryBootstrap: bootstrapApp,
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div
        dir={dir}
        className={lang === 'ar' ? 'font-ar' : 'font-en'}
      >
        <BrowserRouter>
          <AppToaster />

          <Routes>
            <Route
              path="/admin/login"
              element={<AdminLogin />}
            />

            <Route
              path="/admin/*"
              element={<AdminLayout />}
            >
              <Route index element={<Dashboard />} />
              <Route path="news" element={<ManageNews />} />
              <Route
                path="events"
                element={<ManageEvents />}
              />
              <Route
                path="heritage"
                element={<ManageHeritage />}
              />
              <Route
                path="partners"
                element={<ManagePartners />}
              />
              <Route path="hero" element={<ManageHero />} />
              <Route
                path="settings"
                element={<ManageSettings />}
              />
              <Route
                path="admins"
                element={<ManageAdmins />}
              />
              <Route
                path="messages"
                element={<ManageMessages />}
              />
              <Route path="profile" element={<Profile />} />
              <Route
                path="gallery"
                element={<ManageGallery />}
              />
              <Route
                path="*"
                element={<Navigate to="/admin" replace />}
              />
            </Route>

            <Route path="/*" element={<PublicLayout />} />
          </Routes>
        </BrowserRouter>

        {isLoading && (
          <Preloader lang={lang} settings={settings} />
        )}

        {bootError && !isLoading && (
          <BootstrapError
            lang={lang}
            onRetry={bootstrapApp}
          />
        )}
      </div>
    </AppContext.Provider>
  )
}
