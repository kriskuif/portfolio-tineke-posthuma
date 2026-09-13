async function exportPortfolioHtml(){
  const button=document.getElementById('htmlExportBtn');
  const originalLabel=button?.textContent;
  try{
    if(button){
      button.disabled=true;
      button.textContent='HTML maken…';
    }

    const clone=document.documentElement.cloneNode(true);
    const cloneBody=clone.querySelector('body');

    clone.style.overflow='';
    clone.style.overscrollBehavior='';
    cloneBody?.style.removeProperty('overflow');
    cloneBody?.style.removeProperty('overscroll-behavior');
    cloneBody?.classList.remove('menu-open','window-dragging');

    clone.querySelectorAll('.editor-window,#windowLayer,.topic-edit-btn,.topbar,script').forEach(el=>el.remove());

    const sourceStylesheet=document.querySelector('link[rel="stylesheet"]');
    const clonedStylesheet=clone.querySelector('link[rel="stylesheet"]');
    if(sourceStylesheet&&clonedStylesheet){
      const response=await fetch(sourceStylesheet.href,{cache:'no-store'});
      if(!response.ok) throw new Error('stylesheet');
      const css=await response.text();
      const style=document.createElement('style');
      style.textContent=css;
      clonedStylesheet.replaceWith(style);
    }

    const liveImages=[...document.querySelectorAll('img')];
    const clonedImages=[...clone.querySelectorAll('img')];
    clonedImages.forEach((img,index)=>{
      if(liveImages[index]?.src) img.setAttribute('src',liveImages[index].src);
    });

    const exportedMeta=document.createElement('meta');
    exportedMeta.setAttribute('name','portfolio-exported-at');
    exportedMeta.setAttribute('content',new Date().toISOString());
    clone.querySelector('head')?.appendChild(exportedMeta);

    const html='<!DOCTYPE html>\n'+clone.outerHTML;
    const blob=new Blob([html],{type:'text/html;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`portfolio-tineke-posthuma-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if(typeof setStatus==='function') setStatus('HTML-bestand gemaakt','saved');
  }catch(err){
    console.error(err);
    if(typeof setStatus==='function') setStatus('HTML-bestand maken mislukt','error');
    else window.alert('Het HTML-bestand kon niet worden gemaakt.');
  }finally{
    if(button){
      button.disabled=false;
      button.textContent=originalLabel||'HTML exporteren';
    }
  }
}

document.getElementById('htmlExportBtn')?.addEventListener('click',exportPortfolioHtml);
