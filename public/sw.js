// yoso-dev es la versión de desarrollo: el plugin `versiona-sw` del build
// reescribe la constante CACHE en dist/sw.js con yoso-<sha-git> — el navegador
// detecta el cambio de bytes, reinstala el SW y el 'activate' purga las
// cachés de versiones anteriores. Nunca se bumpea a mano.
const CACHE = 'yoso-dev'

// ORT wasm no va aquí: la variante se elige en runtime según el browser.
const PRECACHE = [
  '/',
  '/YOSO.onnx',
  '/Centroides.json',
  '/favicon.svg',
  '/manifest.json',
  '/mediapipe/hand_landmarker.task',
  '/mediapipe/vision_wasm_internal.js',
  '/mediapipe/vision_wasm_internal.wasm',
]

// Assets que usan stale-while-revalidate: servir de caché inmediatamente
// pero re-descargar en background para la próxima visita.
const SWR_ASSETS = new Set(['/YOSO.onnx', '/Centroides.json'])

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
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .catch(() => {})
  )
  self.clients.claim()
})

function guardarEnCache(req, res) {
  const clone = res.clone()
  caches.open(CACHE)
    .then(c => c.put(req, clone))
    .catch(() => {})
}

function safeMatch(req) {
  // caches.match puede rechazar en algunos contextos (ServiceWorker sin scope correcto)
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

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) guardarEnCache(e.request, res)
          return res
        })
        .catch(() =>
          safeMatch(e.request)
            .then(c => c ?? safeMatch('/'))
            .then(c => c ?? new Response(
              '<!doctype html><html lang="es"><meta charset="utf-8">' +
              '<meta name="viewport" content="width=device-width,initial-scale=1">' +
              '<title>YOSO sin conexión</title>' +
              '<style>body{margin:0;display:grid;place-items:center;min-height:100vh;' +
              'background:#192A4B;color:#F0F4FC;font:500 15px/1.5 system-ui,sans-serif;' +
              'text-align:center;padding:24px}h1{margin:0 0 12px;font-size:20px;color:#5B8BD5}' +
              'p{margin:0;max-width:32ch;opacity:.8}</style>' +
              '<h1>YOSO sin conexión</h1>' +
              '<p>No hay red ni copia en caché. Reintenta cuando recuperes la conexión.</p>',
              { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            ))
        )
    )
    return
  }

  // Stale-while-revalidate para modelo y centroides:
  // sirve de caché al instante, pero revalida en background.
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

  // Assets Vite van hasheados (inmutables), los no hasheados se invalidan subiendo CACHE.
  e.respondWith(
    safeMatch(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.ok) guardarEnCache(e.request, res)
        return res
      }).catch(() => new Response('', { status: 503 }))
    })
  )
})
