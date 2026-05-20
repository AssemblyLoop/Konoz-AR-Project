import { useState, useEffect, useRef, useCallback } from 'react'
import {
  motion,
  AnimatePresence,
  type Variants,
} from 'framer-motion'
import ARScreen from './ARScreen'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Stage = 'intro' | 'welcome' | 'personal' | 'main'

// ─────────────────────────────────────────────
// Brand Colors
// ─────────────────────────────────────────────
const SAND_GOLD  = '#E4CD96'
const SKY_BLUE   = '#C1D8E8'
const BROWN      = '#643A24'
const BROWN_DEEP = '#3e2015'
const SAND_GLOW  = '#f0dca8'

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
  type: 'circle' | 'dot'
}

function useParticles(count: number): ParticleConfig[] {
  const ref = useRef<ParticleConfig[]>([])
  if (ref.current.length === 0) {
    const colors = [SAND_GOLD, SKY_BLUE, SAND_GLOW, 'rgba(228,205,150,0.5)', 'rgba(193,216,232,0.4)']
    ref.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: Math.random() > 0.7 ? 'dot' : 'circle',
    }))
  }
  return ref.current
}

function Particles({ count = 40, className = '' }: { count?: number; className?: string }) {
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
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 16 - 8, 0],
            opacity: [0, 0.75, 0],
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
// Premium Egyptian Background
// ─────────────────────────────────────────────
function EgyptianBg({ variant = 'dark' }: { variant?: 'dark' | 'warm' }) {
  const baseGradient = variant === 'warm'
    ? 'radial-gradient(ellipse 90% 90% at 50% 100%, #1a0e08 0%, #0f0906 60%, #050302 100%)'
    : 'radial-gradient(ellipse 80% 80% at 50% 50%, #12080480 0%, #0a0604 50%, #020101 100%)'

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Deep base */}
      <div style={{ position: 'absolute', inset: 0, background: baseGradient }} />

      {/* Warm sand-gold nebula — top left */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-15%',
          width: '65%',
          height: '65%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${SAND_GOLD}22 0%, transparent 70%)`,
          filter: 'blur(80px)',
        }}
        animate={{ x: [0, 50, -20, 0], y: [0, 30, -15, 0], scale: [1, 1.12, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Sky blue nebula — bottom right */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '55%',
          height: '55%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${SKY_BLUE}1a 0%, transparent 70%)`,
          filter: 'blur(90px)',
        }}
        animate={{ x: [0, -40, 20, 0], y: [0, -25, 40, 0], scale: [1, 1.10, 0.93, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Brown accent — center */}
      <motion.div
        style={{
          position: 'absolute',
          top: '30%',
          left: '35%',
          width: '30%',
          height: '40%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BROWN}18 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Konoz Logo Component
// ─────────────────────────────────────────────
function KonozLogo({ size = 180, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <div
      style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Outer glow ring */}
      {glow && (
        <motion.div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${SAND_GOLD}18 0%, transparent 70%)`,
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Logo image */}
      <img
        src="/konoz-logo.png"
        alt="شعار كنوز"
        className="konoz-logo"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Ornamental divider
// ─────────────────────────────────────────────
function OrnamentDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 260 }}>
      <div className="divider-gold" style={{ flex: 1 }} />
      <span style={{ color: SAND_GOLD, opacity: 0.5, fontSize: 12 }}>𓆣</span>
      <div className="divider-gold" style={{ flex: 1 }} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Stage variants
// ─────────────────────────────────────────────
const stageVariants: Variants = {
  initial: { opacity: 0, filter: 'blur(24px)', scale: 0.98 },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    filter: 'blur(24px)',
    scale: 0.97,
    transition: { duration: 0.65, ease: 'easeIn' },
  },
}

// ─────────────────────────────────────────────
// IntroScreen (Loading)
// ─────────────────────────────────────────────
function IntroScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const total = 3800
    const interval = 40
    const step = (interval / total) * 100
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + step, 100))
    }, interval)

    const done = setTimeout(() => {
      clearInterval(timer)
      setTimeout(onDone, 600)
    }, total)

    return () => { clearInterval(timer); clearTimeout(done) }
  }, [onDone])

  return (
    <motion.section
      key="intro"
      className="absolute inset-0 flex flex-col items-center justify-center"
      variants={stageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      aria-label="شاشة التحميل"
    >
      <EgyptianBg variant="dark" />
      <Particles count={50} />

      {/* Cinematic sun glow behind logo */}
      <motion.div
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${SAND_GOLD}20 0%, ${SKY_BLUE}0a 40%, transparent 70%)`,
          filter: 'blur(40px)',
          zIndex: 1,
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rotating outer ring */}
      <motion.div
        style={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '50%',
          border: `1px solid ${SAND_GOLD}28`,
          zIndex: 2,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      {/* Counter-rotating dashed ring */}
      <motion.div
        style={{
          position: 'absolute',
          width: 240,
          height: 240,
          borderRadius: '50%',
          border: `1px dashed ${SKY_BLUE}20`,
          zIndex: 2,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      />

      {/* Logo — floating breathing */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <KonozLogo size={170} glow />
        </motion.div>
      </motion.div>

      {/* Brand name */}
      <motion.h1
        className="relative z-10 gradient-text-aurora font-arabic"
        style={{
          fontSize: 52,
          fontWeight: 700,
          marginTop: 24,
          letterSpacing: '0.05em',
          textAlign: 'center',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.9, ease: 'easeOut' }}
      >
        كنوز
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="relative z-10 font-ui"
        style={{
          marginTop: 6,
          fontSize: 11,
          letterSpacing: '0.32em',
          color: `${SAND_GOLD}70`,
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.9 }}
      >
        KONOZ · EGYPTIAN WELLNESS
      </motion.p>

      {/* Ornament */}
      <motion.div
        className="relative z-10"
        style={{ marginTop: 20 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.6 }}
      >
        <OrnamentDivider />
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="relative z-10"
        style={{ marginTop: 32, width: '100%', maxWidth: 280, padding: '0 24px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.7 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.3em', color: `${SAND_GOLD}55`, fontFamily: 'var(--font-ui)', textTransform: 'uppercase' }}>
            Loading
          </span>
          <span style={{ fontSize: 9, letterSpacing: '0.2em', color: `${SAND_GOLD}55`, fontFamily: 'var(--font-ui)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="progress-track">
          <motion.div
            className="progress-fill"
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
function WelcomeScreen({ onNext }: { onNext: (name: string) => void }) {
  const [username, setUsername] = useState('')
  const active = username.trim().length > 0

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
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${BROWN_DEEP} 0%, #150b07 35%, #0a0604 75%, #020202 100%)`,
        }}
        aria-hidden="true"
      />

      {/* Warm glow layers */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-5%', left: '-5%', right: '-5%',
          height: '50%',
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${SAND_GOLD}12 0%, transparent 70%)`,
          filter: 'blur(30px)',
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <Particles count={30} />

      {/* Glass card */}
      <motion.div
        className="relative z-10 glass-warm rounded-3xl w-full"
        style={{
          maxWidth: 380,
          padding: '36px 28px',
          boxShadow: `0 0 80px ${BROWN}18, 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(228,205,150,0.1)`,
        }}
        initial={{ opacity: 0, y: 50, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo small */}
        <motion.div
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <KonozLogo size={80} glow />
        </motion.div>

        {/* Title */}
        <h1
          className="gradient-text-gold font-arabic"
          style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}
        >
          أهلاً بك في كنوز
        </h1>

        {/* Subtitle */}
        <p
          className="font-arabic"
          style={{ color: `${SAND_GOLD}80`, fontSize: 14, textAlign: 'center', lineHeight: 1.8, marginBottom: 24 }}
        >
          ابدأ رحلتك نحو عالم من الجمال المصري الأصيل
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <OrnamentDivider />
        </div>

        {/* Input */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && active && onNext(username.trim())}
          placeholder="اكتب اسمك..."
          aria-label="أدخل اسمك"
          maxLength={40}
          className="konoz-input"
          style={{ marginBottom: 16 }}
        />

        {/* CTA Button */}
        <motion.button
          id="start-journey-btn"
          onClick={() => active && onNext(username.trim())}
          disabled={!active}
          aria-label="ابدأ الرحلة"
          whileHover={{ scale: active ? 1.03 : 1 }}
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          style={{
            width: '100%',
            background: active
              ? `linear-gradient(135deg, ${SAND_GOLD} 0%, #c9a96e 100%)`
              : 'rgba(255,255,255,0.06)',
            color: active ? BROWN_DEEP : 'rgba(255,255,255,0.25)',
            boxShadow: active ? `0 0 28px ${SAND_GOLD}35, 0 4px 20px rgba(0,0,0,0.3)` : 'none',
          }}
        >
          {active ? 'ابدأ الرحلة ✦' : 'ابدأ الرحلة'}
        </motion.button>

        {/* Egyptian glyphs */}
        <p
          style={{ textAlign: 'center', marginTop: 20, fontSize: 18, opacity: 0.25, letterSpacing: '0.4em', color: SAND_GOLD }}
          aria-hidden="true"
        >
          𓂀 𓁹 𓋹
        </p>
      </motion.div>
    </motion.section>
  )
}

// ─────────────────────────────────────────────
// PersonalLoading
// ─────────────────────────────────────────────
function LetterByLetter({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(' ')
  return (
    <span aria-label={text} style={{ display: 'inline-flex', gap: '0.3em', flexWrap: 'wrap', justifyContent: 'center' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(8px)', y: 6 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ delay: delay + i * 0.18, duration: 0.5, ease: 'easeOut' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

const GLYPHS = ['𓂀', '𓁹', '𓋹', '𓊽', '𓆣']

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
    ref.current = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      glyph: GLYPHS[i % GLYPHS.length],
      x: Math.random() * 90 + 5,
      delay: Math.random() * 2,
      duration: Math.random() * 4 + 4,
      size: Math.random() * 14 + 16,
    }))
  }
  return ref.current
}

function PersonalLoading({ username, onDone }: { username: string; onDone: () => void }) {
  const glyphs = useGlyphs()

  useEffect(() => {
    const t = setTimeout(onDone, 2400)
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
      aria-label="تحضير تجربتك"
    >
      <EgyptianBg variant="dark" />

      {/* Floating hieroglyphs */}
      {glyphs.map((g) => (
        <motion.span
          key={g.id}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${g.x}%`,
            bottom: '5%',
            fontSize: g.size,
            color: `${SAND_GOLD}50`,
            userSelect: 'none',
          }}
          animate={{ y: [0, -700], opacity: [0, 0.75, 0] }}
          transition={{ duration: g.duration, delay: g.delay, repeat: Infinity, ease: 'easeOut' }}
        >
          {g.glyph}
        </motion.span>
      ))}

      <Particles count={40} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        {/* Pulsing logo */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <KonozLogo size={110} glow />
        </motion.div>

        {/* Greeting */}
        <h2
          className="gradient-text-gold font-arabic"
          style={{
            fontSize: 26,
            fontWeight: 700,
            textShadow: `0 0 20px ${SAND_GOLD}40`,
          }}
        >
          <LetterByLetter text={`مرحباً، ${username}`} />
        </h2>

        {/* Status */}
        <p
          className="font-arabic"
          style={{ color: `${SKY_BLUE}99`, fontSize: 15, lineHeight: 1.6 }}
        >
          <LetterByLetter text="جاري تحضير تجربتك..." delay={0.6} />
        </p>

        {/* Elegant spinner */}
        <div style={{ position: 'relative', width: 44, height: 44 }}>
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1.5px solid ${SAND_GOLD}20`,
              borderTopColor: SAND_GOLD,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            style={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              border: `1px solid ${SKY_BLUE}15`,
              borderBottomColor: SKY_BLUE,
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.section>
  )
}

// ─────────────────────────────────────────────
// Konoz — Root
// ─────────────────────────────────────────────
export default function Konoz() {
  const [stage, setStage] = useState<Stage>('intro')
  const [username, setUsername] = useState('')

  const handleIntroDone   = useCallback(() => setStage('welcome'), [])
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
        height: '100%',
        fontFamily: 'var(--font-arabic)',
        touchAction: 'none',
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
          <ARScreen key="main" username={username} />
        )}
      </AnimatePresence>
    </div>
  )
}
