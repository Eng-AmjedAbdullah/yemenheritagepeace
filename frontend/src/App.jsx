import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, createContext, useContext } from 'react'
import { Toaster } from 'react-hot-toast'

import { translations } from './lib/i18n'
import api from './lib/api'

import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home from './pages/Home'
import About from './pages/About'
import News from './pages/News'
import Events from './pages/Events'
import Fields from './pages/Fields'
import HeritageLive from './pages/HeritageLive'
import Contact from './pages/Contact'

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

export const AppContext = createContext()
export const useLang = () => useContext(AppContext)

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </>
  )
}

export default function App() {
  const [lang, setLang] = useState('ar')
  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  const t = translations[lang]
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  const toggleLang = () => {
    setLang((currentLang) => (currentLang === 'ar' ? 'en' : 'ar'))
  }

  const refreshSettings = async () => {
    setSettingsLoading(true)

    try {
      const siteSettings = await api.get('/settings')
      setSettings(siteSettings)
    } catch {
      setSettings(null)
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    refreshSettings()
  }, [])

  return (
    <AppContext.Provider
      value={{
        lang,
        t,
        dir,
        toggleLang,
        settings,
        settingsLoading,
        refreshSettings,
      }}
    >
      <div dir={dir} className={lang === 'ar' ? 'font-ar' : 'font-en'}>
        <BrowserRouter>
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
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            <Route path="/*" element={<PublicLayout />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AppContext.Provider>
  )
}
