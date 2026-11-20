import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const expect = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`)
  console.log(`PASS: ${message}`)
}

const read = file => readFile(resolve(root, file), 'utf8')
const robots = await read('public/robots.txt')
const sitemap = await read('public/sitemap.xml')
const security = await read('public/.well-known/security.txt')
const index = await read('index.html')
const vercel = await read('vercel.json')

expect(robots.includes('Sitemap: https://yoso-rust.vercel.app/sitemap.xml'), 'robots declara el sitemap canónico')
expect(robots.includes('Disallow: /YOSO.onnx'), 'robots excluye el modelo')
expect(robots.includes('Disallow: /ort/'), 'robots excluye ORT')
expect(robots.includes('Disallow: /mediapipe/'), 'robots excluye MediaPipe')
expect(sitemap.includes('<loc>https://yoso-rust.vercel.app/</loc>'), 'sitemap contiene la página principal')
expect((sitemap.match(/<loc>/g) ?? []).length === 1, 'sitemap no publica rutas adicionales')
expect(security.includes('Contact: https://github.com/Praskc/yoso/security/advisories/new'), 'security.txt tiene contacto')
expect(index.includes('<link rel="canonical" href="https://yoso-rust.vercel.app/">'), 'index tiene canonical')
expect(index.includes('"@type": "SoftwareApplication"'), 'index tiene JSON-LD')
expect(vercel.includes('"source": "/sw.js"') && vercel.includes('"value": "no-cache"'), 'sw.js no queda cacheado')
expect(vercel.includes('X-Robots-Tag') && vercel.includes('/(YOSO\\\\.onnx|'), 'binarios tienen noindex en Vercel')
expect(vercel.includes('/assets/engine\\\\.worker-.*\\\\.js'), 'worker hashado tiene noindex en Vercel')
expect(vercel.includes('max-age=31536000, immutable'), 'assets hashados tienen cache largo')

const url = process.argv[2]
if (url) {
  const response = await fetch(url)
  expect(response.ok, `producción responde ${response.status}: ${url}`)
  const html = await response.text()
  expect(html.includes('rel="canonical"'), 'producción publica canonical')
}
