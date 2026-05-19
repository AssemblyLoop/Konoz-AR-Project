const video = document.getElementById('camera');
const output = document.getElementById('output');
const ctx = output.getContext('2d', { alpha: false });
const personCanvas = document.getElementById('personCanvas');
const personCtx = personCanvas.getContext('2d');
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d', { alpha: false });
const captureCanvas = document.getElementById('captureCanvas');
const captureCtx = captureCanvas.getContext('2d', { alpha: false });

const startBtn = document.getElementById('startBtn');
const switchBtn = document.getElementById('switchBtn');
const captureBtn = document.getElementById('captureBtn');
const downloadQuickBtn = document.getElementById('downloadQuickBtn');
const statusEl = document.getElementById('status');
const filtersEl = document.getElementById('filters');
const prevFilters = document.getElementById('prevFilters');
const nextFilters = document.getElementById('nextFilters');
const photoModal = document.getElementById('photoModal');
const photoPreview = document.getElementById('photoPreview');
const closeModal = document.getElementById('closeModal');
const retakeBtn = document.getElementById('retakeBtn');
const savePhoto = document.getElementById('savePhoto');

let segmenter = null;
let stream = null;
let cameraRunning = false;
let busy = false;
let selectedFilterIndex = 0;
let rafId = null;
let facingMode = 'user';
let lastPhotoUrl = null;
let fpsFrames = 0;
let fpsLastTime = performance.now();
let currentFps = 0;

const filters = [
  { name: 'Trees', src: 'assets/backgrounds/trees_water.jpg' },
  { name: 'Oasis', src: 'assets/backgrounds/oasis_wide.jpg' },
  { name: 'Salt Pool', src: 'assets/backgrounds/salt_pool.jpg' },
  { name: 'Lagoon', src: 'assets/backgrounds/blue_lagoon_wide.jpg' },
  { name: 'Clear Water', src: 'assets/backgrounds/clear_water.jpg' },
  { name: 'Tent', src: 'assets/backgrounds/desert_tent.jpg' },
  { name: 'Salt Cave', src: 'assets/backgrounds/salt_cave_center.jpg' },
  { name: 'Tunnel', src: 'assets/backgrounds/cave_tunnel.jpg' },
  { name: 'Gold Room', src: 'assets/backgrounds/gold_salt_room.jpg' },
  { name: 'Mountain', src: 'assets/backgrounds/mountain_view.jpg' },
  { name: 'Stairs', src: 'assets/backgrounds/rock_stairs.jpg' },
  { name: 'Hot Spring', src: 'assets/backgrounds/hot_spring.png' }
];

const loadedImages = new Map();

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function getViewportSize() {
  const viewport = window.visualViewport;
  const width = Math.round(viewport?.width || window.innerWidth || document.documentElement.clientWidth);
  const height = Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight);
  return { width, height };
}

function setResponsiveViewportVars() {
  const { height } = getViewportSize();
  document.documentElement.style.setProperty('--app-height', `${height}px`);
}

function resizeOutput() {
  setResponsiveViewportVars();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = getViewportSize();
  const w = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  if (output.width !== w || output.height !== h) {
    output.width = w;
    output.height = h;
  }
}

window.addEventListener('resize', resizeOutput);
window.addEventListener('orientationchange', () => setTimeout(resizeOutput, 250));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeOutput);
resizeOutput();

function coverRect(srcW, srcH, dstW, dstH) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (dstW - w) / 2, y: (dstH - h) / 2, w, h };
}

function loadImage(src) {
  if (loadedImages.has(src)) return loadedImages.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  loadedImages.set(src, promise);
  return promise;
}

async function getSelectedBackground() {
  return loadImage(filters[selectedFilterIndex].src);
}

function renderFilterButtons() {
  filtersEl.innerHTML = '';
  filters.forEach((filter, index) => {
    const btn = document.createElement('button');
    btn.className = `filter-btn ${index === selectedFilterIndex ? 'active' : ''}`;
    btn.type = 'button';
    btn.innerHTML = `<span class="swatch" style="background-image:url('${filter.src}')"></span><span>${filter.name}</span>`;
    btn.onclick = () => {
      selectedFilterIndex = index;
      renderFilterButtons();
      setStatus(`Selected background: ${filter.name}`);
    };
    filtersEl.appendChild(btn);
  });
}
renderFilterButtons();
prevFilters.onclick = () => filtersEl.scrollBy({ left: -260, behavior: 'smooth' });
nextFilters.onclick = () => filtersEl.scrollBy({ left: 260, behavior: 'smooth' });

function createSegmenter() {
  if (typeof SelfieSegmentation === 'undefined') {
    throw new Error('MediaPipe failed to load. Check internet connection and refresh.');
  }
  const s = new SelfieSegmentation({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
  });
  s.setOptions({ modelSelection: 0, selfieMode: true });
  s.onResults(onSegmentationResults);
  return s;
}

async function initSegmenter() {
  if (!segmenter) segmenter = createSegmenter();
  return segmenter;
}

async function startCamera() {
  try {
    setStatus('Starting camera...');
    await initSegmenter();
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 60 }
      }
    });
    video.srcObject = stream;
    await video.play();
    cameraRunning = true;
    setStatus('Live camera is running. Capture now saves the current normal photo without extra boundary fitting.');
    runLoop();
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Camera error. Refresh and try again.', true);
  }
}

function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

async function runLoop() {
  stopLoop();
  const loop = async () => {
    if (!cameraRunning || !segmenter || video.readyState < 2) {
      rafId = requestAnimationFrame(loop);
      return;
    }
    if (!busy) {
      busy = true;
      try {
        await segmenter.send({ image: video });
      } catch (e) {
        console.error(e);
        setStatus('Segmentation error. Refresh the page and try again.', true);
      } finally {
        busy = false;
      }
    }
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

async function onSegmentationResults(results) {
  fpsFrames++;
  const now = performance.now();
  if (now - fpsLastTime > 900) {
    currentFps = Math.round((fpsFrames * 1000) / (now - fpsLastTime));
    fpsFrames = 0;
    fpsLastTime = now;
  }
  await renderLivePreview(results);
}

async function renderLivePreview(results) {
  resizeOutput();
  const w = output.width;
  const h = output.height;
  if (!video.videoWidth || !video.videoHeight) return;

  const bg = await getSelectedBackground();
  const videoRect = coverRect(video.videoWidth, video.videoHeight, w, h);
  const bgRect = coverRect(bg.naturalWidth || bg.width, bg.naturalHeight || bg.height, w, h);

  bgCanvas.width = w;
  bgCanvas.height = h;
  personCanvas.width = w;
  personCanvas.height = h;

  bgCtx.clearRect(0, 0, w, h);
  bgCtx.drawImage(bg, bgRect.x, bgRect.y, bgRect.w, bgRect.h);

  personCtx.clearRect(0, 0, w, h);
  personCtx.drawImage(results.image, videoRect.x, videoRect.y, videoRect.w, videoRect.h);
  personCtx.globalCompositeOperation = 'destination-in';
  personCtx.filter = 'blur(0.7px)';
  personCtx.drawImage(results.segmentationMask, videoRect.x, videoRect.y, videoRect.w, videoRect.h);
  personCtx.filter = 'none';
  personCtx.globalCompositeOperation = 'source-over';

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(bgCanvas, 0, 0);
  ctx.drawImage(personCanvas, 0, 0);
}

async function captureNormalPhoto() {
  if (!cameraRunning || !output.width || !output.height) {
    setStatus('Open the camera first.', true);
    return;
  }
  try {
    captureCanvas.width = output.width;
    captureCanvas.height = output.height;
    captureCtx.drawImage(output, 0, 0);

    if (lastPhotoUrl) URL.revokeObjectURL(lastPhotoUrl);
    const blob = await new Promise(resolve => captureCanvas.toBlob(resolve, 'image/png', 1));
    lastPhotoUrl = URL.createObjectURL(blob);
    photoPreview.src = lastPhotoUrl;
    savePhoto.href = lastPhotoUrl;
    photoModal.classList.remove('hidden');
    setStatus(`Normal photo captured. Live ${currentFps || ''} FPS`);
  } catch (error) {
    console.error(error);
    setStatus('Could not capture the photo. Try again.', true);
  }
}

startBtn.addEventListener('click', startCamera);
switchBtn.addEventListener('click', () => {
  facingMode = facingMode === 'user' ? 'environment' : 'user';
  startCamera();
});
captureBtn.addEventListener('click', captureNormalPhoto);
closeModal.addEventListener('click', () => photoModal.classList.add('hidden'));
retakeBtn.addEventListener('click', () => photoModal.classList.add('hidden'));
downloadQuickBtn.addEventListener('click', () => {
  if (!lastPhotoUrl) {
    setStatus('Take a photo first.');
    return;
  }
  const a = document.createElement('a');
  a.href = lastPhotoUrl;
  a.download = 'ar-filter-photo.png';
  a.click();
});

window.addEventListener('beforeunload', () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (lastPhotoUrl) URL.revokeObjectURL(lastPhotoUrl);
});
