import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

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
  const ref = { current: null as ParticleConfig[] | null }
  if (!ref.current) {
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
// Egyptian Background
// ─────────────────────────────────────────────
function EgyptianBg({ variant = 'dark' }: { variant?: 'dark' | 'warm' }) {
  const baseGradient = variant === 'warm'
    ? 'radial-gradient(ellipse 90% 90% at 50% 100%, #1a0e08 0%, #0f0906 60%, #050302 100%)'
    : 'radial-gradient(ellipse 80% 80% at 50% 50%, #12080480 0%, #0a0604 50%, #020101 100%)'

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div style={{ position: 'absolute', inset: 0, background: baseGradient }} />
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
// DestinationLoading Component
// ─────────────────────────────────────────────
function DestinationLoading({ greeting, onDone }: { greeting: string; onDone: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const total = 2800
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
      className="absolute inset-0 flex flex-col items-center justify-center"
      variants={stageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      aria-label="شاشة التحميل"
    >
      <EgyptianBg variant="dark" />
      <Particles count={50} />

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
        {greeting}
      </motion.h1>

      <motion.div
        className="relative z-10"
        style={{ marginTop: 20 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.6 }}
      >
        <OrnamentDivider />
      </motion.div>

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
// Gallery Component
// ─────────────────────────────────────────────
export interface GalleryItem {
  title: string
  src: string
  type: 'video' | '360'
}

function Gallery({ items, onClose }: { items: GalleryItem[]; onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const current = items[currentIdx]

  const handleNext = () => setCurrentIdx((i) => (i + 1) % items.length)
  const handlePrev = () => setCurrentIdx((i) => (i - 1 + items.length) % items.length)

  return (
    <motion.div
      className="fixed inset-0 bg-black z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      dir="rtl"
    >
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6 bg-black/40 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={24} color={SAND_GOLD} />
        </button>
        <h2 className="font-arabic text-xl text-center flex-1" style={{ color: SAND_GOLD }}>
          {current.title}
        </h2>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {current.type === 'video' ? (
            <motion.iframe
              key={currentIdx}
              src={current.src}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          ) : (
            <motion.iframe
              key={currentIdx}
              src={current.src}
              allow="accelerometer; gyroscope; magnetometer; fullscreen"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="relative z-10 flex justify-between items-center p-6 bg-black/40 backdrop-blur-sm border-t border-white/10">
        <button
          onClick={handleNext}
          className="p-3 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="التالي"
        >
          <ChevronRight size={28} color={SAND_GOLD} />
        </button>

        <div className="text-center font-arabic" style={{ color: `${SAND_GOLD}99` }}>
          <span>{currentIdx + 1}</span> / <span>{items.length}</span>
        </div>

        <button
          onClick={handlePrev}
          className="p-3 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="السابق"
        >
          <ChevronLeft size={28} color={SAND_GOLD} />
        </button>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Main DestinationScreen Component
// ─────────────────────────────────────────────
export interface DestinationScreenProps {
  greeting: string
  items: GalleryItem[]
  onClose: () => void
}

export default function DestinationScreen({ greeting, items, onClose }: DestinationScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showGallery, setShowGallery] = useState(false)

  const handleLoadingDone = () => {
    setIsLoading(false)
    setShowGallery(true)
  }

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
        {isLoading ? (
          <DestinationLoading
            key="loading"
            greeting={greeting}
            onDone={handleLoadingDone}
          />
        ) : showGallery ? (
          <Gallery
            key="gallery"
            items={items}
            onClose={onClose}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
