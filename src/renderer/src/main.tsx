import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from './lib/theme'
import { ToastProvider } from './components/shared/Toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
)
