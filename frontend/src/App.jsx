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

const DEFAULT_SETTINGS = {
  site_name_ar: 'منظمة تراث اليمن لأجل السلام',
  site_name_en: 'Yemen Heritage for Peace Organization',
  logo_url: '/logo.png',
  contact_phone: '',
  contact_email: '',
  address_ar: '',
  address_en: '',
  home_about_image_url: '',
  home_about_image_alt_ar: '',
  home_about_image_alt_en: '',
}

function getInitialLang() {
  const savedLang = localStorage.getItem('yhpo_lang')

  return savedLang === 'en' ? 'en' : 'ar'
}

function normalizeSettings(value) {
  const loadedSettings =
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
      ? value
      : {}

  return {
    ...DEFAULT_SETTINGS,
    ...loadedSettings,
  }
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

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
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
          boxShadow:
            '0 10px 30px rgba(0, 0, 0, 0.22)',
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

export default function App() {
  const [lang, setLang] = useState(getInitialLang)

  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS)

  const [settingsLoading, setSettingsLoading] =
    useState(true)

  const [settingsError, setSettingsError] =
    useState(null)

  const { isLoading } = useGlobalLoading()

  const t = translations[lang]
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    localStorage.setItem('yhpo_lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    document.body.dir = dir
  }, [lang, dir])

  const toggleLang = useCallback(() => {
    setLang((currentLang) =>
      currentLang === 'ar' ? 'en' : 'ar'
    )
  }, [])

  const fetchSettings = useCallback(async () => {
    const siteSettings = await api.get('/settings', {
      globalLoading: false,
      loadingLabel: 'site-settings',
    })

    return normalizeSettings(siteSettings)
  }, [])

  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true)
    setSettingsError(null)

    try {
      const loadedSettings = await fetchSettings()

      setSettings(loadedSettings)

      return loadedSettings
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
  }, [fetchSettings])

  useEffect(() => {
    let cancelled = false

    finishInitialLoading()

    setSettingsLoading(true)
    setSettingsError(null)

    fetchSettings()
      .then((loadedSettings) => {
        if (cancelled) return

        setSettings(loadedSettings)
        setSettingsError(null)
      })
      .catch((error) => {
        if (cancelled) return

        console.error(
          'Failed to load site settings in the background:',
          error
        )

        setSettingsError(error)
      })
      .finally(() => {
        if (!cancelled) {
          setSettingsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [fetchSettings])

  const contextValue = {
    lang,
    t,
    dir,
    toggleLang,
    settings,
    settingsLoading,
    settingsError,
    refreshSettings,
    bootLoading: false,
    bootError: null,
    retryBootstrap: refreshSettings,
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div
        dir={dir}
        className={
          lang === 'ar'
            ? 'font-ar'
            : 'font-en'
        }
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
              <Route
                index
                element={<Dashboard />}
              />

              <Route
                path="news"
                element={<ManageNews />}
              />

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

              <Route
                path="hero"
                element={<ManageHero />}
              />

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

              <Route
                path="profile"
                element={<Profile />}
              />

              <Route
                path="gallery"
                element={<ManageGallery />}
              />

              <Route
                path="*"
                element={
                  <Navigate
                    to="/admin"
                    replace
                  />
                }
              />
            </Route>

            <Route
              path="/*"
              element={<PublicLayout />}
            />
          </Routes>
        </BrowserRouter>

        {isLoading && (
          <Preloader
            lang={lang}
            settings={settings}
          />
        )}
      </div>
    </AppContext.Provider>
  )
}
