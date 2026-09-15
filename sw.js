// Guarda la app en el teléfono para que abra sin señal.
const CACHE = 'antihelada-v4';
const ARCHIVOS = ['./index.html','./manifest.json','./icono-192.png','./icono-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // nunca cachear los envios a la planilla
  if(url.hostname.includes('script.google')) return;
  if(e.request.method !== 'GET') return;

  // La app misma: primero la red, asi las actualizaciones llegan solas.
  const esApp = e.request.mode === 'navigate' || e.request.destination === 'script';
  if(esApp){
    e.respondWith(
      fetch(e.request).then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(()=>{});
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // Lo demas (iconos, manifiesto): primero lo guardado, que no cambia.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(()=>{});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
