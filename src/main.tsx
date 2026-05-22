import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
// @ts-ignore JSX modules are implemented in JS
import { AuthProvider } from './context/AuthContext.jsx'
// @ts-ignore JSX modules are implemented in JS
import { ToastProvider } from './context/ToastContext.jsx'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
