import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

const INITIAL_PUBLIC_DATA = {
  loaded: false,
  heroSlides: [],
  news: [],
  events: [],
  partners: [],
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
        <Route path="/fields" element={<Fields />} />
        <Route path="/heritage-life" element={<HeritageLive />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/photo-gallery" element={<PhotoGallery />} />
        <Route path="/video-gallery" element={<VideoGallery />} />
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
            boxShadow: '0 10px 30px rgba(22, 101, 52, 0.28)',
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
            boxShadow: '0 10px 30px rgba(127, 29, 29, 0.28)',
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

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.items)) return value.items
  return []
}

export default function App() {
  const [lang, setLang] = useState('ar')

  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState(null)

  const [bootLoading, setBootLoading] = useState(true)
  const [bootError, setBootError] = useState(null)

  const [publicData, setPublicData] = useState(INITIAL_PUBLIC_DATA)

  const t = translations[lang]
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  const toggleLang = () => {
    setLang((currentLang) => (currentLang === 'ar' ? 'en' : 'ar'))
  }

  const loadSettings = useCallback(async () => {
    const siteSettings = await api.get('/settings')
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
      console.error('Failed to refresh site settings:', error)
      setSettingsError(error)
      throw error
    } finally {
      setSettingsLoading(false)
    }
  }, [loadSettings])

  const refreshPublicData = useCallback(async () => {
    const [heroSlides, news, events, partners] = await Promise.all([
      api.get('/hero'),
      api.get('/news?limit=3'),
      api.get('/events?limit=3'),
      api.get('/partners'),
    ])

    const nextPublicData = {
      loaded: true,
      heroSlides: normalizeArray(heroSlides),
      news: normalizeArray(news),
      events: normalizeArray(events),
      partners: normalizeArray(partners),
    }

    setPublicData(nextPublicData)
    return nextPublicData
  }, [])

  const bootstrapApp = useCallback(async () => {
    setBootLoading(true)
    setBootError(null)
    setSettingsError(null)

    try {
      const isAdminPath = window.location.pathname.startsWith('/admin')

      await api.get('/health')
      await loadSettings()

      if (!isAdminPath) {
        await refreshPublicData()
      }
    } catch (error) {
      console.error('App bootstrap failed:', error)
      setBootError(error)
    } finally {
      setBootLoading(false)
    }
  }, [loadSettings, refreshPublicData])

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

    publicData,
    refreshPublicData,

    bootLoading,
    bootError,
    retryBootstrap: bootstrapApp,
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div dir={dir} className={lang === 'ar' ? 'font-ar' : 'font-en'}>
        {bootLoading || bootError ? (
          <>
            <Preloader lang={lang} settings={settings} />
            <AppToaster />
          </>
        ) : (
          <BrowserRouter>
            <AppToaster />

            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route path="/admin/*" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="news" element={<ManageNews />} />
                <Route path="events" element={<ManageEvents />} />
                <Route path="heritage" element={<ManageHeritage />} />
                <Route path="partners" element={<ManagePartners />} />
                <Route path="hero" element={<ManageHero />} />
                <Route path="settings" element={<ManageSettings />} />
                <Route path="admins" element={<ManageAdmins />} />
                <Route path="messages" element={<ManageMessages />} />
                <Route path="profile" element={<Profile />} />
                <Route path="gallery" element={<ManageGallery />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>

              <Route path="/*" element={<PublicLayout />} />
            </Routes>
          </BrowserRouter>
        )}
      </div>
    </AppContext.Provider>
  )
}
