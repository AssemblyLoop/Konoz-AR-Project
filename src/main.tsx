import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'
import DestinationScreen, { type GalleryItem } from './DestinationScreen'

// Destination configurations
const DESTINATIONS: Record<string, { greeting: string; items: GalleryItem[] }> = {
  siwa: {
    greeting: 'أهلا بك في سيوة',
    items: [
      { title: 'جبل الدكرور - سيوة', src: '/videos/gabl-dakrour-siwa/index.html', type: 'video' },
      { title: 'كهف الملح - سيوة', src: '/videos/salt-cave-siwa/index.html', type: 'video' },
      { title: 'بحيرة الملح', src: '/salt-lake/index.html', type: '360' },
      { title: 'عين كليوباترا', src: '/cleopatras-path/index.html', type: '360' },
    ],
  },
  sinai: {
    greeting: 'أهلا بك في سيناء',
    items: [
      { title: 'حمام موسى - سيناء', src: '/videos/hamam-moussa-sinai/index.html', type: 'video' },
    ],
  },
  'ras-sedr': {
    greeting: 'أهلا بك في رأس سدر',
    items: [
      { title: 'وادي غيسل - رأس سدر', src: '/videos/wadi-3asal-ras-sedr/index.html', type: 'video' },
    ],
  },
}

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
} else if (window.location.pathname === '/siwa') {
  const dest = DESTINATIONS.siwa
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <DestinationScreen
        greeting={dest.greeting}
        items={dest.items}
        onClose={() => window.history.back()}
      />
    </StrictMode>,
  )
} else if (window.location.pathname === '/sinai') {
  const dest = DESTINATIONS.sinai
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <DestinationScreen
        greeting={dest.greeting}
        items={dest.items}
        onClose={() => window.history.back()}
      />
    </StrictMode>,
  )
} else if (window.location.pathname === '/ras-sedr') {
  const dest = DESTINATIONS['ras-sedr']
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <DestinationScreen
        greeting={dest.greeting}
        items={dest.items}
        onClose={() => window.history.back()}
      />
    </StrictMode>,
  )
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
