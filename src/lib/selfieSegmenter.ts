import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision'

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite'

export async function createSelfieSegmenter(): Promise<ImageSegmenter> {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE)
  return ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: isIOS ? 'CPU' : 'GPU',
    },
    runningMode: 'VIDEO',
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  })
}
