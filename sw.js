/* Service Worker - La Palma Princess
   Sube el número de VERSION cada vez que cambies archivos importantes. */
const VERSION = 'princess-v2';

// Archivos que se guardan al instalar la app (deben existir todos, si no falla la instalación)
const PRECACHE = [
  './',
  'index.html',
  'habitaciones.html',
  'servicios.html',
  'galeria.html',
  'reservas.html',
  'styles.css',
  'script.js',
  'manifest.json',
  'fotos/unnamed.webp'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(PRECACHE); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== VERSION; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Red primero: siempre intenta la última versión; si no hay conexión, usa la copia guardada
function redPrimero(req, esPagina) {
  return fetch(req)
    .then(function (res) {
      if (res.ok) {
        const copia = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copia); });
      }
      return res;
    })
    .catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) {
        return r || (esPagina ? caches.match('index.html') : Response.error());
      });
    });
}

// Caché primero: para imágenes y fuentes locales (pesan y casi no cambian)
function cachePrimero(req) {
  return caches.match(req).then(function (r) {
    return r || fetch(req).then(function (res) {
      if (res.ok) {
        const copia = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copia); });
      }
      return res;
    });
  });
}

self.addEventListener('fetch', function (e) {
  const req = e.request;
  const url = new URL(req.url);

  // Solo GET y solo archivos propios: no tocamos el asistente, el tiempo, el mapa, etc.
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // La música se deja al navegador (usa peticiones parciales)
  if (url.pathname.endsWith('.mp3')) return;

  const esPagina = req.mode === 'navigate';
  const esCodigo = ['script', 'style', 'document'].includes(req.destination);

  e.respondWith(esPagina || esCodigo ? redPrimero(req, esPagina) : cachePrimero(req));
});
