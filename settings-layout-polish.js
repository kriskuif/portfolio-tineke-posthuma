(() => {
  'use strict';

  const style=document.createElement('style');
  style.id='settings-layout-polish';
  style.textContent=`
    .settings-window{width:min(980px,calc(100vw - 28px))}
    .settings-card:has([data-current-password]){grid-column:1/-1}
    .settings-card:has([data-current-password]) .settings-form{
      display:grid;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr);
      grid-template-rows:auto auto;
      column-gap:18px;
      row-gap:10px;
      align-items:start;
    }
    .settings-card:has([data-current-password]) .settings-form>label:nth-child(1){grid-column:1;grid-row:1 / span 2}
    .settings-card:has([data-current-password]) .settings-form>label:nth-child(2){grid-column:2;grid-row:1}
    .settings-card:has([data-current-password]) .settings-form>label:nth-child(3){grid-column:2;grid-row:2}
    .settings-card:has([data-current-password]) .settings-actions{justify-content:flex-end;margin-top:14px!important}
    .settings-card:has([data-current-password]) .settings-message{text-align:right}

    @media(max-width:760px){
      .settings-window{width:min(900px,calc(100vw - 20px))}
      .settings-card:has([data-current-password]){grid-column:auto}
      .settings-card:has([data-current-password]) .settings-form{grid-template-columns:1fr;grid-template-rows:auto;gap:9px}
      .settings-card:has([data-current-password]) .settings-form>label:nth-child(1),
      .settings-card:has([data-current-password]) .settings-form>label:nth-child(2),
      .settings-card:has([data-current-password]) .settings-form>label:nth-child(3){grid-column:1;grid-row:auto}
      .settings-card:has([data-current-password]) .settings-actions{justify-content:flex-start}
      .settings-card:has([data-current-password]) .settings-message{text-align:left}
    }
  `;
  document.head.appendChild(style);
})();
