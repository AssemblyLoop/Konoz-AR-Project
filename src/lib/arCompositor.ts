import type { MPMask } from '@mediapipe/tasks-vision'

export const SEGMENT_SIZE = 224
export const MAX_FRAME_MS = 1000 / 12

export interface CompositeBuffers {
  maskCanvas: HTMLCanvasElement
  personCanvas: HTMLCanvasElement
  maskPixels: Uint8ClampedArray | null
  maskW: number
  maskH: number
}

export function createCompositeBuffers(): CompositeBuffers {
  const maskCanvas = document.createElement('canvas')
  const personCanvas = document.createElement('canvas')
  maskCanvas.width = SEGMENT_SIZE
  maskCanvas.height = SEGMENT_SIZE
  personCanvas.width = SEGMENT_SIZE
  personCanvas.height = SEGMENT_SIZE
  return { maskCanvas, personCanvas, maskPixels: null, maskW: 0, maskH: 0 }
}

function smoothAlpha(value: number): number {
  if (value <= 0.18) return 0
  if (value >= 0.78) return 255
  const t = (value - 0.18) / 0.6
  return Math.round(t * t * (3 - 2 * t) * 255)
}

function drawBackgroundCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const iw = image.naturalWidth
  const ih = image.naturalHeight
  if (!iw || !ih) return
  const scale = Math.max(width / iw, height / ih)
  const sw = iw * scale
  const sh = ih * scale
  const sx = (width - sw) / 2
  const sy = (height - sh) / 2
  ctx.drawImage(image, sx, sy, sw, sh)
}

function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) return
  const scale = Math.max(width / vw, height / vh)
  const sw = vw * scale
  const sh = vh * scale
  const sx = (width - sw) / 2
  const sy = (height - sh) / 2
  ctx.drawImage(video, sx, sy, sw, sh)
}

function updateSoftMask(
  maskCtx: CanvasRenderingContext2D,
  mask: MPMask,
  buffers: CompositeBuffers,
) {
  const maskW = mask.width
  const maskH = mask.height
  const maskData = mask.getAsFloat32Array()

  if (!buffers.maskPixels || buffers.maskW !== maskW || buffers.maskH !== maskH) {
    buffers.maskW = maskW
    buffers.maskH = maskH
    buffers.maskPixels = new Uint8ClampedArray(maskW * maskH * 4)
    buffers.maskCanvas.width = maskW
    buffers.maskCanvas.height = maskH
  }

  const pixels = buffers.maskPixels
  for (let i = 0; i < maskData.length; i += 1) {
    const alpha = smoothAlpha(maskData[i])
    const offset = i * 4
    pixels[offset] = 255
    pixels[offset + 1] = 255
    pixels[offset + 2] = 255
    pixels[offset + 3] = alpha
  }

  maskCtx.putImageData(new ImageData(pixels, maskW, maskH), 0, 0)
}

export function renderImmersiveFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  mask: MPMask,
  outWidth: number,
  outHeight: number,
  bgImage: HTMLImageElement | null,
  facingMode: 'user' | 'environment',
  buffers: CompositeBuffers,
) {
  const seg = SEGMENT_SIZE
  const maskCtx = buffers.maskCanvas.getContext('2d', { willReadFrequently: false })
  const personCtx = buffers.personCanvas.getContext('2d', { willReadFrequently: false })
  if (!maskCtx || !personCtx) return

  if (buffers.personCanvas.width !== seg) {
    buffers.personCanvas.width = seg
    buffers.personCanvas.height = seg
  }

  updateSoftMask(maskCtx, mask, buffers)

  personCtx.clearRect(0, 0, seg, seg)
  const mirror = facingMode === 'user'
  if (mirror) {
    personCtx.save()
    personCtx.translate(seg, 0)
    personCtx.scale(-1, 1)
  }
  drawVideoCover(personCtx, video, seg, seg)
  if (mirror) personCtx.restore()

  personCtx.globalCompositeOperation = 'destination-in'
  personCtx.filter = 'blur(5px)'
  personCtx.drawImage(buffers.maskCanvas, 0, 0, buffers.maskW, buffers.maskH, 0, 0, seg, seg)
  personCtx.filter = 'none'
  personCtx.globalCompositeOperation = 'source-over'

  ctx.clearRect(0, 0, outWidth, outHeight)

  if (bgImage?.complete && bgImage.naturalWidth > 0) {
    drawBackgroundCover(ctx, bgImage, outWidth, outHeight)
  } else {
    ctx.fillStyle = '#1a2428'
    ctx.fillRect(0, 0, outWidth, outHeight)
  }

  const personScale = Math.min((outWidth * 0.98) / seg, (outHeight * 0.88) / seg)
  const pw = seg * personScale
  const ph = seg * personScale
  const px = (outWidth - pw) / 2
  const py = outHeight - ph - outHeight * 0.02

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 10
  ctx.drawImage(buffers.personCanvas, px, py, pw, ph)
  ctx.restore()

  const vignette = ctx.createRadialGradient(
    outWidth / 2,
    outHeight / 2,
    outHeight * 0.25,
    outWidth / 2,
    outHeight / 2,
    outHeight * 0.85,
  )
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, outWidth, outHeight)
}
