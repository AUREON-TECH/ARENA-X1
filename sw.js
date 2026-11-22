const CACHE='arena-x1-stable-v50';
const SHELL=['./index.html','./manifest.webmanifest','./bmw-icon-192.png','./bmw-icon-512.png','./icon.svg','./bmw-x1-hero.webp','./arena_x1_hotel_bmw_banner.webp','./bonus-breakdown.js','./arena.js','./rules-cards.js','./auth-gate.js','./result-social.js','./add-professional.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('arena-x1-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 if(url.pathname==='/BMW-X1/'||url.pathname==='/BMW-X1/index.html'){
  event.respondWith(Response.redirect('https://aureon-tech.github.io/ARENA-X1/',302));return;
 }
 event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{}))}
  return response;
 }).catch(()=>caches.match(req,{ignoreSearch:true}).then(cached=>cached||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});