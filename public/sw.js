const CACHE='schoolyard-buddies-rebuild-2.1.3';
const LOCAL=['/','/index.html','/desktop.html','/mobile.html','/mobile-game.html','/config.js','/manifest.webmanifest','/assets/schoolyard-logo.png','/icons/icon-192.png','/icons/icon-512.png','/icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(LOCAL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(['/config.js','/mobile.js','/mobile.css','/mobile.html','/mobile-game.html','/desktop.html'].includes(url.pathname)){event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request)));return;}
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});return response;}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('/index.html'))));
});
