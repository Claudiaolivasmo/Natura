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
