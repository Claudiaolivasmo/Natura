/* Sales catalog: shared cards, sorting and accessible pagination. */
(() => {
  'use strict';
  const en = document.documentElement.lang.startsWith('en');
  const pageSize = 9;
  let properties = [], page = 1;
  const grid = document.getElementById('propertiesGrid');
  const pagination = document.getElementById('pagination');
  const count = document.getElementById('resultsCount');
  if (!grid || !pagination || !count) return;
  // Retain the site's existing comparison rate; it is never displayed as an asking price.
  const comparablePrice = p => Number(p.price) > 0 ? Number(p.price) : Number(p.priceCRC) > 0 ? Number(p.priceCRC) / 525 : Infinity;
  function sort() {
    const choice = document.getElementById('sortBy')?.value || 'featured';
    properties.sort((a,b) => {
      if (choice === 'price-low' || choice === 'price-high') {
        const pa = comparablePrice(a), pb = comparablePrice(b);
        if (!Number.isFinite(pa)) return Number.isFinite(pb) ? 1 : 0;
        if (!Number.isFinite(pb)) return -1;
        return choice === 'price-low' ? pa-pb : pb-pa;
      }
      if (choice === 'newest') return b.id-a.id;
      return Number(NaturaListings.sold(a))-Number(NaturaListings.sold(b)) || Number(NaturaListings.featured(b))-Number(NaturaListings.featured(a)) || b.id-a.id;
    });
  }
  function render() {
    count.textContent = properties.length;
    grid.innerHTML = properties.length ? properties.slice((page-1)*pageSize,page*pageSize).map(p=>NaturaListings.card(p)).join('') : `<p class="listing-empty">${en?'No properties are currently listed.':'Aún no hay propiedades publicadas.'}</p>`;
    grid.setAttribute('aria-busy','false');
    const pages = Math.ceil(properties.length/pageSize);
    pagination.innerHTML = pages > 1 ? Array.from({length:pages},(_,i)=>`<button type="button" class="page-btn${page===i+1?' active':''}" data-page="${i+1}" aria-label="${en?'Page':'Página'} ${i+1}"${page===i+1?' aria-current="page"':''}>${i+1}</button>`).join('') : '';
  }
  document.getElementById('sortBy')?.addEventListener('change',()=>{page=1;sort();render();});
  pagination.addEventListener('click',event=>{
    const button = event.target.closest('[data-page]');
    if (!button) return;
    page=Number(button.dataset.page);render();
    pagination.querySelector('[aria-current="page"]')?.focus({preventScroll:true});
    grid.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
  fetch(`/assets/data/properties${en?'-en':''}.json`).then(response=>{
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then(data=>{
    if(!Array.isArray(data)) throw new Error('Invalid catalog');
    properties=data;sort();render();
  }).catch(error=>{
    console.error('Could not load sales catalog:',error);
    count.textContent='—';grid.setAttribute('aria-busy','false');
    grid.innerHTML=`<p class="listing-empty" role="alert">${en?'We could not load the properties. Please reload the page.':'No se pudieron cargar las propiedades. Recargá la página para intentar de nuevo.'}</p>`;
  });
})();
