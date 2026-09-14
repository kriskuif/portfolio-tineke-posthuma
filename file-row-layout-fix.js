(() => {
  const style = document.createElement('style');
  style.textContent = `
    .portfolio-file-list{
      align-content:start !important;
      grid-auto-rows:max-content !important;
    }
    .portfolio-file-row{
      align-self:start !important;
      height:max-content !important;
    }
  `;
  document.head.appendChild(style);
})();