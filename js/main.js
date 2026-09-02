/* Shared anchors and progressive enhancement; no page-wide fade or layout mutations. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href^="#"]').forEach(anchor=>{
    anchor.addEventListener('click',event=>{
      const href=anchor.getAttribute('href');
      if(!href || href==='#') return;
      const target=document.getElementById(decodeURIComponent(href.slice(1)));
      if(!target) return;
      event.preventDefault();target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
    });
  });
  if(!reduced && 'IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});
    },{threshold:.05});
    document.querySelectorAll('.fade-in').forEach(element=>{element.classList.add('will-animate');observer.observe(element);});
  }
  document.querySelectorAll('.stat-number[data-target]').forEach(element=>{element.textContent=element.dataset.target;});
})();

// Reveal each La Fortuna overlay once when 35% of its photo enters the viewport.
(() => {
  const cards = Array.from(document.querySelectorAll('.lafortuna-box'));
  if (!cards.length) return;
  const touch = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 767px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  function setupReveal() {
    if (observer) observer.disconnect();
    cards.forEach(card => card.classList.remove('scroll-reveal-ready', 'scroll-revealed'));
    if (!touch.matches || reducedMotion.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          entry.target.classList.add('scroll-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    cards.forEach(card => {
      card.classList.add('scroll-reveal-ready');
      observer.observe(card);
    });
  }
  setupReveal();
  touch.addEventListener('change', setupReveal);
  reducedMotion.addEventListener('change', setupReveal);
})();
