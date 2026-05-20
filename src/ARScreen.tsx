import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCcw, Download, Radio, Camera, X, Info } from 'lucide-react'

// ── Types ────────────────────────────────────────
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SelfieSegmentation: any
}

// ── Brand Colors ─────────────────────────────────
const SAND_GOLD  = '#E4CD96'
const SKY_BLUE   = '#C1D8E8'
const BROWN      = '#643A24'
const BROWN_DEEP = '#3e2015'

const FILTERS = [
  { name: 'بحيرات الملح',   src: '/backgrounds/بحيرات الملح .png',   info: 'بحيرات الملح الساحرة في سيوة، مياه فيروزية تعكس صفاء السماء وتمنحك تجربة استشفاء لا تُنسى.' },
  { name: 'بحيرات الملح ٢', src: '/backgrounds/بحيرات الملح.png',    info: 'بحيرة ملح بمياه كريستالية شفافة، تجربة طبيعية فريدة تنعش الجسد وتريح الروح.' },
  { name: 'جبل الدكرور',    src: '/backgrounds/جبل الدكرور.png',     info: 'جبل الدكرور الشهير برمال الشفاء الدافئة، وجهة العلاج بالرمال الطبيعية.' },
  { name: 'جبل الدكرور 2',  src: '/backgrounds/جبل دكرور.png',       info: 'تلال الدكرور المطلة على الواحة الخضراء، مناظر خلابة تمتزج فيها الصحراء والحياة.' },
  { name: 'حمام فرعون',     src: '/backgrounds/حمام فرعون.png',      info: 'حمام فرعون الأثري بسيناء، ينابيع طبيعية ساخنة معروفة منذ آلاف السنين بخصائصها العلاجية.' },
  { name: 'حمام موسى',      src: '/backgrounds/حمام موسي.png',       info: 'حمام موسى بعيون المياه الدافئة، مكان مقدس يجمع بين التاريخ والطبيعة والعلاج.' },
  { name: 'عين كليوباترا',  src: '/backgrounds/عين كيليوبترا .png',  info: 'عين كليوباترا الشهيرة في سيوة، بئر طبيعية صافية تحمل أسرار الحضارة الفرعونية.' },
  { name: 'كهف الملح',      src: '/backgrounds/كهف الملح.png',       info: 'كهف الملح العلاجي بهوائه المشبع بالمعادن، ملاذ طبيعي لتنقية الجهاز التنفسي.' },
  { name: 'كهف الملح ١',    src: '/backgrounds/كهف الملح1.png',      info: 'ممرات كهف الملح المضاءة بألوان هادئة، تجربة حسية عميقة للاسترخاء والتأمل.' },
  { name: 'كهف الملح ٢',    src: '/backgrounds/كهف الملح2.png',      info: 'أروقة ملحية مضاءة بمصابيح ملونة، أجواء ساحرة تأخذك في رحلة إلى عالم السكينة.' },
  { name: 'وادي عسل',       src: '/backgrounds/وادي عسل .png',       info: 'وادي عسل في سيوة، ممر تاريخي يضم أقدم الأبنية الحجرية وسط نخيل ووارف.' },
]

function coverRect(sW: number, sH: number, dW: number, dH: number) {
  const s = Math.max(dW / sW, dH / sH)
  return { x: (dW - sW * s) / 2, y: (dH - sH * s) / 2, w: sW * s, h: sH * s }
}

// ── ARScreen ─────────────────────────────────────
export default function ARScreen({ username }: { username: string }) {
  const [filterIdx, setFilterIdx]   = useState(0)
  const filterIdxRef                = useRef(filterIdx)
  const [showInfo, setShowInfo]     = useState<number | null>(null)
  const [status, setStatus]         = useState('')

  useEffect(() => { filterIdxRef.current = filterIdx }, [filterIdx])

  const [running, setRunning]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [facingMode, setFacingMode] = useState<'user'|'environment'>('user')
  const [photoUrl, setPhotoUrl]     = useState<string|null>(null)
  const [showFlash, setShowFlash]   = useState(false)

  const videoRef      = useRef<HTMLVideoElement>(null)
  const outputRef     = useRef<HTMLCanvasElement>(null)
  const personRef     = useRef<HTMLCanvasElement>(null)
  const bgRef         = useRef<HTMLCanvasElement>(null)
  const segRef        = useRef<unknown>(null)
  const streamRef     = useRef<MediaStream|null>(null)
  const rafRef        = useRef<number|null>(null)
  const busyRef       = useRef(false)
  const imgCacheRef   = useRef<Map<string, Promise<HTMLImageElement>>>(new Map())

  const loadImg = useCallback((src: string): Promise<HTMLImageElement> => {
    if (!imgCacheRef.current.has(src)) {
      const p = new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src
      })
      imgCacheRef.current.set(src, p)
    }
    return imgCacheRef.current.get(src)!
  }, [])

  const resizeOutput = useCallback(() => {
    const canvas = outputRef.current; if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(window.innerWidth * dpr)
    const h = Math.round(window.innerHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onResults = useCallback(async (results: any) => {
    const out = outputRef.current
    const person = personRef.current
    const bg = bgRef.current
    const video = videoRef.current
    if (!out || !person || !bg || !video || !video.videoWidth) return

    resizeOutput()
    const w = out.width, h = out.height
    const ctx = out.getContext('2d', { alpha: false })!
    const pCtx = person.getContext('2d')!
    const bCtx = bg.getContext('2d', { alpha: false })!

    person.width = w; person.height = h
    bg.width = w; bg.height = h

    const bgImg = await loadImg(FILTERS[filterIdxRef.current].src)
    const bgR = coverRect(bgImg.naturalWidth, bgImg.naturalHeight, w, h)

    const personScale = 0.60
    const personH = h * personScale
    const personAspect = video.videoWidth / video.videoHeight
    const personW = personH * personAspect
    const personX = (w - personW) / 2
    const personY = h - personH

    bCtx.clearRect(0, 0, w, h)
    bCtx.drawImage(bgImg, bgR.x, bgR.y, bgR.w, bgR.h)

    pCtx.clearRect(0, 0, w, h)
    pCtx.drawImage(results.image, personX, personY, personW, personH)
    pCtx.globalCompositeOperation = 'destination-in'
    pCtx.filter = 'blur(0.7px)'
    pCtx.drawImage(results.segmentationMask, personX, personY, personW, personH)
    pCtx.filter = 'none'
    pCtx.globalCompositeOperation = 'source-over'

    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(bg, 0, 0)
    ctx.drawImage(person, 0, 0)
  }, [loadImg, resizeOutput])

  const startCamera = useCallback(async (facing: 'user'|'environment') => {
    setLoading(true)
    setStatus('جاري تشغيل الكاميرا...')
    try {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      if (!segRef.current) {
        const s = new SelfieSegmentation({
          locateFile: (f: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
        })
        s.setOptions({ modelSelection: 0, selfieMode: facing === 'user' })
        s.onResults(onResults)
        segRef.current = s
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(segRef.current as any).setOptions({ selfieMode: facing === 'user' })
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      setRunning(true)
      setStatus(' ')

      const loop = async () => {
        if (!busyRef.current && videoRef.current && videoRef.current.readyState >= 2) {
          busyRef.current = true
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (segRef.current as any).send({ image: videoRef.current })
          } catch { /* ignore */ } finally {
            busyRef.current = false
          }
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'خطأ في الكاميرا'
      setStatus(msg)
    } finally {
      setLoading(false)
    }
  }, [onResults])

  const flipCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    if (running) startCamera(next)
  }, [facingMode, running, startCamera])

  const capture = useCallback(() => {
    const canvas = outputRef.current; if (!canvas) return
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 260)
    canvas.toBlob(blob => {
      if (!blob) return
      if (photoUrl) URL.revokeObjectURL(photoUrl)
      const url = URL.createObjectURL(blob)
      setPhotoUrl(url)
    }, 'image/png', 1)
  }, [photoUrl])

  const downloadPhoto = useCallback(() => {
    if (!photoUrl) { setStatus('التقط صورة أولاً'); return }
    const a = document.createElement('a'); a.href = photoUrl; a.download = 'konoz-ar.png'; a.click()
  }, [photoUrl])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (photoUrl) URL.revokeObjectURL(photoUrl)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    window.addEventListener('resize', resizeOutput)
    resizeOutput()
    return () => window.removeEventListener('resize', resizeOutput)
  }, [resizeOutput])

  // ── Shared style helpers ──
  const glassPanel = {
    background: 'rgba(10, 6, 4, 0.55)',
    backdropFilter: 'blur(20px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
    border: `1px solid ${SAND_GOLD}22`,
    borderRadius: 9999,
  } as const

  const goldBtnShadow = `0 0 18px ${SAND_GOLD}30, 0 4px 12px rgba(0,0,0,0.35)`

  return (
    <motion.section
      key="main"
      className="absolute inset-0"
      initial={{ opacity: 0, filter: 'blur(20px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)', transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, filter: 'blur(20px)', transition: { duration: 0.6, ease: 'easeIn' } }}
      aria-label="شاشة الكاميرا AR"
    >
      {/* Hidden elements */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={personRef} style={{ display: 'none' }} />
      <canvas ref={bgRef} style={{ display: 'none' }} />

      {/* Main canvas */}
      <canvas
        ref={outputRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-label="بث الكاميرا المباشر"
      />

      {/* Dark fallback when camera off */}
      {!running && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 40,
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, ${BROWN_DEEP}cc 0%, #0a0604 55%, #020101 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: `rgba(100, 58, 36, 0.12)`,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: `1px solid ${SAND_GOLD}20`,
              padding: '36px 28px',
              borderRadius: '28px',
              textAlign: 'center',
              maxWidth: '340px',
              width: '90%',
              boxShadow: `0 30px 70px rgba(0,0,0,0.45), 0 0 60px ${BROWN}18`,
            }}
          >
            {/* Logo */}
            <motion.div
              style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
              animate={{ y: [0, -5, 0], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img
                src="/konoz-logo.png"
                alt="كنوز"
                style={{ width: 70, height: 70, objectFit: 'contain',
                  filter: `drop-shadow(0 0 16px ${SAND_GOLD}50)` }}
              />
            </motion.div>

            <Camera size={36} color={SAND_GOLD} style={{ margin: '0 auto 14px' }} />
            <h3 style={{
              fontSize: '20px', marginBottom: '10px', color: 'white',
              fontFamily: 'var(--font-arabic)', fontWeight: 700,
            }}>
              الوصول للكاميرا
            </h3>
            <p style={{
              fontSize: '14px', color: 'rgba(245,239,227,0.65)',
              marginBottom: '28px', fontFamily: 'var(--font-arabic)', lineHeight: 1.7,
            }}>
              لخوض تجربة الواقع المعزز، يرجى السماح للتطبيق باستخدام الكاميرا.
            </p>
            <motion.button
              id="allow-camera-btn"
              onClick={() => startCamera(facingMode)}
              disabled={loading}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              style={{
                background: `linear-gradient(135deg, ${SAND_GOLD} 0%, #c9a96e 100%)`,
                color: BROWN_DEEP, border: 'none', padding: '14px 24px', borderRadius: '999px',
                fontSize: '16px', fontWeight: 'bold', fontFamily: 'var(--font-arabic)',
                cursor: 'pointer', width: '100%',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: goldBtnShadow,
              }}
            >
              {loading ? (
                <motion.div
                  style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${BROWN_DEEP}30`, borderTopColor: BROWN_DEEP }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : 'السماح للكاميرا'}
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            key="flash"
            style={{ position: 'absolute', inset: 0, background: 'rgba(228,205,150,0.35)', zIndex: 50, pointerEvents: 'none' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.26 }}
          />
        )}
      </AnimatePresence>

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingLeft: 16, paddingRight: 16, paddingBottom: 12,
        pointerEvents: 'none',
      }}>
        {/* Greeting */}
        <div style={{ pointerEvents: 'auto', maxWidth: '38%', overflow: 'hidden' }}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              ...glassPanel,
              padding: '6px 14px',
              fontSize: 13,
              color: `${SAND_GOLD}cc`,
              fontFamily: 'var(--font-arabic)',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            مرحباً، {username}
          </motion.div>
        </div>

        {/* Center: كنوز logo chip + LIVE */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          top: 'max(16px, env(safe-area-inset-top, 16px))',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          pointerEvents: 'auto',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            ...glassPanel,
            padding: '6px 14px',
          }}>
            <img
              src="/konoz-logo.png"
              alt="كنوز"
              style={{ width: 22, height: 22, objectFit: 'contain',
                filter: `drop-shadow(0 0 6px ${SAND_GOLD}80)` }}
            />
            <motion.div
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: running ? '#ff5f5f' : '#888',
                boxShadow: running ? '0 0 8px #ff5f5faa' : 'none',
              }}
              animate={running ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
              color: running ? 'rgba(245,239,227,0.9)' : 'rgba(245,239,227,0.5)',
              fontFamily: 'var(--font-ui)',
            }}>
              {running ? 'AR مباشر' : 'غير نشط'}
            </span>
            <Radio size={12} color={`${SAND_GOLD}90`} />
          </div>
        </div>

        {/* Flip camera */}
        <div style={{ pointerEvents: 'auto', flexShrink: 0 }}>
          <motion.button
            id="flip-camera-btn"
            onClick={flipCamera}
            className="glass-btn"
            style={{
              width: 46, height: 46,
              border: `1px solid ${SAND_GOLD}22`,
              boxShadow: `0 4px 16px rgba(0,0,0,0.3)`,
            }}
            whileTap={{ scale: 0.88, rotate: 180 }}
            whileHover={{ boxShadow: `0 0 16px ${SAND_GOLD}25, 0 4px 16px rgba(0,0,0,0.3)` }}
            aria-label="قلب الكاميرا"
          >
            <RefreshCcw size={18} color={`${SAND_GOLD}cc`} />
          </motion.button>
        </div>
      </div>

      {/* ── Filter carousel ── */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 136, zIndex: 20 }}>
        <div
          className="no-scrollbar"
          style={{
            display: 'flex', gap: 14, overflowX: 'auto',
            padding: '10px 24px', scrollSnapType: 'x mandatory', direction: 'ltr',
          }}
          role="listbox"
          aria-label="اختر خلفية"
        >
          {FILTERS.map((f, i) => {
            const active = filterIdx === i
            return (
              <motion.button
                key={f.name}
                id={`filter-btn-${i}`}
                onClick={() => {
                  if (active) setShowInfo(i)
                  else setFilterIdx(i)
                }}
                role="option"
                aria-selected={active}
                style={{ scrollSnapAlign: 'center', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: active ? 1.18 : 1.06 }}
              >
                <motion.div
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                >
                  <div style={{ position: 'relative', width: 62, height: 62, borderRadius: '50%' }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      backgroundImage: `url('${f.src}')`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      border: active ? `2.5px solid ${SAND_GOLD}` : `1.5px solid rgba(255,255,255,0.18)`,
                      boxShadow: active
                        ? `0 0 0 2px ${SKY_BLUE}50, 0 0 22px ${SAND_GOLD}45, 0 4px 16px rgba(0,0,0,0.4)`
                        : '0 4px 14px rgba(0,0,0,0.35)',
                      transition: 'border 0.25s, box-shadow 0.25s',
                    }} />
                    {active && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.45)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Info size={22} color={SAND_GOLD} />
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, whiteSpace: 'nowrap',
                    color: active ? SAND_GOLD : 'rgba(245,239,227,0.45)',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: active ? 700 : 400,
                    textShadow: active ? `0 0 10px ${SAND_GOLD}60` : 'none',
                    transition: 'color 0.25s',
                  }}>
                    {f.name}
                  </span>
                </motion.div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 36px',
        bottom: 'max(30px, env(safe-area-inset-bottom, 30px))',
      }}>
        {/* Download */}
        <motion.button
          id="download-photo-btn"
          onClick={downloadPhoto}
          className="glass-btn"
          style={{
            width: 54, height: 54,
            border: `1px solid ${SAND_GOLD}22`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ boxShadow: `0 0 18px ${SAND_GOLD}30, 0 4px 16px rgba(0,0,0,0.3)` }}
          aria-label="تحميل آخر صورة"
        >
          <Download size={22} color={`${SAND_GOLD}cc`} />
        </motion.button>

        {/* Shutter / Start */}
        {running ? (
          <motion.button
            id="shutter-btn"
            onClick={capture}
            aria-label="التقاط صورة"
            style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
          >
            {/* Rotating outer ring */}
            <motion.div
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: `conic-gradient(${SAND_GOLD}, ${SKY_BLUE}, ${SAND_GOLD})`,
                boxShadow: `0 0 28px ${SAND_GOLD}50, 0 0 8px ${SKY_BLUE}30`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            {/* Middle ring */}
            <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', background: '#0a0604' }} />
            {/* Inner white */}
            <div style={{
              position: 'absolute', inset: 8, borderRadius: '50%',
              background: 'white',
              boxShadow: `0 0 12px rgba(255,255,255,0.4)`,
            }} />
          </motion.button>
        ) : (
          <div style={{ width: 88, height: 88 }} />
        )}

        {/* Spacer */}
        <div style={{ width: 54 }} />
      </div>

      {/* ── Status pill ── */}
      <AnimatePresence>
        {status && status.trim() && (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: 'max(12px, env(safe-area-inset-bottom,12px))',
              left: '50%', transform: 'translateX(-50%)',
              ...glassPanel,
              padding: '8px 20px', zIndex: 15,
              fontSize: 12, color: `${SAND_GOLD}cc`, whiteSpace: 'nowrap',
              fontFamily: 'var(--font-arabic)',
            }}
          >
            {status}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Info Modal ── */}
      <AnimatePresence>
        {showInfo !== null && (
          <motion.div
            key="info-modal"
            style={{
              position: 'absolute', inset: 0, zIndex: 40,
              display: 'grid', placeItems: 'center',
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '20px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInfo(null)}
          >
            <motion.div
              initial={{ scale: 0.88, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              style={{
                background: `rgba(10, 6, 4, 0.72)`,
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: `1px solid ${SAND_GOLD}25`,
                padding: '32px 26px', borderRadius: '28px',
                maxWidth: '360px', width: '100%',
                boxShadow: `0 30px 70px rgba(0,0,0,0.5), 0 0 60px ${BROWN}20`,
                textAlign: 'center',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Filter thumbnail */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
                backgroundImage: `url('${FILTERS[showInfo].src}')`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                border: `2px solid ${SAND_GOLD}50`,
                boxShadow: `0 0 30px ${SAND_GOLD}25`,
              }} />
              <h3 style={{ margin: '0 0 14px', fontSize: 22, color: 'white', fontFamily: 'var(--font-arabic)', fontWeight: 700 }}>
                {FILTERS[showInfo].name}
              </h3>
              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${SAND_GOLD}40, transparent)` }} />
                <span style={{ color: SAND_GOLD, fontSize: 12, opacity: 0.5 }}>𓆣</span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${SAND_GOLD}40, transparent)` }} />
              </div>
              <p style={{ margin: '0 0 28px', fontSize: 15, color: 'rgba(245,239,227,0.72)', lineHeight: 1.75, fontFamily: 'var(--font-arabic)' }}>
                {FILTERS[showInfo].info}
              </p>
              <motion.button
                id="info-modal-close-btn"
                onClick={() => setShowInfo(null)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                style={{
                  width: '100%', padding: '14px', borderRadius: 9999, border: 'none',
                  background: `linear-gradient(135deg, ${SAND_GOLD} 0%, #c9a96e 100%)`,
                  color: BROWN_DEEP, fontWeight: 700, fontSize: 16,
                  fontFamily: 'var(--font-arabic)', cursor: 'pointer',
                  boxShadow: goldBtnShadow,
                }}
              >
                استمرار
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo modal ── */}
      <AnimatePresence>
        {photoUrl && (
          <motion.div
            key="photo-modal"
            style={{
              position: 'absolute', inset: 0, zIndex: 40, display: 'grid', placeItems: 'center',
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              padding: 'max(20px, env(safe-area-inset-top,20px)) 18px max(20px, env(safe-area-inset-bottom,20px))',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{
                width: 'min(900px, 96vw)', borderRadius: 24, padding: 16,
                background: `rgba(10, 6, 4, 0.65)`,
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                border: `1px solid ${SAND_GOLD}22`,
                boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${BROWN}15`,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14 }}>
                <div>
                  <p style={{ margin: 0, color: `${SKY_BLUE}cc`, fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-ui)' }}>
                    KONOZ AR CAPTURE
                  </p>
                  <h2 style={{ margin: '5px 0 0', fontSize: 20, color: '#fff', fontFamily: 'var(--font-arabic)' }}>
                    الصورة مع الخلفية
                  </h2>
                </div>
                <motion.button
                  id="close-photo-modal-btn"
                  onClick={() => setPhotoUrl(null)}
                  className="glass-btn"
                  style={{ width: 44, height: 44, border: `1px solid ${SAND_GOLD}20` }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="إغلاق"
                >
                  <X size={18} color={`${SAND_GOLD}cc`} />
                </motion.button>
              </div>

              {/* Preview */}
              <img
                src={photoUrl}
                alt="الصورة الملتقطة"
                style={{
                  display: 'block', width: '100%',
                  maxHeight: 'min(60vh,560px)', objectFit: 'contain',
                  borderRadius: 16, background: '#0a0604',
                  border: `1px solid ${SAND_GOLD}15`,
                }}
              />

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14 }}>
                <motion.button
                  id="retake-photo-btn"
                  onClick={() => setPhotoUrl(null)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '12px 22px', borderRadius: 9999, border: `1px solid ${SAND_GOLD}20`,
                    background: 'rgba(228,205,150,0.07)', color: `${SAND_GOLD}cc`,
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  إعادة التصوير
                </motion.button>
                <motion.a
                  id="save-photo-btn"
                  href={photoUrl}
                  download="konoz-ar.png"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    padding: '12px 22px', borderRadius: 9999,
                    background: `linear-gradient(135deg, ${SAND_GOLD} 0%, #c9a96e 100%)`,
                    color: BROWN_DEEP, fontWeight: 700, textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontFamily: 'var(--font-arabic)', fontSize: 15,
                    boxShadow: goldBtnShadow,
                  }}
                >
                  <Download size={16} />
                  حفظ الصورة
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
