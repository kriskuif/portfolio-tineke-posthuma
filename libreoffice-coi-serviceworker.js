/* Legacy service worker retired.
   LibreOffice now runs in its own isolated converter iframe, so the
   portfolio itself no longer needs COOP/COEP headers. */
'use strict';

self.addEventListener('install',()=>self.skipWaiting());

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await self.registration.unregister();
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clients){
      try{await client.navigate(client.url);}catch(_err){}
    }
  })());
});

self.addEventListener('fetch',event=>{
  event.respondWith(fetch(event.request));
});
