/* Vacation rental grids share the sales catalog's visual components. */
(() => {
  const grids = document.querySelectorAll('[data-vr-grid]');
  if (!grids.length) return;
  const en = document.documentElement.lang.startsWith('en');
  const count = document.getElementById('statCount');
  fetch(`/assets/data/vacation-rentals${en?'-en':''}.json`).then(response=>{
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then(data=>{
    if (!Array.isArray(data)) throw new Error('Invalid rental catalog');
    if(count) count.textContent=data.length;
    grids.forEach(grid=>{
      const source=grid.dataset.vrFeaturedOnly==='true'?data.filter(p=>p.featured):data;
      const items=source.slice(0,Number(grid.dataset.vrLimit)||source.length);
      grid.classList.toggle('listings-grid--pair',items.length===2);
      grid.innerHTML=items.length?items.map(p=>NaturaListings.card(p,{kind:'rental'})).join(''):`<p class="listing-empty">${en?'No vacation rentals are currently listed.':'Aún no hay alquileres vacacionales publicados.'}</p>`;
      grid.setAttribute('aria-busy','false');
    });
  }).catch(error=>{
    console.error('Could not load rentals:',error);
    if(count) count.textContent='—';
    grids.forEach(grid=>{
      grid.setAttribute('aria-busy','false');
      grid.innerHTML=`<p class="listing-empty" role="alert">${en?'We could not load the rentals. Please reload the page.':'No se pudieron cargar los alquileres. Recargá la página para intentar de nuevo.'}</p>`;
    });
  });
})();
