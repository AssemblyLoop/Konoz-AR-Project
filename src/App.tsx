import { useState, useEffect, useRef, useCallback } from 'react'
import {
  motion,
  AnimatePresence,
  useAnimation,
  type Variants,
} from 'framer-motion'
import {
  Settings,
  RefreshCcw,
  Download,
  Eye,
  Radio,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Stage = 'intro' | 'welcome' | 'personal' | 'main'

interface Location {
  name: string
  hue: number
  blurb: string
  palette: [string, string, string]
  imagePath: string
}

const LOCATIONS: Location[] = [
  {
    name: 'سيوة',
    hue: 190,
    blurb: 'واحة سيوة تشتهر بالعيون الكبريتية والهدوء العلاجي في قلب الصحراء.',
    palette: ['#8f9399', '#646b73', '#c0c5cb'],
    imagePath: '/assets/images/enhanced_image_1.jpg',
  },
  {
    name: 'سفاجا',
    hue: 25,
    blurb: 'سفاجا وجهة علاجية عالمية برمالها السوداء ومياهها الغنية بالأملاح.',
    palette: ['#e3b17e', '#8f5533', '#f1d6b5'],
    imagePath: '/assets/images/enhanced_image_2.jpg',
  },
  {
    name: 'أسوان',
    hue: 45,
    blurb: 'أسوان تمتاز بدفء المناخ والبيئة النيلية الهادئة المناسبة للاستشفاء.',
    palette: ['#e4c16f', '#7f5b1f', '#f6e3b1'],
    imagePath: '/assets/images/enhanced_image_3.jpg',
  },
  {
    name: 'الواحات',
    hue: 80,
    blurb: 'الواحات المصرية تجمع بين الهواء النقي والطبيعة الصحراوية المميزة.',
    palette: ['#b9d77f', '#49622a', '#d8edb0'],
    imagePath: '/assets/images/enhanced_image_4.jpg',
  },
  {
    name: 'البحر الأحمر',
    hue: 210,
    blurb: 'البحر الأحمر يقدم طقساً مشمساً ومياهاً صافية تساعد على الاسترخاء.',
    palette: ['#74a9e8', '#1c3f73', '#b9d8f8'],
    imagePath: '/assets/images/enhanced_image_5.jpg',
  },
  {
    name: 'عيون موسى',
    hue: 165,
    blurb: 'عيون موسى منطقة تاريخية وينابيع طبيعية مرتبطة بالاستشفاء والراحة.',
    palette: ['#79d9c5', '#1e6c61', '#baf1e7'],
    imagePath: '/assets/images/enhanced_image_6.jpg',
  },
]

const GLYPHS = ['𓂀', '𓁹', '𓋹', '𓊽', '𓆣']

interface SegmentationResults {
  image: CanvasImageSource
  segmentationMask: CanvasImageSource
}

interface SelfieSegmentationApi {
  setOptions(options: { modelSelection: 0 | 1 }): void
  onResults(callback: (results: SegmentationResults) => void): void
  send(input: { image: HTMLVideoElement }): Promise<void>
  close?: () => void
}

declare global {
  interface Window {
    SelfieSegmentation?: new (config: {
      locateFile: (file: string) => string
    }) => SelfieSegmentationApi
  }
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
) {
  const sourceWidth =
    source instanceof HTMLVideoElement
      ? source.videoWidth
      : source instanceof HTMLImageElement
      ? source.naturalWidth
      : source instanceof HTMLCanvasElement
      ? source.width
      : source instanceof ImageBitmap
      ? source.width
      : width

  const sourceHeight =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source instanceof HTMLImageElement
      ? source.naturalHeight
      : source instanceof HTMLCanvasElement
      ? source.height
      : source instanceof ImageBitmap
      ? source.height
      : height

  if (!sourceWidth || !sourceHeight) return

  const square = Math.min(sourceWidth, sourceHeight)
  const sx = (sourceWidth - square) / 2
  const sy = (sourceHeight - square) / 2
  ctx.drawImage(source, sx, sy, square, square, 0, 0, width, height)
}

function drawMockBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  location: Location,
) {
  const [start, mid, end] = location.palette
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, start)
  gradient.addColorStop(0.5, mid)
  gradient.addColorStop(1, end)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  for (let i = 0; i < 7; i += 1) {
    const circleSize = width * (0.08 + i * 0.03)
    ctx.beginPath()
    ctx.arc(width * 0.15 + i * (width * 0.12), height * 0.18, circleSize, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.fillRect(0, height * 0.72, width, height * 0.28)
}

function drawLocationBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  location: Location,
  image: HTMLImageElement | null,
) {
  if (image) {
    drawCoverImage(ctx, image, width, height)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(0, 0, width, height)
    return
  }
  drawMockBackground(ctx, width, height, location)
}

function getSecureContextMessage(): string | null {
  if (window.isSecureContext) return null
  return `الكاميرا تتطلب HTTPS. من iPhone افتح: https://${window.location.host}`
}

async function requestCameraStream(
  facingMode: 'user' | 'environment',
): Promise<MediaStream> {
  if (!window.isSecureContext) {
    throw new Error('SECURE_CONTEXT_REQUIRED')
  }

  const constraints: MediaStreamConstraints = {
    video: {
      facingMode: facingMode === 'environment' ? { ideal: 'environment' } : { ideal: 'user' },
      width: { ideal: 640, min: 320 },
      height: { ideal: 640, min: 320 },
      frameRate: { ideal: 24, max: 30 },
    },
    audio: false,
  }

  const simpleConstraints: MediaStreamConstraints = {
    video: { facingMode },
    audio: false,
  }

  if (navigator.mediaDevices?.getUserMedia) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch {
      return await navigator.mediaDevices.getUserMedia(simpleConstraints)
    }
  }

  type LegacyGetUserMedia = (
    constraints: MediaStreamConstraints,
    onSuccess: (stream: MediaStream) => void,
    onError: (error: Error) => void,
  ) => void

  const legacyGetUserMedia =
    (navigator as Navigator & { webkitGetUserMedia?: LegacyGetUserMedia }).webkitGetUserMedia ??
    (navigator as Navigator & { mozGetUserMedia?: LegacyGetUserMedia }).mozGetUserMedia

  if (legacyGetUserMedia) {
    return new Promise<MediaStream>((resolve, reject) => {
      legacyGetUserMedia.call(navigator, simpleConstraints, resolve, reject)
    })
  }

  throw new Error('getUserMedia not available')
}

function mapCameraError(error: unknown): string {
  const err = error as { name?: string; message?: string }
  if (err.message === 'SECURE_CONTEXT_REQUIRED') {
    return getSecureContextMessage() ?? 'الكاميرا تتطلب اتصالاً آمناً (HTTPS).'
  }
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return 'يرجى السماح بوصول التطبيق للكاميرا من إعدادات Safari.'
  }
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return 'لم يتم العثور على كاميرا متاحة على جهازك.'
  }
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return 'الكاميرا قيد الاستخدام. أغلق التطبيقات الأخرى وجرب مجدداً.'
  }
  if (err.name === 'OverconstrainedError') {
    return 'الكاميرا لا تدعم الإعدادات المطلوبة. جرّب قلب الكاميرا.'
  }
  return err.message ? `خطأ: ${err.message}` : 'فشل الوصول للكاميرا.'
}

// ─────────────────────────────────────────────
// Particles
// ─────────────────────────────────────────────
interface ParticleConfig {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  color: string
}

function useParticles(count: number): ParticleConfig[] {
  const ref = useRef<ParticleConfig[]>([])
  if (ref.current.length === 0) {
    const colors = ['#aef3f0', '#f5d98a', '#ffffff', '#7dd8d4']
    ref.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  }
  return ref.current
}

function Particles({ count = 50, className = '' }: { count?: number; className?: string }) {
  const particles = useParticles(count)
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.2, 0.9, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// CinematicBg
// ─────────────────────────────────────────────
function CinematicBg() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, oklch(0.10 0.04 195) 0%, oklch(0.08 0.02 220) 50%, #000 100%)',
        }}
      />

      {/* Turquoise blob */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-20%',
          width: '70%',
          height: '70%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, oklch(0.55 0.18 195 / 0.35) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Gold blob */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-20%',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, oklch(0.65 0.18 85 / 0.30) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.12, 0.92, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// HorusEye
// ─────────────────────────────────────────────
function HorusEye() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 256, height: 256 }}>
      {/* Outer gold ring */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid oklch(0.82 0.14 85 / 0.8)',
          borderRadius: '50%',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      {/* Dashed middle ring */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 16,
          border: '2px dashed oklch(0.82 0.14 85 / 0.5)',
          borderRadius: '50%',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner turquoise ring */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 32,
          border: '1.5px solid oklch(0.78 0.14 195 / 0.7)',
          borderRadius: '50%',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />

      {/* Turquoise pulse bg */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 40,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, oklch(0.78 0.14 195 / 0.25) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* SVG Eye of Horus */}
      <svg
        viewBox="0 0 200 200"
        style={{ position: 'absolute', inset: 20, width: 'calc(100% - 40px)', height: 'calc(100% - 40px)' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f5d98a" />
            <stop offset="50%" stopColor="#e8c55a" />
            <stop offset="100%" stopColor="#f5d98a" />
          </linearGradient>
          <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#aef3f0" />
            <stop offset="50%" stopColor="#1aa6a0" />
            <stop offset="100%" stopColor="#0a3a3a" />
          </radialGradient>
        </defs>

        {/* Main eye outline */}
        <motion.path
          d="M30 100 Q100 40 170 100 Q100 160 30 100 Z"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        />

        {/* Horus mark 1 */}
        <motion.path
          d="M170 100 Q190 110 195 130"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
        />

        {/* Horus mark 2 */}
        <motion.path
          d="M100 138 Q108 168 130 170"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9, ease: 'easeOut' }}
        />

        {/* Iris */}
        <motion.circle
          cx="100"
          cy="100"
          r="22"
          fill="url(#irisGrad)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ transformOrigin: '100px 100px' }}
        />

        {/* Pupil breathing */}
        <motion.circle
          cx="100"
          cy="100"
          r="10"
          fill="#02161a"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          style={{ transformOrigin: '100px 100px' }}
        />

        {/* Highlight */}
        <circle cx="106" cy="94" r="3" fill="#e9fffd" opacity="0.8" />
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────
// ScanFrame
// ─────────────────────────────────────────────
function ScanFrame() {
  return (
    <div
      className="relative"
      style={{ width: '100%', height: '100%' }}
      aria-label="إطار المسح الضوئي"
    >
      {/* Outer glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 24,
          boxShadow: '0 0 40px oklch(0.78 0.14 195 / 0.4), inset 0 0 20px oklch(0.78 0.14 195 / 0.1)',
          border: '1px solid oklch(0.78 0.14 195 / 0.3)',
        }}
      />

      {/* Rotating corner brackets */}
      {[
        { corner: 'top-0 left-0', rotate: 0, origin: 'top left' },
        { corner: 'top-0 right-0', rotate: 90, origin: 'top right' },
        { corner: 'bottom-0 right-0', rotate: 180, origin: 'bottom right' },
        { corner: 'bottom-0 left-0', rotate: 270, origin: 'bottom left' },
      ].map((b, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 32,
            height: 32,
            ...(b.corner.includes('top-0') ? { top: -1 } : { bottom: -1 }),
            ...(b.corner.includes('left-0') ? { left: -1 } : { right: -1 }),
            borderColor: 'oklch(0.85 0.18 195)',
            borderStyle: 'solid',
            borderWidth: 0,
            ...(b.corner.includes('top-0') ? { borderTopWidth: 2.5 } : { borderBottomWidth: 2.5 }),
            ...(b.corner.includes('left-0') ? { borderLeftWidth: 2.5 } : { borderRightWidth: 2.5 }),
            borderRadius:
              b.corner.includes('top-0') && b.corner.includes('left-0')
                ? '16px 0 0 0'
                : b.corner.includes('top-0')
                ? '0 16px 0 0'
                : b.corner.includes('right-0')
                ? '0 0 16px 0'
                : '0 0 0 16px',
            transformOrigin: b.origin,
          }}
          animate={{ rotate: [b.rotate, b.rotate + 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Scan line */}
      <motion.div
        style={{
          position: 'absolute',
          left: '5%',
          right: '5%',
          height: 2,
          borderRadius: 1,
          background: 'linear-gradient(90deg, transparent, oklch(0.85 0.18 195), oklch(0.78 0.14 195), oklch(0.85 0.18 195), transparent)',
          boxShadow: '0 0 12px 2px oklch(0.78 0.14 195 / 0.8)',
        }}
        animate={{ top: ['8%', '92%', '8%'] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// CameraFeed
// ─────────────────────────────────────────────
function CameraFeed() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Oasis gradient background */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(160deg, #1a2a2e 0%, #2c3a30 30%, #6b5a3a 70%, #c9a25a 100%)',
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Glowing sun top-right */}
      <motion.div
        style={{
          position: 'absolute',
          top: '8%',
          right: '12%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, oklch(0.85 0.18 85 / 0.7) 0%, oklch(0.70 0.14 85 / 0.3) 50%, transparent 70%)',
          filter: 'blur(8px)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* SVG pyramids silhouette */}
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMax meet"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', opacity: 0.6 }}
        aria-hidden="true"
      >
        <polygon points="60,200 130,90 200,200" fill="#3a2a1a" />
        <polygon points="160,200 220,110 280,200" fill="#2e2010" />
        <polygon points="260,200 310,130 360,200" fill="#3a2a1a" />
        <rect x="0" y="185" width="400" height="15" fill="#2e2010" />
      </svg>

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
          backdropFilter: 'blur(0.5px)',
        }}
      />

      {/* Sand particles */}
      <Particles count={35} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Stage variants
// ─────────────────────────────────────────────
const stageVariants: Variants = {
  initial: { opacity: 0, filter: 'blur(20px)' },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    filter: 'blur(20px)',
    transition: { duration: 0.6, ease: 'easeIn' },
  },
}

// ─────────────────────────────────────────────
// IntroScreen
// ─────────────────────────────────────────────
function IntroScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const total = 3500
    const interval = 40
    const step = (interval / total) * 100
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + step, 100)
        return next
      })
    }, interval)

    const done = setTimeout(() => {
      clearInterval(timer)
      setTimeout(onDone, 500)
    }, total)

    return () => {
      clearInterval(timer)
      clearTimeout(done)
    }
  }, [onDone])

  return (
    <motion.section
      key="intro"
      className="absolute inset-0 flex flex-col items-center justify-center"
      variants={stageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      aria-label="شاشة البداية"
    >
      <CinematicBg />
      <Particles count={55} />

      {/* HorusEye */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10"
      >
        <HorusEye />
      </motion.div>

      {/* Title */}
      <motion.h1
        className="relative z-10 text-4xl font-bold mt-6 text-center gradient-text-aurora"
        style={{
          textShadow: '0 0 30px oklch(0.78 0.14 195 / 0.6)',
          fontFamily: "'Tajawal', system-ui, sans-serif",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
      >
        كنوز
      </motion.h1>

      <motion.p
        className="relative z-10 text-xs font-medium mt-2 text-center"
        style={{
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.55)',
          textTransform: 'uppercase',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
      >
        EGYPTIAN HEALING EXPERIENCE
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="relative z-10 mt-12 w-full flex flex-col items-center gap-2 px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
      >
        <div className="flex justify-between w-full max-w-xs px-1">
          <span style={{ letterSpacing: '0.3em', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
            LOADING
          </span>
          <span style={{ letterSpacing: '0.3em', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div
          className="w-full max-w-xs rounded-full overflow-hidden"
          style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}
        >
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #1aa6a0, #aef3f0, #f5d98a)',
              boxShadow: '0 0 8px 1px #aef3f0aa',
              borderRadius: 9999,
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.04, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </motion.section>
  )
}

// ─────────────────────────────────────────────
// WelcomeScreen
// ─────────────────────────────────────────────
function WelcomeScreen({
  onNext,
}: {
  onNext: (name: string) => void
}) {
  const [username, setUsername] = useState('')

  return (
    <motion.section
      key="welcome"
      className="absolute inset-0 flex flex-col items-center justify-center px-5"
      variants={stageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      aria-label="شاشة الترحيب"
    >
      {/* Oasis background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0d1a22 0%, #1f3a40 35%, #6c5a36 75%, #c9a25a 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(0,0,0,0.6) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <Particles count={30} />

      {/* Glass card */}
      <motion.div
        className="relative z-10 glass rounded-3xl p-8 w-full max-w-sm flex flex-col items-center gap-5"
        style={{
          boxShadow: '0 0 60px oklch(0.82 0.14 85 / 0.15), inset 0 0 30px oklch(0.82 0.14 85 / 0.05)',
        }}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Small horus mark */}
        <motion.div
          style={{ fontSize: 32, lineHeight: 1 }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          𓂀
        </motion.div>

        <h1
          className="text-2xl font-bold text-center gradient-text-gold"
          style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
        >
          أهلاً بك في كنوز
        </h1>

        <p
          className="text-sm text-center"
          style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}
        >
          ابدأ رحلتك إلى أرض الشفاء
          <br />
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
            حيث تلتقي الطبيعة بالحضارة
          </span>
        </p>

        {/* Input */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="اكتب اسمك..."
          aria-label="أدخل اسمك"
          maxLength={40}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 9999,
            padding: '12px 20px',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 15,
            fontFamily: "'Tajawal', system-ui, sans-serif",
            outline: 'none',
            textAlign: 'right',
            direction: 'rtl',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'oklch(0.78 0.14 195 / 0.7)'
            e.target.style.boxShadow = '0 0 0 3px oklch(0.78 0.14 195 / 0.15)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.12)'
            e.target.style.boxShadow = 'none'
          }}
        />

        {/* CTA */}
        <motion.button
          onClick={() => username.trim() && onNext(username.trim())}
          disabled={!username.trim()}
          aria-label="ابدأ الرحلة"
          whileHover={{ scale: username.trim() ? 1.04 : 1 }}
          whileTap={{ scale: 0.96 }}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: 9999,
            border: 'none',
            cursor: username.trim() ? 'pointer' : 'not-allowed',
            fontFamily: "'Tajawal', system-ui, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: '#0a1a1a',
            background: username.trim()
              ? 'linear-gradient(135deg, oklch(0.78 0.14 195), oklch(0.82 0.14 85))'
              : 'rgba(255,255,255,0.1)',
            boxShadow: username.trim()
              ? '0 0 30px oklch(0.78 0.14 195 / 0.4)'
              : 'none',
            transition: 'background 0.3s, box-shadow 0.3s, color 0.3s',
          }}
        >
          {username.trim() ? 'ابدأ الرحلة ✦' : 'ابدأ الرحلة'}
        </motion.button>
      </motion.div>
    </motion.section>
  )
}

// ─────────────────────────────────────────────
// PersonalLoading
// ─────────────────────────────────────────────
function LetterByLetter({ text, delay = 0 }: { text: string; delay?: number }) {
  const letters = Array.from(text)
  return (
    <span aria-label={text}>
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: delay + i * 0.05, duration: 0.3, ease: 'easeOut' }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

interface GlyphConfig {
  id: number
  glyph: string
  x: number
  delay: number
  duration: number
  size: number
}

function useGlyphs(): GlyphConfig[] {
  const ref = useRef<GlyphConfig[]>([])
  if (ref.current.length === 0) {
    ref.current = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      glyph: GLYPHS[i % GLYPHS.length],
      x: Math.random() * 90 + 5,
      delay: Math.random() * 1.5,
      duration: Math.random() * 3 + 3,
      size: Math.random() * 16 + 18,
    }))
  }
  return ref.current
}

function PersonalLoading({
  username,
  onDone,
}: {
  username: string
  onDone: () => void
}) {
  const glyphs = useGlyphs()

  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.section
      key="personal"
      className="absolute inset-0 flex flex-col items-center justify-center"
      variants={stageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      aria-label="تحميل شخصي"
    >
      <CinematicBg />

      {/* Drifting glyphs */}
      {glyphs.map((g) => (
        <motion.span
          key={g.id}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${g.x}%`,
            bottom: '5%',
            fontSize: g.size,
            color: 'oklch(0.82 0.14 85 / 0.5)',
            userSelect: 'none',
          }}
          animate={{ y: [0, -600], opacity: [0, 0.8, 0] }}
          transition={{
            duration: g.duration,
            delay: g.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        >
          {g.glyph}
        </motion.span>
      ))}

      <Particles count={40} />

      {/* Text */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-8 text-center">
        <motion.div
          style={{ fontSize: 32, lineHeight: 1, marginBottom: 8 }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          𓋹
        </motion.div>

        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "'Tajawal', system-ui, sans-serif",
            color: 'oklch(0.82 0.14 85)',
            textShadow: '0 0 20px oklch(0.82 0.14 85 / 0.5)',
          }}
        >
          <LetterByLetter text={`مرحباً، ${username}`} />
        </h2>

        <p
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 15,
            fontFamily: "'Tajawal', system-ui, sans-serif",
          }}
        >
          <LetterByLetter text="جاري تحضير تجربتك..." delay={0.6} />
        </p>

        {/* Spinner */}
        <motion.div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: 'oklch(0.78 0.14 195)',
            marginTop: 8,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </motion.section>
  )
}

// ─────────────────────────────────────────────
// MainScreen
// ─────────────────────────────────────────────
function MainScreen({ username }: { username: string }) {
  const [activeFilter, setActiveFilter] = useState(0)
  const [shutterActive, setShutterActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraRequested, setCameraRequested] = useState(false)
  const [segmentationLoaded, setSegmentationLoaded] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const controls = useAnimation()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const segmentationRef = useRef<SelfieSegmentationApi | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const processingRef = useRef(false)
  const activeLocationRef = useRef(LOCATIONS[0])
  const activeBackgroundImageRef = useRef<HTMLImageElement | null>(null)
  const backgroundImageCacheRef = useRef<Record<string, HTMLImageElement>>({})
  const capturedImageRef = useRef<string | null>(null)
  const shutterRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleShutter = useCallback(() => {
    if (shutterActive || !cameraCanvasRef.current) return
    setShutterActive(true)
    setShowFlash(true)
    setCapturedImage(cameraCanvasRef.current.toDataURL('image/png'))
    void controls.start({ scale: [1, 0.9, 1.05, 1] })
    setTimeout(() => setShowFlash(false), 250)
    shutterRef.current = setTimeout(() => setShutterActive(false), 600)
  }, [shutterActive, controls])

  const handleRetakeOrFlip = useCallback(() => {
    if (capturedImage) {
      setCapturedImage(null)
      return
    }
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }, [capturedImage])

  const handleSave = useCallback(() => {
    if (!capturedImage) return
    const link = document.createElement('a')
    link.href = capturedImage
    link.download = `konoz-filter-${Date.now()}.png`
    link.click()
  }, [capturedImage])

  useEffect(() => {
    activeLocationRef.current = LOCATIONS[activeFilter]
    activeBackgroundImageRef.current =
      backgroundImageCacheRef.current[LOCATIONS[activeFilter].imagePath] ?? null
  }, [activeFilter])

  useEffect(() => {
    capturedImageRef.current = capturedImage
  }, [capturedImage])

  useEffect(() => {
    LOCATIONS.forEach((location) => {
      const cache = backgroundImageCacheRef.current
      if (cache[location.imagePath]) return
      const image = new Image()
      image.src = location.imagePath
      image.onload = () => {
        cache[location.imagePath] = image
        if (activeLocationRef.current.imagePath === location.imagePath) {
          activeBackgroundImageRef.current = image
        }
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    if (window.SelfieSegmentation) {
      setSegmentationLoaded(true)
      return () => {
        cancelled = true
      }
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js'
    script.async = true
    script.onload = () => {
      if (!cancelled) setSegmentationLoaded(true)
    }
    script.onerror = () => {
      if (!cancelled) {
        setCameraError('تعذر تحميل مكتبة المعالجة. تحقق من الاتصال بالإنترنت.')
      }
    }
    document.body.appendChild(script)

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!segmentationLoaded || !window.SelfieSegmentation) return

    const segmenter = new window.SelfieSegmentation({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    })

    segmenter.setOptions({ modelSelection: 1 })
    segmenter.onResults((results) => {
      if (capturedImageRef.current) return

      const canvas = cameraCanvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)
      drawLocationBackground(
        ctx,
        width,
        height,
        activeLocationRef.current,
        activeBackgroundImageRef.current,
      )

      ctx.save()
      drawCoverImage(ctx, results.segmentationMask, width, height)
      ctx.globalCompositeOperation = 'source-in'
      drawCoverImage(ctx, results.image, width, height)
      ctx.restore()
    })

    segmentationRef.current = segmenter
    return () => {
      segmentationRef.current?.close?.()
      segmentationRef.current = null
    }
  }, [segmentationLoaded])

  const startCamera = useCallback(async () => {
    const insecureMessage = getSecureContextMessage()
    if (insecureMessage) {
      setCameraError(insecureMessage)
      setCameraReady(false)
      return
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    setCameraReady(false)
    setCameraError(null)

    try {
      const stream = await requestCameraStream(facingMode)
      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      video.srcObject = stream
      video.setAttribute('playsinline', 'true')
      video.setAttribute('webkit-playsinline', 'true')
      video.muted = true
      video.autoplay = true

      await video.play()
      setCameraReady(true)
    } catch (error) {
      setCameraError(mapCameraError(error))
      setCameraReady(false)
    }
  }, [facingMode])

  const handleStartCamera = useCallback(() => {
    setCameraRequested(true)
  }, [])

  useEffect(() => {
    const insecureMessage = getSecureContextMessage()
    if (insecureMessage) setCameraError(insecureMessage)
  }, [])

  useEffect(() => {
    if (!cameraRequested) return

    void startCamera()

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setCameraReady(false)
    }
  }, [facingMode, startCamera, cameraRequested])

  useEffect(() => {
    const loop = () => {
      if (
        !cameraReady ||
        !segmentationRef.current ||
        !videoRef.current ||
        capturedImage ||
        processingRef.current
      ) {
        animationFrameRef.current = window.requestAnimationFrame(loop)
        return
      }

      processingRef.current = true
      void segmentationRef.current
        .send({ image: videoRef.current })
        .catch(() => {
          setCameraError((current) => current ?? 'تعذر تحديث الفلتر المباشر.')
        })
        .finally(() => {
          processingRef.current = false
          animationFrameRef.current = window.requestAnimationFrame(loop)
        })
    }

    animationFrameRef.current = window.requestAnimationFrame(loop)
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [cameraReady, capturedImage])

  useEffect(() => {
    return () => {
      if (shutterRef.current) clearTimeout(shutterRef.current)
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const activeLocation = LOCATIONS[activeFilter]

  return (
    <motion.section
      key="main"
      className="absolute inset-0"
      variants={stageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      aria-label={`الكاميرا الرئيسية — ${activeLocation?.name ?? ''}`}
    >
      {/* Decorative background */}
      <CameraFeed />

      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          clip: 'rect(0,0,0,0)',
          pointerEvents: 'none',
          zIndex: -9999,
        }}
        aria-hidden="true"
      />

      {/* Flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            key="flash"
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'white', zIndex: 50 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))', paddingBottom: 16 }}
      >
        {/* Settings */}
        <motion.button
          className="glass-btn"
          style={{ width: 48, height: 48 }}
          whileTap={{ scale: 0.92 }}
          aria-label="الإعدادات"
        >
          <Settings size={20} color="rgba(255,255,255,0.85)" />
        </motion.button>

        {/* LIVE chip */}
        <div
          className="flex items-center gap-2 glass rounded-full px-3 py-1.5"
          style={{ border: '1px solid rgba(255,255,255,0.15)' }}
          aria-label="بث مباشر"
        >
          <motion.div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#ff3b3b',
              boxShadow: '0 0 8px #ff3b3baa',
            }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            LIVE AR
          </span>
          <Radio size={14} color="rgba(255,255,255,0.6)" aria-hidden="true" />
        </div>

        {/* Eye */}
        <motion.button
          className="glass-btn"
          style={{ width: 48, height: 48 }}
          whileTap={{ scale: 0.92 }}
          aria-label="معاينة"
        >
          <Eye size={20} color="rgba(255,255,255,0.85)" />
        </motion.button>
      </div>

      {/* User greeting overlay */}
      <motion.div
        className="absolute z-10"
        style={{ top: 80, left: 0, right: 0, textAlign: 'center' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.15em',
            fontFamily: "'Tajawal', system-ui",
          }}
        >
          مرحباً، {username}
        </span>
      </motion.div>

      {/* Camera square */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-3" style={{ top: 60, bottom: 200 }}>
        <div
          style={{
            width: 'min(90vw, 320px)',
            aspectRatio: '1 / 1',
            maxHeight: 'calc(100vh - 260px)',
            position: 'relative',
          }}
        >
          <div
            className="glass"
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              borderRadius: 28,
              boxShadow: '0 0 40px oklch(0.78 0.14 195 / 0.25)',
            }}
          >
            {capturedImage ? (
              <img
                src={capturedImage}
                alt={`صورة ملتقطة في فلتر ${activeLocation.name}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <canvas
                ref={cameraCanvasRef}
                width={640}
                height={640}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                aria-label="معاينة الكاميرا"
              />
            )}

            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                right: 12,
                background: 'rgba(110,110,110,0.78)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 12,
                padding: '8px 10px',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>{activeLocation.name}</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>{activeLocation.blurb}</div>
            </div>

            {(cameraError || !cameraReady) && (
              <motion.div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  textAlign: 'center',
                  padding: 20,
                  background: 'rgba(0,0,0,0.55)',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <p style={{ margin: 0 }}>
                  {cameraError ??
                    (cameraRequested ? 'جاري تشغيل الكاميرا...' : 'اضغط لتشغيل الكاميرا واستخدام الفلاتر')}
                </p>
                {!cameraReady && (
                  <motion.button
                    type="button"
                    onClick={handleStartCamera}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      border: 'none',
                      borderRadius: 9999,
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontFamily: "'Tajawal', system-ui, sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0a1a1a',
                      background:
                        'linear-gradient(135deg, oklch(0.78 0.14 195), oklch(0.82 0.14 85))',
                      boxShadow: '0 0 20px oklch(0.78 0.14 195 / 0.35)',
                    }}
                  >
                    {cameraError ? 'إعادة المحاولة' : 'تشغيل الكاميرا'}
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>

          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <ScanFrame />
          </div>
        </div>
      </div>

      {/* Filter carousel */}
      <div
        className="absolute z-20 left-0 right-0"
        style={{ bottom: 104 }}
        aria-label="فلاتر المواقع"
      >
        <div
          className="flex gap-2 no-scrollbar"
          style={{
            overflowX: 'auto',
            overflowY: 'visible',
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 4,
            paddingBottom: 4,
            scrollSnapType: 'x mandatory',
            direction: 'rtl',
          }}
          role="listbox"
          aria-label="اختر موقعاً"
        >
          {LOCATIONS.map((loc, i) => {
            const isActive = activeFilter === i
            return (
              <motion.button
                key={loc.name}
                onClick={() => setActiveFilter(i)}
                role="option"
                aria-selected={isActive}
                aria-label={loc.name}
                style={{ scrollSnapAlign: 'center', flexShrink: 0 }}
                whileTap={{ scale: 0.88 }}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundImage: `url("${loc.imagePath}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: loc.palette[1],
                      boxShadow: isActive
                        ? `0 0 0 2px oklch(0.82 0.14 85), 0 0 16px hsl(${loc.hue} 70% 55% / 0.6)`
                        : '0 0 0 1px rgba(255,255,255,0.15)',
                      transition: 'box-shadow 0.2s',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      color: isActive ? 'oklch(0.82 0.14 85)' : 'rgba(255,255,255,0.55)',
                      fontFamily: "'Tajawal', system-ui",
                      fontWeight: isActive ? 600 : 400,
                      whiteSpace: 'nowrap',
                      textShadow: isActive ? '0 0 6px oklch(0.82 0.14 85 / 0.5)' : 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    {loc.name}
                  </span>
                </motion.div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Capture row */}
      <div
        className="absolute left-0 right-0 z-20 flex items-center justify-between px-4"
        style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        aria-label="شريط التصوير"
      >
        {/* Download/Save */}
        <motion.button
          onClick={handleSave}
          className="glass-btn"
          disabled={!capturedImage}
          style={{
            width: 44,
            height: 44,
            opacity: capturedImage ? 1 : 0.45,
            cursor: capturedImage ? 'pointer' : 'not-allowed',
          }}
          whileTap={{ scale: 0.92 }}
          aria-label="حفظ الصورة"
        >
          <Download size={18} color="rgba(255,255,255,0.85)" />
        </motion.button>

        {/* Shutter */}
        <motion.button
          onClick={handleShutter}
          disabled={!cameraReady || Boolean(cameraError) || Boolean(capturedImage)}
          aria-label="التقاط صورة"
          style={{
            position: 'relative',
            width: 68,
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !cameraReady || Boolean(cameraError) || Boolean(capturedImage) ? 0.55 : 1,
          }}
          whileTap={{ scale: 0.94 }}
        >
          {/* Outer ring gold gradient */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, oklch(0.82 0.14 85), oklch(0.70 0.12 85))',
              boxShadow: '0 0 16px oklch(0.82 0.14 85 / 0.4)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          {/* Middle ring */}
          <div
            style={{
              position: 'absolute',
              inset: 5,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
            }}
          />
          {/* Inner circle */}
          <motion.div
            animate={controls}
            style={{
              position: 'absolute',
              inset: 10,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: shutterActive ? '0 0 16px #ffffff' : 'none',
            }}
          />
        </motion.button>

        {/* Retake / Flip camera */}
        <motion.button
          onClick={handleRetakeOrFlip}
          className="glass-btn"
          style={{ width: 44, height: 44 }}
          whileTap={{ scale: 0.92, rotate: 180 }}
          aria-label={capturedImage ? 'إعادة الالتقاط' : 'قلب الكاميرا'}
        >
          <RefreshCcw size={18} color="rgba(255,255,255,0.85)" />
        </motion.button>
      </div>
    </motion.section>
  )
}

// ─────────────────────────────────────────────
// ShifaaMisr — Root
// ─────────────────────────────────────────────
export default function ShifaaMisr() {
  const [stage, setStage] = useState<Stage>('intro')
  const [username, setUsername] = useState('')

  const handleIntroDone = useCallback(() => setStage('welcome'), [])
  const handleWelcomeNext = useCallback((name: string) => {
    setUsername(name)
    setStage('personal')
  }, [])
  const handlePersonalDone = useCallback(() => setStage('main'), [])

  return (
    <div
      dir="rtl"
      lang="ar"
      className="relative overflow-hidden bg-black text-white"
      style={{
        width: '100%',
        height: '100dvh',
        fontFamily: "'Tajawal', 'Segoe UI', system-ui, sans-serif",
        touchAction: 'manipulation',
      }}
    >
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <IntroScreen key="intro" onDone={handleIntroDone} />
        )}
        {stage === 'welcome' && (
          <WelcomeScreen key="welcome" onNext={handleWelcomeNext} />
        )}
        {stage === 'personal' && (
          <PersonalLoading
            key="personal"
            username={username}
            onDone={handlePersonalDone}
          />
        )}
        {stage === 'main' && (
          <MainScreen key="main" username={username} />
        )}
      </AnimatePresence>
    </div>
  )
}
