import { useState, useEffect, useRef, useCallback } from 'react'
import {
  motion,
  AnimatePresence,
  useAnimation,
  type Variants,
} from 'framer-motion'
import {
  Settings,
  Zap,
  ZapOff,
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
}

const LOCATIONS: Location[] = [
  { name: 'سيوة', hue: 190 },
  { name: 'سفاجا', hue: 25 },
  { name: 'أسوان', hue: 45 },
  { name: 'الواحات', hue: 80 },
  { name: 'البحر الأحمر', hue: 210 },
  { name: 'عيون موسى', hue: 165 },
]

const GLYPHS = ['𓂀', '𓁹', '𓋹', '𓊽', '𓆣']

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
      style={{ width: 256, height: 256 }}
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
  const [flash, setFlash] = useState(false)
  const [shutterActive, setShutterActive] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const controls = useAnimation()
  const shutterRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleShutter = useCallback(() => {
    if (shutterActive) return
    setShutterActive(true)
    setShowFlash(true)
    void controls.start({ scale: [1, 0.9, 1.05, 1] })
    setTimeout(() => setShowFlash(false), 250)
    shutterRef.current = setTimeout(() => setShutterActive(false), 600)
  }, [shutterActive, controls])

  useEffect(() => {
    return () => {
      if (shutterRef.current) clearTimeout(shutterRef.current)
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
      {/* Camera feed */}
      <CameraFeed />

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

      {/* ScanFrame centered */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <ScanFrame />
      </div>

      {/* Filter carousel */}
      <div
        className="absolute z-20 left-0 right-0"
        style={{ bottom: 130 }}
        aria-label="فلاتر المواقع"
      >
        <div
          className="flex gap-4 no-scrollbar"
          style={{
            overflowX: 'auto',
            overflowY: 'visible',
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 8,
            paddingBottom: 8,
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
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, hsl(${loc.hue} 70% 65%) 0%, hsl(${loc.hue} 60% 35%) 100%)`,
                      boxShadow: isActive
                        ? `0 0 0 2.5px oklch(0.82 0.14 85), 0 0 20px hsl(${loc.hue} 70% 55% / 0.6)`
                        : '0 0 0 1.5px rgba(255,255,255,0.15)',
                      transition: 'box-shadow 0.2s',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: isActive ? 'oklch(0.82 0.14 85)' : 'rgba(255,255,255,0.55)',
                      fontFamily: "'Tajawal', system-ui",
                      fontWeight: isActive ? 700 : 400,
                      whiteSpace: 'nowrap',
                      textShadow: isActive ? '0 0 8px oklch(0.82 0.14 85 / 0.5)' : 'none',
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
        className="absolute left-0 right-0 z-20 flex items-center justify-between px-8"
        style={{ bottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}
        aria-label="شريط التصوير"
      >
        {/* Download/Save */}
        <motion.button
          className="glass-btn"
          style={{ width: 52, height: 52 }}
          whileTap={{ scale: 0.92 }}
          aria-label="حفظ الصورة"
        >
          <Download size={22} color="rgba(255,255,255,0.85)" />
        </motion.button>

        {/* Shutter */}
        <motion.button
          onClick={handleShutter}
          aria-label="التقاط صورة"
          style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          whileTap={{ scale: 0.94 }}
        >
          {/* Outer ring gold gradient */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, oklch(0.82 0.14 85), oklch(0.70 0.12 85))',
              boxShadow: '0 0 20px oklch(0.82 0.14 85 / 0.4)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          {/* Middle ring */}
          <div
            style={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
            }}
          />
          {/* Inner circle */}
          <motion.div
            animate={controls}
            style={{
              position: 'absolute',
              inset: 12,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: shutterActive ? '0 0 20px #ffffff' : 'none',
            }}
          />
        </motion.button>

        {/* Right side stack: RefreshCcw + Flash */}
        <div className="flex flex-col items-center gap-3">
          {/* Flash toggle */}
          <motion.button
            onClick={() => setFlash((f) => !f)}
            className="glass-btn"
            style={{
              width: 36,
              height: 36,
              boxShadow: flash ? '0 0 12px oklch(0.82 0.14 85 / 0.6)' : 'none',
              borderColor: flash ? 'oklch(0.82 0.14 85 / 0.5)' : 'rgba(255,255,255,0.15)',
            }}
            whileTap={{ scale: 0.9 }}
            aria-label={flash ? 'إيقاف الفلاش' : 'تشغيل الفلاش'}
            aria-pressed={flash}
          >
            {flash ? (
              <Zap size={16} color="oklch(0.82 0.14 85)" fill="oklch(0.82 0.14 85)" />
            ) : (
              <ZapOff size={16} color="rgba(255,255,255,0.7)" />
            )}
          </motion.button>

          {/* Flip camera */}
          <motion.button
            className="glass-btn"
            style={{ width: 52, height: 52 }}
            whileTap={{ scale: 0.92, rotate: 180 }}
            aria-label="قلب الكاميرا"
          >
            <RefreshCcw size={22} color="rgba(255,255,255,0.85)" />
          </motion.button>
        </div>
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
