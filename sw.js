const CACHE='arena-x1-stable-v35';
const SHELL=['./index.html','./manifest.webmanifest','./bmw-icon-192.png','./bmw-icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 if(url.pathname==='/BMW-X1/'||url.pathname==='/BMW-X1/index.html'){
  event.respondWith(Response.redirect(new URL('/ARENA-X1/',self.location.origin).href,302));return;
 }
 event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy))}
  return response;
 }).catch(()=>caches.match(req,{ignoreSearch:true}).then(cached=>cached||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});