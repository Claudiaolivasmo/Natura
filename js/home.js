/* Featured sales use exactly the same cards as the sales catalog. */
(() => {
  const container = document.getElementById('featuredGrid');
  if (!container) return;
  const en = document.documentElement.lang.startsWith('en');
  fetch(`/assets/data/properties${en?'-en':''}.json`).then(response=>{
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then(data=>{
    const active = data.filter(p=>!NaturaListings.sold(p)).sort((a,b)=>Number(NaturaListings.featured(b))-Number(NaturaListings.featured(a)) || b.id-a.id);
    const count=document.getElementById('activePropertyCount');
    if(count) count.textContent=active.length;
    container.innerHTML = active.length ? active.slice(0,3).map(p=>NaturaListings.card(p)).join('') : `<p class="listing-empty">${en?'There are no featured properties yet.':'Aún no hay propiedades destacadas.'}</p>`;
    container.setAttribute('aria-busy','false');
  }).catch(error=>{
    console.error('Could not load featured properties:',error);
    container.setAttribute('aria-busy','false');
    container.innerHTML=`<p class="listing-empty" role="alert">${en?'We could not load the properties. Please reload the page.':'No se pudieron cargar las propiedades. Recargá la página para intentar de nuevo.'}</p>`;
  });
})();
