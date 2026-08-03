import React from 'react'
import ReactDOM from 'react-dom/client'

import '@fontsource-variable/noto-kufi-arabic/wght.css'
import '@fontsource-variable/exo-2/wght.css'

import App from './App.jsx'
import { LoadingProvider } from './context/LoadingContext'

import './index.css'
import './preloader-modal-fixes.css'

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <React.StrictMode>
    <LoadingProvider>
      <App />
    </LoadingProvider>
  </React.StrictMode>
)