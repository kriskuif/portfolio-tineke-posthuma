const body = document.body;
const menuBtn = document.getElementById('menuBtn');
menuBtn?.addEventListener('click', () => {
  const open = body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

const links = [...document.querySelectorAll('.nav a')];
links.forEach(link => link.addEventListener('click', () => {
  body.classList.remove('menu-open');
  menuBtn?.setAttribute('aria-expanded','false');
}));

const sections = [...document.querySelectorAll('main section[id]')];
const observer = new IntersectionObserver(entries => {
  const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
  if (!visible) return;
  links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${visible.target.id}`));
}, {rootMargin:'-15% 0px -65% 0px', threshold:[0,.1,.4]});
sections.forEach(s => observer.observe(s));
