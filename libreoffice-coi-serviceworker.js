/* Cross-origin isolation helper for the in-browser LibreOffice WASM converter.
   Kept at the site root so it can control the complete GitHub Pages app. */
'use strict';

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.cache==='only-if-cached'&&request.mode!=='same-origin') return;

  const outgoing=(request.mode==='no-cors')
    ? new Request(request,{credentials:'omit'})
    : request;

  event.respondWith(
    fetch(outgoing).then(response=>{
      if(!response||response.status===0) return response;
      const headers=new Headers(response.headers);
      headers.set('Cross-Origin-Opener-Policy','same-origin');
      headers.set('Cross-Origin-Embedder-Policy','credentialless');
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
