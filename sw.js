const CACHE='arena-x1-stable-v63';
const SHELL=['./index.html','./manifest.webmanifest','./bmw-icon-192.png','./bmw-icon-512.png','./icon.svg','./bmw-x1-hero.webp','./arena_x1_hotel_bmw_banner.webp','./bonus-breakdown.js','./arena.js','./rules-cards.js','./auth-gate.js','./result-social.js','./add-professional.js'];
const SCOPE=new URL(self.registration.scope);
const INDEX_URL=new URL('./index.html',SCOPE).href;
const SHELL_PATHS=new Set(SHELL.map(path=>new URL(path,SCOPE).pathname));

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL.map(path=>new URL(path,SCOPE).href))));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('arena-x1-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;

 if(req.mode==='navigate'){
  event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{
   if(response.ok)event.waitUntil(caches.open(CACHE).then(cache=>cache.put(INDEX_URL,response.clone())).catch(()=>{}));
   return response;
  }).catch(()=>caches.open(CACHE).then(cache=>cache.match(INDEX_URL)).then(cached=>cached||Response.error())));
  return;
 }

 if(!SHELL_PATHS.has(url.pathname))return;
 const cacheKey=new URL(url.pathname,SCOPE).href;
 event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{
  if(response.ok)event.waitUntil(caches.open(CACHE).then(cache=>cache.put(cacheKey,response.clone())).catch(()=>{}));
  return response;
 }).catch(()=>caches.open(CACHE).then(cache=>cache.match(cacheKey)).then(cached=>cached||Response.error())));
});
