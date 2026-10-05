// Versión de caché invalidada para forzar actualización inmediata en el navegador
const CACHE = 'yoso-v22-sincelejo-colab'

// Assets pre-cacheados
const PRECACHE = [
  '/',
  '/favicon.svg',
  '/manifest.json',
  '/YOSO.onnx',
  '/Centroides.json',
  '/mediapipe/hand_landmarker.task',
  '/mediapipe/vision_wasm_internal.js',
  '/mediapipe/vision_wasm_internal.wasm',
]

const SWR_ASSETS = new Set(['/YOSO.onnx', '/Centroides.json', '/mediapipe/hand_landmarker.task'])

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(
        PRECACHE.map(url =>
          c.add(new Request(url, { cache: 'reload' })).catch(() => {})
        )
      ))
      .catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] Purgando caché obsoleta:', k)
          return caches.delete(k)
        })
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Notificar a las ventanas abiertas que la nueva versión está activa para disparar el toast
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          for (const client of clients) {
            client.postMessage({ type: 'SW_ACTIVADO', cache: CACHE })
          }
        })
      })
      .catch(() => {})
  )
})

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function guardarEnCache(req, res) {
  if (!res || res.status !== 200 || res.type !== 'basic') return
  const clone = res.clone()
  caches.open(CACHE)
    .then(c => c.put(req, clone))
    .catch(() => {})
}

function safeMatch(req) {
  try {
    return caches.match(req).catch(() => undefined)
  } catch {
    return Promise.resolve(undefined)
  }
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  let url
  try {
    url = new URL(e.request.url)
  } catch {
    return
  }

  if (!url.protocol.startsWith('http')) return

  // 1. Navegación (HTML): Network first para que cualquier cambio en la interfaz se vea de inmediato
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) guardarEnCache(e.request, res)
          return res
        })
        .catch(() => safeMatch(e.request).then(c => c ?? safeMatch('/')))
    )
    return
  }

  // 2. Archivos de código (JS/TS/CSS): Network first para evitar que el navegador quede trabado en código viejo
  if (url.pathname.startsWith('/src/') || url.pathname.endsWith('.ts') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) guardarEnCache(e.request, res)
          return res
        })
        .catch(() => safeMatch(e.request))
    )
    return
  }

  // 3. Stale-while-revalidate para pesos pesados del modelo ONNX y Mediapipe
  if (SWR_ASSETS.has(url.pathname)) {
    e.respondWith(
      safeMatch(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(res => {
          if (res.ok) guardarEnCache(e.request, res)
          return res
        }).catch(() => cached ?? new Response('', { status: 503 }))

        return cached ?? fetchPromise
      })
    )
    return
  }

  // 4. Resto de assets
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) guardarEnCache(e.request, res)
        return res
      })
      .catch(() => safeMatch(e.request))
  )
})
