# Hardening de YOSO en Vercel

## Qué protege el repositorio

- `robots.txt` permite indexar únicamente la página principal y excluye el modelo, WASM, MediaPipe, service worker y manifest.
- `sitemap.xml` publica únicamente `https://yoso-rust.vercel.app/`.
- `X-Robots-Tag` evita indexar binarios y archivos operativos.
- `Cache-Control` permite cachear assets hashados, pero no congela `/ort/` ni `/mediapipe/`, cuyos nombres no tienen hash.
- `security.txt` publica el canal de reporte de vulnerabilidades.
- `llms.txt` ofrece contexto controlado a asistentes y crawlers de documentación.

## Límite importante

Una aplicación estática no puede aplicar rate limiting desde TypeScript: el bot puede pedir directamente `/YOSO.onnx`, `/ort/*` o cualquier asset público. `robots.txt` tampoco bloquea bots maliciosos.

## Configuración obligatoria en Vercel

En el proyecto `yoso-rust`, abrir **Firewall → Configure**:

1. Activar **Bot Protection** con acción `Challenge` para tráfico no-browser.
2. Crear una regla de rate limit por IP para el tráfico general. Empezar observando y después limitar; no bloquear crawlers verificados.
3. Crear una regla específica para descargas pesadas:
   - `/YOSO.onnx`
   - `/ort/*`
   - `/mediapipe/*`
   - Acción inicial: `Log`; acción final recomendada: `Rate Limit` o `Challenge`.
4. Activar alertas de Firewall/Observability para picos de requests y transferencia.
5. Configurar **Spend Management** con:
   - alerta al 50%;
   - alerta al 75%;
   - límite duro bastante menor que el máximo que estás dispuesto a pagar;
   - pausa automática del proyecto al alcanzar el límite.

Vercel indica que el tráfico bloqueado, desafiado o rate-limited por Firewall no genera CDN Requests ni Fast Data Transfer. El límite de gasto debe quedar por debajo del máximo tolerable porque las comprobaciones no son instantáneas.

## Prueba manual después de desplegar

```powershell
curl.exe -I https://yoso-rust.vercel.app/
curl.exe -I https://yoso-rust.vercel.app/YOSO.onnx
curl.exe -I https://yoso-rust.vercel.app/robots.txt
curl.exe -I https://yoso-rust.vercel.app/sitemap.xml
curl.exe -I https://yoso-rust.vercel.app/.well-known/security.txt
```

Verificar:

- `sw.js`: `Cache-Control: no-cache`
- `YOSO.onnx`: `X-Robots-Tag: noindex, nofollow, noarchive`
- `robots.txt`: contiene `Sitemap: https://yoso-rust.vercel.app/sitemap.xml`
- `sitemap.xml`: contiene solo `/`
- respuesta de la app: CSP, COOP, COEP, X-Frame-Options y Permissions-Policy

## Qué no hacer

- No confiar en `robots.txt` como firewall.
- No publicar endpoints proxy para Datamuse.
- No marcar `/YOSO.onnx`, `/ort/` o `/mediapipe/` como `immutable` sin versionar sus nombres.
- No añadir `unregister()` del Service Worker ni cambiar el modo offline a network-only.
