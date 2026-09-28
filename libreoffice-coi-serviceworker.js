/* Cross-origin isolation helper for the in-browser LibreOffice WASM converter.
   Only same-origin read responses need header augmentation. Cross-origin requests
   and requests with a body pass through untouched so their bodies are never replayed. */
'use strict';

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.cache==='only-if-cached'&&request.mode!=='same-origin') return;

  const url=new URL(request.url);
  const isSameOrigin=url.origin===self.location.origin;
  const isRead=request.method==='GET'||request.method==='HEAD';

  // Supabase/API writes and all other cross-origin traffic must pass through as-is.
  // Retrying a consumed Request body causes Safari's "disturbed or locked" error.
  if(!isSameOrigin||!isRead){
    event.respondWith(fetch(request));
    return;
  }

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
    })
  );
});
