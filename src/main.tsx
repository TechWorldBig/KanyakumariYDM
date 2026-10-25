import{StrictMode}from'react'
import{createRoot}from'react-dom/client'
import App from'./app/App'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import'./styles/index.css'
const savedTheme = localStorage.getItem('district-theme') || 'system'
document.body.dataset.theme = savedTheme

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => undefined)
}

createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App/></ErrorBoundary></StrictMode>)
