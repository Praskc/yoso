import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { gzip as gzipCb } from 'node:zlib'
import { promisify } from 'node:util'

const gzip = promisify(gzipCb)

const COOP_HEADERS = {
  'Cross-Origin-Opener-Policy':  'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// Copia los WASM de ORT y MediaPipe a dist/ con paths flat; ORT trae todas las variantes (~76 MB) porque el browser elige una en runtime.
const ASSETS_SELF_HOSTED: Array<[string, string]> = [
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',           'ort/ort-wasm-simd-threaded.mjs'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',          'ort/ort-wasm-simd-threaded.wasm'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs',      'ort/ort-wasm-simd-threaded.jsep.mjs'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm',     'ort/ort-wasm-simd-threaded.jsep.wasm'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.mjs',  'ort/ort-wasm-simd-threaded.asyncify.mjs'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.wasm', 'ort/ort-wasm-simd-threaded.asyncify.wasm'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jspi.mjs',      'ort/ort-wasm-simd-threaded.jspi.mjs'],
  ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jspi.wasm',     'ort/ort-wasm-simd-threaded.jspi.wasm'],
  ['node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js',      'mediapipe/vision_wasm_internal.js'],
  ['node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm',    'mediapipe/vision_wasm_internal.wasm'],
  ['node_modules/@mediapipe/tasks-vision/vision_bundle.cjs',                 'mediapipe/vision_bundle.cjs'],
]

const copiaAssetsSelfHosted: Plugin = {
  name: 'copia-assets-self-hosted',
  apply: 'build',
  async closeBundle() {
    const outDir = resolve(process.cwd(), 'dist')
    for (const [src, dest] of ASSETS_SELF_HOSTED) {
      const srcAbs  = resolve(process.cwd(), src)
      const destAbs = resolve(outDir, dest)
      await mkdir(dirname(destAbs), { recursive: true })
      await copyFile(srcAbs, destAbs)
    }
  }
}

// En dev no corre el copiado (apply: 'build'); este middleware sirve /ort/* y /mediapipe/* desde node_modules.
const sirveAssetsSelfHostedDev: Plugin = {
  name: 'sirve-assets-self-hosted-dev',
  apply: 'serve',
  configureServer(server) {
    const mapa      = new Map(ASSETS_SELF_HOSTED.map(([src, dest]) => ['/' + dest, src]))
    // Cache en memoria para no releer ni recomprimir el mismo archivo en cada request.
    const bufCache  = new Map<string, Buffer>()
    const gzipCache = new Map<string, Buffer>()

    server.middlewares.use(async (req, res, next) => {
      const ruta = (req.url ?? '').split('?')[0]
      const src  = mapa.get(ruta)
      if (!src) { next(); return }
      try {
        if (!bufCache.has(ruta)) {
          bufCache.set(ruta, await readFile(resolve(process.cwd(), src)))
        }
        const buf = bufCache.get(ruta)!
        const ext = ruta.split('.').pop() ?? ''
        const ct  = ext === 'wasm'
          ? 'application/wasm'
          : ext === 'mjs' || ext === 'js' || ext === 'cjs'
            ? 'application/javascript'
            : 'application/octet-stream'
        res.setHeader('Content-Type', ct)
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        for (const [k, v] of Object.entries(COOP_HEADERS)) res.setHeader(k, v)
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')

        // Los .wasm comprimen mal y comprimir 26 MB en dev bloquea segundos, se sirven crudos.
        const esWasm    = ext === 'wasm'
        const aceptaGzip = !esWasm && (req.headers['accept-encoding'] ?? '').toString().includes('gzip')
        if (aceptaGzip) {
          if (!gzipCache.has(ruta)) {
            gzipCache.set(ruta, await gzip(buf))
          }
          res.setHeader('Content-Encoding', 'gzip')
          res.end(gzipCache.get(ruta)!)
        } else {
          res.end(buf)
        }
      } catch (e) {
        next(e as Error)
      }
    })
  }
}

// Excluye los .wasm que Rollup bundlea solo (variantes que no usamos).
const excluirWasmRollup: Plugin = {
  name: 'excluir-wasm-rollup',
  generateBundle(_, bundle) {
    for (const key of Object.keys(bundle)) {
      if (key.endsWith('.wasm')) delete bundle[key]
    }
  }
}

export default defineConfig({
  server:  {
    port: 5173,
    headers: COOP_HEADERS,
    allowedHosts: true,
    sourcemapIgnoreList: (p) => p.includes('node_modules'),
  },
  preview: { headers: COOP_HEADERS },
  optimizeDeps: {
    exclude: ['onnxruntime-web', '@mediapipe/tasks-vision']
  },
  plugins: [copiaAssetsSelfHosted, sirveAssetsSelfHostedDev],
  build: {
    target:    'es2022',
    minify:    'terser',
    cssMinify: 'lightningcss',
    terserOptions: {
      compress: {
        passes:     2,
        drop_console: false,
        pure_funcs: ['console.debug', 'console.info']
      },
      mangle: { safari10: true }
    },
    rollupOptions: {
      plugins: [excluirWasmRollup],
      output: {
        manualChunks: {
          'ort':       ['onnxruntime-web'],
          'mediapipe': ['@mediapipe/tasks-vision'],
        }
      }
    }
  }
})
