(() => {
  const style = document.createElement('style');
  style.textContent = `
    .password-toggle-wrap{position:relative;width:100%;min-width:0}
    .password-toggle-wrap>input{width:100%!important;padding-right:46px!important}
    .password-toggle-btn{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:34px;height:34px;display:grid;place-items:center;border:0;border-radius:9px;background:transparent;color:#607068;cursor:pointer;padding:0;line-height:1}
    .password-toggle-btn:hover{background:#eef3ef;color:#1f5e4a}
    .password-toggle-btn:focus-visible{outline:2px solid #2f7a61;outline-offset:1px}
    .password-toggle-btn svg{width:19px;height:19px;display:block;pointer-events:none}
  `;
  document.head.appendChild(style);

  const eyeOpen = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="2.7" stroke="currentColor" stroke-width="1.8"/>
    </svg>`;
  const eyeClosed = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.6M6.2 6.3C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a10 10 0 0 0 3.1-.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`;

  function enhancePasswordInput(input){
    if(!(input instanceof HTMLInputElement) || input.dataset.passwordToggleReady === '1') return;
    if(input.type !== 'password') return;

    input.dataset.passwordToggleReady = '1';
    const wrap = document.createElement('div');
    wrap.className = 'password-toggle-wrap';
    input.parentNode?.insertBefore(wrap,input);
    wrap.appendChild(input);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'password-toggle-btn';
    button.setAttribute('aria-label','Wachtwoord tonen');
    button.setAttribute('aria-pressed','false');
    button.title = 'Wachtwoord tonen';
    button.innerHTML = eyeOpen;
    wrap.appendChild(button);

    button.addEventListener('click',()=>{
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.setAttribute('aria-pressed',String(!showing));
      button.setAttribute('aria-label',showing ? 'Wachtwoord tonen' : 'Wachtwoord verbergen');
      button.title = showing ? 'Wachtwoord tonen' : 'Wachtwoord verbergen';
      button.innerHTML = showing ? eyeOpen : eyeClosed;
      input.focus({preventScroll:true});
      try{
        const end = input.value.length;
        input.setSelectionRange(end,end);
      }catch(_err){}
    });
  }

  function scan(root=document){
    if(root instanceof HTMLInputElement) enhancePasswordInput(root);
    root.querySelectorAll?.('input[type="password"]').forEach(enhancePasswordInput);
  }

  scan();
  const observer = new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType===1) scan(node);
    }));
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();