// === 🏘️ PROPERTIES.JS — Filtrar al botón + Avanzado ===
let currentPage = 1;
const propertiesPerPage = 9;

// ───────────────────────── Utils
const isDwelling = (t) => ['casa','apartamento','villa','cabana'].includes((t||'').toLowerCase());
const mapType = (t) => {
  const x = (t || '').toLowerCase();
  if (x === 'terreno') return 'lote'; // normaliza
  return x;
};
const inferType = (p) => {
  if (p.type) return mapType(p.type);
  const title = (p.title||'').toLowerCase();
  const badge = (p.badge||'').toLowerCase();
  if (badge.includes('terreno') || title.includes('terreno') || title.includes('lote')) return 'lote';
  if ((p.bedrooms ?? 0) > 0 || (p.bathrooms ?? 0) > 0) return 'casa';
  return 'lote';
};
const effectiveType = (p) => mapType(p.type || inferType(p));
const effectiveSize = (p) => Number(p.lotSize ?? p.area ?? 0);
const primaryImage = (p) => `/images/properties/${p.folder}/${p.images?.[0] || ''}`;
const linkFor = (p) => p.slug ? `property.html?slug=${encodeURIComponent(p.slug)}` : `property.html?id=${encodeURIComponent(p.id)}`;

// ───────────────────────── Carga
document.addEventListener('DOMContentLoaded', () => {
  fetch('properties.json')
    .then(r => r.json())
    .then(data => {
      const normalized = (data || []).map(p => ({ ...p, type: effectiveType(p) }));
      window.properties = normalized;
      window.filteredProperties = [...normalized];

      renderProperties();
      setupUI();
      applyAdvancedState(false); // avanzado oculto al inicio
      enforceTypeRules();        // deshabilita hab/baños si aplica
    })
    .catch(err => console.error('Error al cargar el JSON:', err));
});

// ───────────────────────── UI
function setupUI() {
  // Vista grid/list
  const gridBtn = document.getElementById('gridView');
  const listBtn = document.getElementById('listView');
  if (gridBtn && listBtn) {
    gridBtn.addEventListener('click', () => {
      gridBtn.classList.add('active'); listBtn.classList.remove('active'); renderProperties();
    });
    listBtn.addEventListener('click', () => {
      listBtn.classList.add('active'); gridBtn.classList.remove('active'); renderProperties();
    });
  }

  // Botón Filtrar (aplica filtros)
  document.getElementById('filterApply')?.addEventListener('click', () => {
    currentPage = 1;
    window.filteredProperties = getFilteredList();
    renderProperties();
  });

  // Botón Avanzado (mostrar/ocultar)
  document.getElementById('toggleAdvanced')?.addEventListener('click', (e) => {
    const panel = document.getElementById('advancedFilters');
    const nowOpen = !panel?.classList.contains('hidden');
    applyAdvancedState(nowOpen); // si estaba abierto, ciérralo
  });

  // Cambios de tipo afectan habilitación de hab/baños (no filtra aún)
  document.getElementById('property-type')?.addEventListener('change', enforceTypeRules);

  // Ordenar SÍ re-renderiza de lo ya filtrado
  document.getElementById('sortBy')?.addEventListener('change', sortProperties);

  // Limpiar (resetea campos y re-renderiza todo)
  document.getElementById('clearFilters')?.addEventListener('click', () => {
    clearFiltersUI();
    window.filteredProperties = [...(window.properties || [])];
    renderProperties();
  });

  // Dropdown accesible existente (opcional): si ya lo tienes montado, no hace falta duplicarlo aquí
}

// Muestra/oculta contenedor de avanzados
function applyAdvancedState(open) {
  const panel = document.getElementById('advancedFilters');
  const btn = document.getElementById('toggleAdvanced');
  if (!panel || !btn) return;
  if (open) {
    panel.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Avanzado';
  } else {
    panel.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = 'Ocultar avanzado';
  }
}

// Habilita/deshabilita filtros de hab/baños según el tipo
function enforceTypeRules() {
  const typeSel = document.getElementById('property-type');
  const typeValue = mapType(typeSel?.value || '');
  const isHomeType = !typeValue || isDwelling(typeValue); // si no eligió nada, se considera habilitado

  ['bedrooms','bathrooms'].forEach(id => {
    const sel = document.getElementById(id);
    const dd = sel?.closest('.filter-dropdown');
    if (!sel) return;
    sel.disabled = !isHomeType;
    dd && dd.classList.toggle('disabled', !isHomeType);
    if (!isHomeType) sel.value = ''; // limpia para que no afecte el filtrado
  });
}

// ───────────────────────── Filtrado (solo al botón)
function getFilteredList() {
  const q = readFiltersFromUI();
  const list = (window.properties || []);

  return list.filter(p => {
    const t = effectiveType(p);

    // Tipo
    if (q.type && t !== q.type) return false;

    // Precio
    const price = Number(p.price || 0);
    if (price < q.priceMin) return false;
    if (price > q.priceMax) return false;

    // Tamaño (usa lotSize y si no hay, area)
    const size = effectiveSize(p);
    if (size < q.sizeMin) return false;
    if (size > q.sizeMax) return false;

    // Avanzados (solo si están activos/habilitados)
    if (q.bedroomsMin && isDwelling(t)) {
      if (Number(p.bedrooms || 0) < q.bedroomsMin) return false;
    }
    if (q.bathroomsMin && isDwelling(t)) {
      if (Number(p.bathrooms || 0) < q.bathroomsMin) return false;
    }

    // Búsqueda simple (si decides mantener search dentro de avanzados)
    if (q.search) {
      const hit = (p.title||'').toLowerCase().includes(q.search) ||
                  (p.location||'').toLowerCase().includes(q.search);
      if (!hit) return false;
    }

    // Ubicación (si la tienes en avanzados)
    if (q.location && !(p.location||'').toLowerCase().includes(q.location)) {
      return false;
    }

    return true;
  });
}

function readFiltersFromUI() {
  const getNum = (id, def=0) => {
    const el = document.getElementById(id);
    const v = Number(el?.value || '');
    return Number.isFinite(v) && v >= 0 ? v : def;
  };
  const getSel = (id) => (document.getElementById(id)?.value || '').trim();

  // Base
  const typeRaw = getSel('property-type');         // '' | 'casa' | 'terreno' | ...
  const type = typeRaw ? mapType(typeRaw) : '';    // normalizado
  const priceMin = getNum('price-min', 0);
  const priceMax = (() => {
    const n = getNum('price-max', NaN);
    return Number.isNaN(n) ? Infinity : n;
  })();
  const sizeMin = getNum('size-min', 0);
  const sizeMax = (() => {
    const n = getNum('size-max', NaN);
    return Number.isNaN(n) ? Infinity : n;
  })();

  // Avanzados (opcionalmente ocultos)
  const bedroomsMin = Number(document.getElementById('bedrooms')?.disabled ? 0 : (getSel('bedrooms') || 0));
  const bathroomsMin = Number(document.getElementById('bathrooms')?.disabled ? 0 : (getSel('bathrooms') || 0));

  // Extra (si decides meterlos en avanzados)
  const search = (document.getElementById('search')?.value || '').trim().toLowerCase();
  const location = (document.getElementById('location')?.value || '').replace('-', ' ').toLowerCase();

  return { type, priceMin, priceMax, sizeMin, sizeMax, bedroomsMin, bathroomsMin, search, location };
}

// ───────────────────────── Render + paginación + orden
function renderProperties() {
  const grid = document.getElementById('propertiesGrid');
  const list = document.getElementById('propertiesList');
  const resultsCount = document.getElementById('resultsCount');
  const pagination = document.getElementById('pagination');
  if (!grid || !list || !resultsCount || !pagination) return;

  const gridBtn = document.getElementById('gridView');
  const currentView = gridBtn && gridBtn.classList.contains('active') ? 'grid' : 'list';

  const props = window.filteredProperties || [];
  resultsCount.textContent = String(props.length);

  if (props.length === 0) {
    const empty = `<div class="no-results" role="status" aria-live="polite">No se encontraron propiedades con los filtros seleccionados.</div>`;
    grid.innerHTML = empty; list.innerHTML = empty;
    grid.style.display = currentView === 'grid' ? 'grid' : 'none';
    list.style.display = currentView === 'list' ? 'flex' : 'none';
    pagination.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(props.length / propertiesPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * propertiesPerPage;
  const currentProps = props.slice(start, start + propertiesPerPage);
  const cards = currentProps.map(renderCard).join('');

  grid.innerHTML = cards;
  list.innerHTML = cards;

  grid.style.display = currentView === 'grid' ? 'grid' : 'none';
  list.style.display = currentView === 'list' ? 'flex' : 'none';

  renderPagination();
}


function renderCard(p) {
  const t = effectiveType(p);
  const isHome = isDwelling(t);
  const meta = [];

  if (isHome) {
    if (p.bedrooms != null) meta.push(`${p.bedrooms} Hab`);
    if (p.bathrooms != null) meta.push(`${p.bathrooms} Baños`);
    if (p.area) meta.push(`<i class="fas fa-ruler-combined"></i> ${p.area} m² constr.`);
    if (p.lotSize) meta.push(`<i class="fas fa-ruler-combined"></i> ${p.lotSize} m² lote`);
  } else {
    const s = effectiveSize(p);
    if (s) meta.push(`<i class="fas fa-ruler-combined"></i> ${s} m²`);
    if (p.topography) meta.push(`Topografía: ${p.topography}`);
    if (p.zoning) meta.push(`Uso: ${p.zoning}`);
  }

  const badge = p.badge || (t === 'lote' ? 'Terreno' : '');
  return `
    <a href="${linkFor(p)}" class="property-card-link">
      <div class="property-card">
        <div class="property-image">
          <img class="property-photo" src="${primaryImage(p)}" alt="${p.title}">
          ${badge ? `<div class="property-badge">${badge}</div>` : ''}
          <div class="property-type-tag">${t}</div>
        </div>
        <div class="property-content">
          <h4 class="property-title">${p.title}</h4>
          <p class="property-location">${p.location || ''}</p>
          ${meta.length ? `<p class="property-meta">${meta.join(' • ')}</p>` : ''}
          <div class="property-price">
            <span class="price">$${Number(p.price || 0).toLocaleString()}</span>
            <span class="view-btn">Ver Detalles</span>
          </div>
        </div>
      </div>
    </a>
  `;
}


function sortProperties() {
  const v = document.getElementById('sortBy')?.value || '';
  switch (v) {
    case 'price-low': window.filteredProperties.sort((a,b) => (a.price||0) - (b.price||0)); break;
    case 'price-high': window.filteredProperties.sort((a,b) => (b.price||0) - (a.price||0)); break;
    case 'bedrooms':
      window.filteredProperties.sort((a,b) => {
        const ta = effectiveType(a), tb = effectiveType(b);
        const ba = isDwelling(ta) ? (a.bedrooms||0) : 0;
        const bb = isDwelling(tb) ? (b.bedrooms||0) : 0;
        return bb - ba;
      });
      break;
    case 'newest': window.filteredProperties.sort((a,b) => (b.id||0) - (a.id||0)); break;
    default: window.filteredProperties.sort((a,b) => (a.id||0) - (b.id||0));
  }
  currentPage = 1;
  renderProperties();
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  const total = window.filteredProperties?.length || 0;
  const totalPages = Math.ceil(total / propertiesPerPage);
  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) {
    html += `<button class="page-btn" onclick="changePage(${currentPage-1})" aria-label="Página anterior">‹ Anterior</button>`;
  }
  for (let i=1;i<=totalPages;i++){
    const near = i===1 || i===totalPages || (i>=currentPage-1 && i<=currentPage+1);
    const dots = i===currentPage-2 || i===currentPage+2;
    if (i===currentPage) html += `<button class="page-btn active" aria-current="page">${i}</button>`;
    else if (near) html += `<button class="page-btn" onclick="changePage(${i})">${i}</button>`;
    else if (dots) html += `<span class="page-btn ellipsis" aria-hidden="true">...</span>`;
  }
  if (currentPage < totalPages) {
    html += `<button class="page-btn" onclick="changePage(${currentPage+1})" aria-label="Página siguiente">Siguiente ›</button>`;
  }
  pagination.innerHTML = html;
}

function changePage(page) {
  const totalPages = Math.ceil((window.filteredProperties?.length || 0) / propertiesPerPage);
  currentPage = Math.min(Math.max(1, page), totalPages);
  renderProperties();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ───────────────────────── Helpers UI
function clearFiltersUI() {
  // Base
  ['property-type','price-min','price-max','size-min','size-max','bedrooms','bathrooms','search','location']
    .forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === 'SELECT') {
        const def = el.querySelector('option[selected]') || el.querySelector('option[value=""]');
        el.value = def ? def.value : '';
      } else {
        el.value = '';
      }
    });
  enforceTypeRules();
}
