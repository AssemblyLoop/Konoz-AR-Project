import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'

if (window.location.pathname === '/videos' || window.location.pathname.startsWith('/videos/')) {
  const videoPath = window.location.pathname === '/videos'
    ? '/videos/index.html'
    : window.location.pathname.endsWith('/')
      ? `${window.location.pathname}index.html`
      : window.location.pathname

  createRoot(document.getElementById('root')!).render(
    <iframe
      src={videoPath}
      style={{ width: '100vw', height: '100vh', border: 'none', margin: 0, padding: 0, display: 'block' }}
      title="Konoz Videos"
    />
  )
} else if (window.location.pathname === '/siwa-oasis') {
  // Render independent 360 page
  createRoot(document.getElementById('root')!).render(
    <iframe
      src="/siwa-oasis/index.html"
      allow="accelerometer; gyroscope; magnetometer; fullscreen"
      allowFullScreen
      style={{ width: '100vw', height: '100vh', border: 'none', margin: 0, padding: 0, display: 'block' }}
      title="Siwa Oasis 360"
    />
  )
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
