/* Cross-origin isolation helper for the in-browser LibreOffice WASM converter.
   Uses COEP require-corp because Safari does not reliably expose
   crossOriginIsolated with the credentialless variant used previously. */
'use strict';

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.cache==='only-if-cached'&&request.mode!=='same-origin') return;

  event.respondWith(
    fetch(request).then(response=>{
      if(!response||response.status===0) return response;
      const headers=new Headers(response.headers);
      headers.set('Cross-Origin-Opener-Policy','same-origin');
      headers.set('Cross-Origin-Embedder-Policy','require-corp');
      headers.set('Cross-Origin-Resource-Policy','cross-origin');
      return new Response(response.body,{
        status:response.status,
        statusText:response.statusText,
        headers
      });
    }).catch(error=>{
      console.error('LibreOffice isolation worker fetch mislukt:',error);
      return fetch(request);
    })
  );
});
