(function () {
  function isTouchDevice() {
    return !!(navigator.maxTouchPoints > 0 || window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  }

  function isIOS() {
    var ua = navigator.userAgent || ''
    return /iPad|iPhone|iPod/.test(ua) || (ua.indexOf('Mac') !== -1 && navigator.maxTouchPoints > 1)
  }

  function injectStyles() {
    if (document.getElementById('pano-motion-styles')) return
    var style = document.createElement('style')
    style.id = 'pano-motion-styles'
    style.textContent = [
      '#pano-motion-toggle{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);z-index:99999;display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:999px;background:rgba(0,0,0,.58);backdrop-filter:blur(14px) saturate(1.1);-webkit-backdrop-filter:blur(14px) saturate(1.1);border:1px solid rgba(255,255,255,.16);color:#fff;font:600 13px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.32)}',
      '#pano-motion-toggle button{appearance:none;border:0;border-radius:999px;padding:10px 14px;background:linear-gradient(135deg,#e4cd96 0%,#c9a96e 100%);color:#28150f;font:700 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.02em;cursor:pointer}',
      '#pano-motion-toggle button:disabled{opacity:.8;cursor:default}',
      '#pano-motion-toggle[data-active="true"]{opacity:.45}',
      '@media (max-width: 720px){#pano-motion-toggle{width:calc(100vw - 24px);max-width:420px;justify-content:space-between;text-align:left}}'
    ].join('')
    document.head.appendChild(style)
  }

  function createMotionToggle(pano) {
    if (!isTouchDevice()) return

    injectStyles()

    var container = document.createElement('div')
    container.id = 'pano-motion-toggle'

    var label = document.createElement('div')
    label.textContent = 'Enable motion control'

    var button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'Enable'

    function refresh() {
      var enabled = false
      try {
        enabled = !!pano.getUseGyro()
      } catch (error) {
        enabled = false
      }

      container.dataset.active = enabled ? 'true' : 'false'
      label.textContent = enabled ? 'Motion control enabled' : 'Move the phone to look around'
      button.textContent = enabled ? 'Enabled' : 'Enable'
      button.disabled = enabled
    }

    button.addEventListener('click', function () {
      if (typeof pano.setUseGyro !== 'function') return
      try {
        pano.setUseGyro(true)
      } catch (error) {
        console.error(error)
      }
      refresh()
    })

    container.appendChild(label)
    container.appendChild(button)
    document.body.appendChild(container)

    if (!isIOS() && typeof pano.setUseGyro === 'function') {
      try {
        pano.setUseGyro(true)
      } catch (error) {
        console.error(error)
      }
    }

    refresh()
    pano.addEventListener('gyrochanged', refresh)
    pano.addEventListener('playerstatechanged', refresh)
  }

  window.initKonozPanoViewer = function (options) {
    var pano = new pano2vrPlayer(options.containerId)
    pano.readConfigUrlAsync(options.configUrl)
    createMotionToggle(pano)
    return pano
  }
})()