import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastProvider } from './components/shared/Toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
)
