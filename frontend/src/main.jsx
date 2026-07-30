import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.jsx'
import { LoadingProvider } from './context/LoadingContext'
import './index.css'
import './preloader-modal-fixes.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LoadingProvider>
      <App />
    </LoadingProvider>
  </React.StrictMode>
)
