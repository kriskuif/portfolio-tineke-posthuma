(() => {
  const ALLOWED = new Set(['B','STRONG','I','EM','U','SPAN','BR','DIV','P','UL','OL','LI','A']);
  const HEX = /^#[0-9a-f]{6}$/i;
  const FILE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const style = document.createElement('style');
  style.textContent = `
    .rich-wrap{display:grid;gap:0}
    .rich-toolbar{display:flex;align-items:center;gap:5px;flex-wrap:wrap;padding:7px 8px;background:#f3f6f3;border:1px solid #cbd8d0;border-bottom:0;border-radius:12px 12px 0 0}
    .rich-tool{min-width:32px;height:30px;border:1px solid #d1dcd5;border-radius:8px;background:#fff;color:#294f40;font:inherit;font-weight:800;cursor:pointer;display:grid;place-items:center;padding:0 8px}
    .rich-tool:hover,.rich-tool:focus-visible{background:#e7efe9;outline:none;border-color:#9eb5a7}
    .rich-tool em{font-weight:700}.rich-tool u{text-underline-offset:2px}
    .rich-file-tool{font-size:.72rem;gap:5px;display:flex;align-items:center;white-space:nowrap}
    .rich-color-label{display:flex;align-items:center;gap:6px;height:30px;padding:0 8px;border:1px solid #d1dcd5;border-radius:8px;background:#fff;color:#405047;font-size:.74rem;font-weight:800;cursor:pointer}
    .rich-color{width:22px;height:22px;border:0;padding:0;background:transparent;cursor:pointer}
    .rich-editor{min-height:125px;max-height:310px;overflow:auto;padding:11px 12px;border:1px solid #cbd8d0;border-radius:0 0 12px 12px;background:#fff;color:#26352e;font:inherit;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
    .rich-editor:focus{outline:2px solid rgba(31,94,74,.18);border-color:#6e9985}
    .rich-editor:empty:before{content:'Typ hier je tekst…';color:#9aa69f;pointer-events:none}
    .rich-editor ul,.rich-editor ol,.saved-field p ul,.saved-field p ol{margin:.35em 0 .35em 1.45em;padding-left:.7em;white-space:normal}
    .rich-editor li,.saved-field p li{margin:.15em 0}
    .saved-field p span[style*="color"],.rich-editor span[style*="color"]{text-decoration-color:currentColor}
    .rich-editor a[data-portfolio-file-id],.saved-field p a[data-portfolio-file-id]{color:#1f5e4a;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:3px;font-weight:750;cursor:pointer}
    .rich-editor a[data-portfolio-file-id]:hover,.saved-field p a[data-portfolio-file-id]:hover{color:#174838;text-decoration-thickness:2px}
  `;
  document.head.appendChild(style);

  function sanitize(html){
    const doc = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    const clean = node => {
      [...node.childNodes].forEach(child => {
        if(child.nodeType === Node.TEXT_NODE) return;
        if(child.nodeType !== Node.ELEMENT_NODE){ child.remove(); return; }
        if(!ALLOWED.has(child.tagName)){
          child.replaceWith(...child.childNodes);
          return;
        }
        const colorStyle = child.tagName === 'SPAN' ? (child.getAttribute('style') || '') : '';
        const fileId = child.tagName === 'A' ? (child.getAttribute('data-portfolio-file-id') || '') : '';
        const fileCategory = child.tagName === 'A' ? (child.getAttribute('data-portfolio-file-category') || '') : '';
        [...child.attributes].forEach(attr => child.removeAttribute(attr.name));
        if(child.tagName === 'SPAN'){
          const match=colorStyle.match(/color\s*:\s*(#[0-9a-f]{6})/i);
          if(match && HEX.test(match[1])) child.setAttribute('style',`color:${match[1].toLowerCase()}`);
        }
        if(child.tagName === 'A' && FILE_ID.test(fileId) && ['evidence','attachment'].includes(fileCategory)){
          child.setAttribute('href','#');
          child.setAttribute('data-portfolio-file-id',fileId.toLowerCase());
          child.setAttribute('data-portfolio-file-category',fileCategory);
        }else if(child.tagName === 'A'){
          child.replaceWith(...child.childNodes);
          return;
        }
        clean(child);
      });
    };
    clean(root);
    root.querySelectorAll('b').forEach(el=>{const n=doc.createElement('strong');n.innerHTML=el.innerHTML;el.replaceWith(n)});
    root.querySelectorAll('i').forEach(el=>{const n=doc.createElement('em');n.innerHTML=el.innerHTML;el.replaceWith(n)});
    return root.innerHTML;
  }

  function isRich(value){ return /<(?:strong|b|em|i|u|span|br|div|p|ul|ol|li|a)(?:\s|>|\/)/i.test(String(value||'')); }

  function enhanceTextarea(textarea){
    if(!textarea || textarea.dataset.richEnhanced) return;
    textarea.dataset.richEnhanced='1';
    textarea.style.display='none';

    const wrap=document.createElement('div');
    wrap.className='rich-wrap';
    const toolbar=document.createElement('div');
    toolbar.className='rich-toolbar';
    toolbar.setAttribute('role','toolbar');
    toolbar.setAttribute('aria-label','Tekstopmaak');
    toolbar.innerHTML=`
      <button class="rich-tool" type="button" data-rich-command="bold" title="Vet" aria-label="Vet"><strong>B</strong></button>
      <button class="rich-tool" type="button" data-rich-command="italic" title="Cursief" aria-label="Cursief"><em>I</em></button>
      <button class="rich-tool" type="button" data-rich-command="underline" title="Onderstrepen" aria-label="Onderstrepen"><u>U</u></button>
      <button class="rich-tool" type="button" data-rich-command="insertUnorderedList" title="Opsomming" aria-label="Opsomming">• ≡</button>
      <button class="rich-tool" type="button" data-rich-command="insertOrderedList" title="Genummerde opsomming" aria-label="Genummerde opsomming">1. ≡</button>
      <button class="rich-tool rich-file-tool" type="button" data-rich-file-link title="Koppel geselecteerde tekst aan een bewijsstuk of bijlage" aria-label="Koppel aan bewijsstuk of bijlage">🔗 Koppel bewijs/bijlage</button>
      <label class="rich-color-label" title="Tekstkleur">Kleur <input class="rich-color" type="color" value="#1f5e4a" aria-label="Tekstkleur"></label>`;
    const editor=document.createElement('div');
    editor.className='rich-editor';
    editor.contentEditable='true';
    editor.setAttribute('role','textbox');
    editor.setAttribute('aria-multiline','true');
    editor.innerHTML=isRich(textarea.value) ? sanitize(textarea.value) : String(textarea.value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');

    textarea.parentNode.insertBefore(wrap,textarea);
    wrap.append(toolbar,editor,textarea);
    let savedRange=null;
    const rememberSelection=()=>{
      const sel=window.getSelection();
      if(sel?.rangeCount && editor.contains(sel.anchorNode) && editor.contains(sel.focusNode)) savedRange=sel.getRangeAt(0).cloneRange();
    };
    const restoreSelection=()=>{
      if(!savedRange) return;
      const sel=window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    };
    const sync=()=>{
      textarea.value=sanitize(editor.innerHTML);
      textarea.dispatchEvent(new Event('input',{bubbles:true}));
      rememberSelection();
    };
    const applyFileLink=item=>{
      if(!savedRange || savedRange.collapsed || !editor.contains(savedRange.commonAncestorContainer)) return false;
      const range=savedRange.cloneRange();
      const link=document.createElement('a');
      link.href='#';
      link.dataset.portfolioFileId=String(item.id||'').toLowerCase();
      link.dataset.portfolioFileCategory=item.category;
      try{
        const fragment=range.extractContents();
        if(!fragment.textContent?.trim()) return false;
        link.appendChild(fragment);
        range.insertNode(link);
      }catch(_err){ return false; }
      const next=document.createRange();
      next.selectNodeContents(link);
      next.collapse(false);
      savedRange=next;
      sync();
      return true;
    };

    editor.addEventListener('keyup',rememberSelection);
    editor.addEventListener('mouseup',rememberSelection);
    editor.addEventListener('input',sync);
    editor.addEventListener('paste',e=>{
      e.preventDefault();
      const text=e.clipboardData?.getData('text/plain')||'';
      document.execCommand('insertText',false,text);
    });
    editor.addEventListener('click',e=>{
      if(e.target.closest('a[data-portfolio-file-id]')) e.preventDefault();
    });
    toolbar.querySelectorAll('[data-rich-command]').forEach(btn=>{
      btn.addEventListener('mousedown',e=>{e.preventDefault();rememberSelection()});
      btn.addEventListener('click',()=>{editor.focus();restoreSelection();document.execCommand(btn.dataset.richCommand,false,null);sync()});
    });
    const fileButton=toolbar.querySelector('[data-rich-file-link]');
    fileButton?.addEventListener('mousedown',e=>{e.preventDefault();rememberSelection()});
    fileButton?.addEventListener('click',()=>{
      rememberSelection();
      document.dispatchEvent(new CustomEvent('portfolio:link-file-request',{detail:{
        hasSelection:!!savedRange && !savedRange.collapsed,
        selectedText:savedRange && !savedRange.collapsed ? savedRange.toString() : '',
        applyFileLink
      }}));
    });
    const color=toolbar.querySelector('.rich-color');
    color.addEventListener('mousedown',rememberSelection);
    color.addEventListener('input',()=>{editor.focus();restoreSelection();document.execCommand('foreColor',false,color.value);sync()});
  }

  function enhanceEditors(root=document){ root.querySelectorAll('textarea[data-modal-field]').forEach(enhanceTextarea); }
  enhanceEditors();
  new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)enhanceEditors(n)}))).observe(document.body,{childList:true,subtree:true});

  const originalRender=window.renderChapters || (typeof renderChapters==='function' ? renderChapters : null);
  if(originalRender){
    const richRender=function(){
      originalRender();
      document.querySelectorAll('.saved-field p').forEach(p=>{
        const raw=p.textContent||'';
        if(isRich(raw)) p.innerHTML=sanitize(raw);
      });
    };
    try{ window.renderChapters=richRender; renderChapters=richRender; }catch(_err){ window.renderChapters=richRender; }
    richRender();
  }

  window.portfolioRichText={sanitize,isRich};
})();