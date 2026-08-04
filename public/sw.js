const CACHE='schoolyard-buddies-v3.1.1';
const CORE=['/','/index.html','/mobile.html','/mobile-game.html','/desktop.html','/v3-mobile.css','/v3-mobile.js','/v3-fullscreen-ui.css','/v3-fullscreen-ui.js','/universal-fullscreen-v3.0.5.css','/universal-fullscreen-v3.0.5.js','/manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response && response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('/index.html'))));
});
