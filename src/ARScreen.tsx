import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCcw, Download, Radio, Camera, X, Info } from 'lucide-react'

// ── Types ────────────────────────────────────────
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SelfieSegmentation: any
}

const FILTERS = [
  { name: 'Trees',       src: '/backgrounds/trees_water.jpg', info: 'اكتشف جمال الأشجار المندمجة مع المياه الكريستالية، تجربة تعكس الهدوء والطبيعة الخلابة.' },
  { name: 'Oasis',       src: '/backgrounds/oasis_wide.jpg', info: 'واحة طبيعية واسعة توفر لك مساحة للتأمل والاسترخاء في أحضان الطبيعة الدافئة.' },
  { name: 'Salt Pool',   src: '/backgrounds/salt_pool.jpg', info: 'بركة الملح الغنية بالمعادن المفيدة للصحة، تجربة فريدة للاستشفاء الطبيعي.' },
  { name: 'Lagoon',      src: '/backgrounds/blue_lagoon_wide.jpg', info: 'البحيرة الزرقاء الساحرة، مياه نقية ومناظر تريح العين وتهدئ الأعصاب.' },
  { name: 'Clear Water', src: '/backgrounds/clear_water.jpg', info: 'مياه صافية تعكس نقاء الطبيعة، استمتع بصفاء الذهن والروح.' },
  { name: 'Tent',        src: '/backgrounds/desert_tent.jpg', info: 'خيمة صحراوية أصيلة تأخذك في رحلة إلى عبق الماضي وسكون الصحراء.' },
  { name: 'Salt Cave',   src: '/backgrounds/salt_cave_center.jpg', info: 'كهف الملح العلاجي، هواء مشبع باليود لتنقية الجهاز التنفسي والشعور بالانتعاش.' },
  { name: 'Tunnel',      src: '/backgrounds/cave_tunnel.jpg', info: 'نفق صخري طبيعي ينقلك إلى عالم من المغامرات والاستكشاف.' },
  { name: 'Gold Room',   src: '/backgrounds/gold_salt_room.jpg', info: 'غرفة الملح الذهبية المضاءة بشكل خافت لتوفير أقصى درجات الاسترخاء العلاجي.' },
  { name: 'Mountain',    src: '/backgrounds/mountain_view.jpg', info: 'إطلالة جبلية شاهقة تمنحك شعوراً بالقوة والشموخ وتجدد طاقاتك.' },
  { name: 'Stairs',      src: '/backgrounds/rock_stairs.jpg', info: 'درجات صخرية عتيقة تحكي قصصاً من الماضي وتقودك نحو آفاق جديدة.' },
  { name: 'Hot Spring',  src: '/backgrounds/hot_spring.png', info: 'ينابيع المياه الساخنة الطبيعية، تجربة لا غنى عنها لراحة العضلات وتجديد الشباب.' },
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

  useEffect(() => {
    filterIdxRef.current = filterIdx
  }, [filterIdx])
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

  // Load image helper
  const loadImg = useCallback((src: string): Promise<HTMLImageElement> => {
    if (!imgCacheRef.current.has(src)) {
      const p = new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src
      })
      imgCacheRef.current.set(src, p)
    }
    return imgCacheRef.current.get(src)!
  }, [])

  // Resize output canvas
  const resizeOutput = useCallback(() => {
    const canvas = outputRef.current; if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(window.innerWidth * dpr)
    const h = Math.round(window.innerHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
  }, [])

  // Segmentation result callback
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
    const vR  = coverRect(video.videoWidth, video.videoHeight, w, h)

    bCtx.clearRect(0, 0, w, h)
    bCtx.drawImage(bgImg, bgR.x, bgR.y, bgR.w, bgR.h)

    pCtx.clearRect(0, 0, w, h)
    pCtx.drawImage(results.image, vR.x, vR.y, vR.w, vR.h)
    pCtx.globalCompositeOperation = 'destination-in'
    pCtx.filter = 'blur(0.7px)'
    pCtx.drawImage(results.segmentationMask, vR.x, vR.y, vR.w, vR.h)
    pCtx.filter = 'none'
    pCtx.globalCompositeOperation = 'source-over'

    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(bg, 0, 0)
    ctx.drawImage(person, 0, 0)
  }, [loadImg, resizeOutput])

  // Start camera + segmenter
  const startCamera = useCallback(async (facing: 'user'|'environment') => {
    setLoading(true)
    setStatus('جاري تشغيل الكاميرا...')
    try {
      // Stop previous stream
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      // Init segmenter
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
    setTimeout(() => setShowFlash(false), 250)
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

  // Cleanup
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

  return (
    <motion.section
      key="main"
      className="absolute inset-0"
      initial={{ opacity: 0, filter: 'blur(20px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)', transition: { duration: 0.85, ease: [0.22,1,0.36,1] } }}
      exit={{ opacity: 0, filter: 'blur(20px)', transition: { duration: 0.6, ease: 'easeIn' } }}
      aria-label="شاشة الكاميرا AR"
    >
      {/* Hidden video element */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />

      {/* Hidden off-screen canvases */}
      <canvas ref={personRef} style={{ display: 'none' }} />
      <canvas ref={bgRef} style={{ display: 'none' }} />

      {/* Main output canvas — full screen */}
      <canvas
        ref={outputRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-label="بث الكاميرا المباشر"
      />

      {/* Dark fallback when camera off */}
      {!running && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 40,
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, oklch(0.10 0.04 195) 0%, oklch(0.08 0.02 220) 50%, #000 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '32px 24px',
              borderRadius: '24px',
              textAlign: 'center',
              maxWidth: '320px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
          >
            <Camera size={48} color="oklch(0.82 0.14 85)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'white', fontFamily: "'Tajawal', system-ui", fontWeight: 700 }}>
              الوصول للكاميرا
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px', fontFamily: "'Tajawal', system-ui", lineHeight: 1.6 }}>
              لخوض تجربة الواقع المعزز، يرجى السماح للتطبيق باستخدام الكاميرا.
            </p>
            <motion.button
              onClick={() => startCamera(facingMode)}
              disabled={loading}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'linear-gradient(135deg, oklch(0.78 0.14 195), oklch(0.82 0.14 85))',
                color: '#0a1a1a', border: 'none', padding: '14px 24px', borderRadius: '999px',
                fontSize: '16px', fontWeight: 'bold', fontFamily: "'Tajawal', system-ui",
                cursor: 'pointer', width: '100%',
                display: 'flex', justifyContent: 'center', alignItems: 'center'
              }}
            >
              {loading ? (
                <motion.div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0a1a1a' }} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              ) : (
                'السماح للكاميرا'
              )}
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div key="flash" style={{ position:'absolute',inset:0,background:'white',zIndex:50,pointerEvents:'none' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
        )}
      </AnimatePresence>

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: 'max(16px, env(safe-area-inset-top, 16px)) 16px 12px',
        pointerEvents: 'none',
      }}>
        {/* Greeting (Right side in RTL) */}
        <div style={{ pointerEvents: 'auto', maxWidth: '40%', overflow: 'hidden' }}>
          <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: "'Tajawal', system-ui", whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
          >
            مرحباً، {username}
          </motion.div>
        </div>

        {/* LIVE chip (Center absolute for perfect mobile centering) */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          top: 'max(16px, env(safe-area-inset-top, 16px))', pointerEvents: 'auto',
          display: 'flex', justifyContent: 'center'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9999,
            padding: '6px 12px',
          }}>
            <motion.div
              style={{ width: 7, height: 7, borderRadius: '50%', background: running ? '#ff3b3b' : '#888', boxShadow: running ? '0 0 8px #ff3b3baa' : 'none' }}
              animate={running ? { opacity: [1,0.3,1] } : { opacity: 1 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.9)' }}>AR مباشر</span>
            <Radio size={14} color="rgba(255,255,255,0.6)" />
          </div>
        </div>

        {/* Flip camera (Left side in RTL) */}
        <div style={{ pointerEvents: 'auto', flexShrink: 0 }}>
          <motion.button
            onClick={flipCamera}
            className="glass-btn" style={{ width: 44, height: 44 }}
            whileTap={{ scale: 0.92, rotate: 180 }}
            aria-label="قلب الكاميرا"
          >
            <RefreshCcw size={18} color="rgba(255,255,255,0.85)" />
          </motion.button>
        </div>
      </div>

      {/* ── Filter carousel ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 130, zIndex: 20,
      }}>
        <div
          className="no-scrollbar"
          style={{
            display: 'flex', gap: 14, overflowX: 'auto', padding: '8px 24px',
            scrollSnapType: 'x mandatory', direction: 'ltr',
          }}
          role="listbox" aria-label="اختر خلفية"
        >
          {FILTERS.map((f, i) => {
            const active = filterIdx === i
            return (
              <motion.button
                key={f.name}
                onClick={() => {
                  if (active) setShowInfo(i)
                  else setFilterIdx(i)
                }}
                role="option" aria-selected={active}
                style={{ scrollSnapAlign: 'center', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                >
                  <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '50%' }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      backgroundImage: `url('${f.src}')`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      border: active ? '3px solid oklch(0.82 0.14 85)' : '2px solid rgba(255,255,255,0.2)',
                      boxShadow: active ? '0 0 0 2px oklch(0.78 0.14 195), 0 0 18px oklch(0.82 0.14 85 / 0.5)' : '0 4px 12px rgba(0,0,0,0.3)',
                      transition: 'border 0.2s, box-shadow 0.2s',
                    }} />
                    {active && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Info size={24} color="#ffffff" />
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, whiteSpace: 'nowrap',
                    color: active ? 'oklch(0.82 0.14 85)' : 'rgba(255,255,255,0.55)',
                    fontFamily: "'Tajawal', system-ui",
                    fontWeight: active ? 700 : 400,
                  }}>{f.name}</span>
                </motion.div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Bottom bar: Download | Shutter | Flip ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', bottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
      }}>
        {/* Download */}
        <motion.button
          onClick={downloadPhoto}
          className="glass-btn" style={{ width: 52, height: 52 }}
          whileTap={{ scale: 0.92 }}
          aria-label="تحميل آخر صورة"
        >
          <Download size={22} color="rgba(255,255,255,0.85)" />
        </motion.button>

        {/* Shutter / Start */}
        {running ? (
          <motion.button
            onClick={capture}
            aria-label="التقاط صورة"
            style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            whileTap={{ scale: 0.94 }}
          >
            <motion.div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'linear-gradient(135deg, oklch(0.82 0.14 85), oklch(0.70 0.12 85))',boxShadow:'0 0 20px oklch(0.82 0.14 85 / 0.4)' }} animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
            <div style={{ position:'absolute',inset:6,borderRadius:'50%',background:'rgba(255,255,255,0.3)' }} />
            <div style={{ position:'absolute',inset:12,borderRadius:'50%',background:'#ffffff' }} />
          </motion.button>
        ) : (
          <div style={{ width: 84, height: 84 }} />
        )}

        {/* Placeholder right side */}
        <div style={{ width: 52 }} />
      </div>

      {/* ── Status pill ── */}
      <AnimatePresence>
        {status && (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.3 }}
            style={{
              position: 'absolute', bottom: 'max(10px, env(safe-area-inset-bottom,10px))', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(5,12,18,0.6)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.14)', borderRadius: 9999,
              padding: '7px 18px', zIndex: 15,
              fontSize: 11, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap',
              fontFamily: "'Tajawal', system-ui",
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
            style={{ position:'absolute',inset:0,zIndex:40,display:'grid',placeItems:'center', background:'rgba(0,0,0,0.6)',backdropFilter:'blur(12px)', padding:'20px' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowInfo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'rgba(12, 18, 25, 0.95)', border: '1px solid rgba(255,255,255,0.15)',
                padding: '28px 24px', borderRadius: '24px', maxWidth: '340px', width: '100%',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)', textAlign: 'center'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', marginBottom: 20 }}>
                <Info size={32} color="oklch(0.82 0.14 85)" />
              </div>
              <h3 style={{ margin: '0 0 12px', fontSize: 24, color: 'white', fontFamily: "'Tajawal', system-ui", fontWeight: 700 }}>
                {FILTERS[showInfo].name}
              </h3>
              <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontFamily: "'Tajawal', system-ui" }}>
                {FILTERS[showInfo].info}
              </p>
              <motion.button
                onClick={() => setShowInfo(null)}
                whileTap={{ scale: 0.95 }}
                style={{ marginTop: 28, width: '100%', padding: '14px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, oklch(0.78 0.14 195), oklch(0.82 0.14 85))', color: '#0a1a1a', fontWeight: 700, fontSize: 16, fontFamily: "'Tajawal', system-ui", cursor: 'pointer' }}
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
            style={{ position:'absolute',inset:0,zIndex:40,display:'grid',placeItems:'center', background:'rgba(0,0,0,0.7)',backdropFilter:'blur(20px)', padding:'max(18px, env(safe-area-inset-top,18px)) 18px max(18px, env(safe-area-inset-bottom,18px))' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 40 }}
              style={{
                width: 'min(900px, 96vw)', borderRadius: 24, padding: 16,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
              }}
            >
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom: 12 }}>
                <div>
                  <p style={{ margin:0, color:'oklch(0.78 0.14 195)', fontSize:10, letterSpacing:2, fontWeight:900, textTransform:'uppercase' }}>Normal Capture</p>
                  <h2 style={{ margin:'4px 0 0', fontSize: 20, color:'#fff', fontFamily:"'Tajawal',system-ui" }}>الصورة مع الخلفية</h2>
                </div>
                <motion.button onClick={() => setPhotoUrl(null)} className="glass-btn" style={{ width:42,height:42 }} whileTap={{ scale:0.9 }} aria-label="إغلاق">
                  <X size={18} color="rgba(255,255,255,0.85)" />
                </motion.button>
              </div>

              {/* Preview */}
              <img src={photoUrl} alt="الصورة الملتقطة" style={{ display:'block',width:'100%',maxHeight:'min(60vh,560px)',objectFit:'contain',borderRadius:16,background:'#111' }} />

              {/* Actions */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:14 }}>
                <motion.button onClick={() => setPhotoUrl(null)} whileTap={{ scale:0.95 }}
                  style={{ padding:'12px 22px',borderRadius:9999,border:'none',background:'rgba(255,255,255,0.13)',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:"'Tajawal',system-ui" }}>
                  إعادة التصوير
                </motion.button>
                <motion.a href={photoUrl} download="konoz-ar.png" whileTap={{ scale:0.95 }}
                  style={{ padding:'12px 22px',borderRadius:9999,background:'oklch(0.78 0.14 195)',color:'#0a1a1a',fontWeight:700,textDecoration:'none',display:'flex',alignItems:'center',gap:6,fontFamily:"'Tajawal',system-ui" }}>
                  <Download size={16} /> حفظ الصورة
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
