self.addEventListener('install', (e)=> self.skipWaiting());
self.addEventListener('activate', (e)=> self.clients.claim());
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) {
    return e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
  }
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request).then(resp => {
      return caches.open('static-v1').then(cache => { cache.put(e.request, resp.clone()); return resp; });
    }))
  );
});
