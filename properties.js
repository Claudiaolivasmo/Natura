// === 🏘️ PROPERTIES.JS — Filtros al botón + Vista + Orden + Paginación ===
let currentPage = 1;
const propertiesPerPage = 9;

// ───────────────────────── Config
const USD_TO_CRC = 525;

// ───────────────────────── Utils robustas
const normalizeText = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const isDwelling = (t) => {
  const x = normalizeText(t || '');
  return ['casa', 'apartamento', 'villa', 'cabana', 'condo', 'condominio'].includes(x);
};

const mapType = (t) => {
  const x = normalizeText(t || '');
  if (!x) return '';
  if (['terreno', 'terrenos', 'lote', 'lotes', 'solar', 'solares', 'parcela', 'parcelas'].includes(x)) return 'lote';
  if (['apartamento', 'apartamentos', 'apto', 'apt'].includes(x)) return 'apartamento';
  if (['cabana', 'cabaña', 'cabins'].includes(x)) return 'cabana';
  return x;
};

const inferType = (p) => {
  if (p.type) return mapType(p.type);
  const title = normalizeText(p.title || '');
  const badge = normalizeText(p.badge || '');
  if (badge.includes('terreno') || title.includes('terreno') || title.includes('lote')) return 'lote';
  if ((p.bedrooms ?? 0) > 0 || (p.bathrooms ?? 0) > 0) return 'casa';
  return 'lote';
};

const effectiveType = (p) => mapType(p.type || inferType(p));
const effectiveSize = (p) => Number(p.lotSize ?? p.area ?? 0);

/* -------------------- 🔧 NUEVO: helpers de rutas -------------------- */
// Devuelve la URL pública limpia para mostrar en <img> (como antes)
function toPublicSrc(srcOrName, folder) {
  if (!srcOrName) return '';
  // Si ya es http(s) o ruta absoluta, respétala
  if (/^https?:\/\//i.test(srcOrName) || String(srcOrName).startsWith('/')) {
    return String(srcOrName);
  }
  // Si es un nombre suelto "1.jpg" => construye /assets/images/properties/{folder}/1.jpg
  const cleanFolder = String(folder || '').replace(/^\/+|\/+$/g, '');
  return `/assets/images/properties/${cleanFolder}/${srcOrName}`;
}

// Construye la URL que pasa por tu función (redirect /download/* → watermark)
function toDownloadUrl(srcOrNameOrAbs, folder, filename = 'imagen') {
  if (!srcOrNameOrAbs) return '';
  // Si ya apunta a /download, respétala
  if (String(srcOrNameOrAbs).startsWith('/download/')) {
    return srcOrNameOrAbs.includes('filename=')
      ? srcOrNameOrAbs
      : `${srcOrNameOrAbs}?filename=${encodeURIComponent(filename)}`;
  }
  // Si viene absoluta bajo /assets/images, conviértela a /download/...
  if (String(srcOrNameOrAbs).startsWith('/assets/images/')) {
    const rel = srcOrNameOrAbs.replace(/^\/assets\/images\//, ''); // properties/...
    return `/download/${rel}?filename=${encodeURIComponent(filename)}`;
  }
  // Nombre suelto → arma properties/{folder}/archivo y pásalo por /download
  const cleanFolder = String(folder || '').replace(/^\/+|\/+$/g, '');
  const rel = `properties/${cleanFolder}/${srcOrNameOrAbs}`;
  return `/download/${rel}?filename=${encodeURIComponent(filename)}`;
}
/* ------------------------------------------------------------------- */

// 🔙 VOLVER A COMO ANTES: primaryImage muestra la foto limpia de /assets/images/...
function primaryImage(p) {
  const folder = p.folder ? String(p.folder).replace(/^\/+|\/+$/g, '') : '';
  const first = p.images?.[0];
  if (!first) return '';
  // Caso objeto {src, download}
  if (first && typeof first === 'object' && first.src) {
    return toPublicSrc(first.src, folder);
  }
  // Caso string "1.jpg" o ruta
  if (typeof first === 'string') {
    return toPublicSrc(first, folder);
  }
  return '';
}

const linkFor = (p) =>
  p.slug ? `property.html?slug=${encodeURIComponent(p.slug)}` : `property.html?id=${encodeURIComponent(p.id)}`;

function formatMoney(value = 0, currency = 'USD', locale = 'es-CR') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  } catch {
    return `${currency === 'CRC' ? '₡' : '$'}${Number(value || 0).toLocaleString()}`;
  }
}

// ───────────────────────── Carga inicial
document.addEventListener('DOMContentLoaded', () => {
  fetch('properties.json')
    .then(r => r.json())
    .then(data => {
      const normalized = (data || []).map(p => ({ ...p, type: effectiveType(p) }));
      window.properties = normalized;
      window.filteredProperties = [...normalized];

      renderProperties();
      setupUI();
      applyAdvancedState(false);
      enforceTypeRules();

      // 🔧 Inicializa el forzado de descarga con marca en clic derecho
      initRightClickDownload();
    })
    .catch(err => console.error('Error al cargar el JSON:', err));
});

// ───────────────────────── UI
function setupUI() {
  const gridBtn = document.getElementById('gridView');
  const listBtn = document.getElementById('listView');
  if (gridBtn && listBtn) {
    gridBtn.addEventListener('click', () => {
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
      renderProperties();
    });
    listBtn.addEventListener('click', () => {
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
      renderProperties();
    });
  }

  document.getElementById('filterApply')?.addEventListener('click', () => {
    currentPage = 1;
    window.filteredProperties = getFilteredList();
    sortProperties();
    renderProperties();
  });

  document.getElementById('toggleAdvanced')?.addEventListener('click', () => {
    const panel = document.getElementById('advancedFilters');
    applyAdvancedState(panel?.classList.contains('hidden'));
  });

  document.getElementById('property-type')?.addEventListener('change', enforceTypeRules);

  document.getElementById('sortBy')?.addEventListener('change', () => {
    sortProperties();
    currentPage = 1;
    renderProperties();
  });

  document.getElementById('clearFilters')?.addEventListener('click', () => {
    clearFiltersUI();
    window.filteredProperties = [...(window.properties || [])];
    sortProperties();
    currentPage = 1;
    renderProperties();
  });
}

function applyAdvancedState(open) {
  const panel = document.getElementById('advancedFilters');
  const btn = document.getElementById('toggleAdvanced');
  if (!panel || !btn) return;

  if (open) {
    panel.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = 'Ocultar avanzado';
  } else {
    panel.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Avanzado';
  }
}

function enforceTypeRules() {
  const typeSel = document.getElementById('property-type');
  const typeValue = mapType(typeSel?.value || '');
  const isHomeType = !typeValue || isDwelling(typeValue);

  ['bedrooms', 'bathrooms'].forEach(id => {
    const sel = document.getElementById(id);
    const dd = sel?.closest('.filter-dropdown');
    if (!sel) return;
    sel.disabled = !isHomeType;
    dd && dd.classList.toggle('disabled', !isHomeType);
    if (!isHomeType) sel.value = '';
  });
}

// ───────────────────────── Filtrado
function getFilteredList() {
  const q = readFiltersFromUI();
  const list = (window.properties || []);

  return list.filter(p => {
    const t = effectiveType(p);
    if (q.type && t !== q.type) return false;

    const price = Number(p.price || 0);
    if (price < q.priceMin) return false;
    if (price > q.priceMax) return false;

    const size = effectiveSize(p);
    if (size < q.sizeMin) return false;
    if (size > q.sizeMax) return false;

    if (q.bedroomsMin && isDwelling(t)) {
      if (Number(p.bedrooms || 0) < q.bedroomsMin) return false;
    }
    if (q.bathroomsMin && isDwelling(t)) {
      if (Number(p.bathrooms || 0) < q.bathroomsMin) return false;
    }

    if (q.search) {
      const hit = (p.title || '').toLowerCase().includes(q.search) ||
                  (p.location || '').toLowerCase().includes(q.search);
      if (!hit) return false;
    }

    if (q.location && !(p.location || '').toLowerCase().includes(q.location)) {
      return false;
    }

    return true;
  });
}

function readFiltersFromUI() {
  const getNum = (id, def = 0) => {
    const el = document.getElementById(id);
    const v = Number(el?.value || '');
    return Number.isFinite(v) && v >= 0 ? v : def;
  };
  const getSel = (id) => (document.getElementById(id)?.value || '').trim();

  const typeRaw = getSel('property-type');
  const type = typeRaw ? mapType(typeRaw) : '';
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

  const bedroomsMin = Number(document.getElementById('bedrooms')?.disabled ? 0 : (getSel('bedrooms') || 0));
  const bathroomsMin = Number(document.getElementById('bathrooms')?.disabled ? 0 : (getSel('bathrooms') || 0));

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
    if (p.area) meta.push(`<i class="fas fa-ruler-combined" aria-hidden="true"></i> ${p.area} m² constr.`);
    if (p.lotSize) meta.push(`<i class="fas fa-ruler-combined" aria-hidden="true"></i> ${p.lotSize} m² lote`);
  } else {
    const s = effectiveSize(p);
    if (s) meta.push(`<i class="fas fa-ruler-combined" aria-hidden="true"></i> ${s} m²`);
    if (p.topography) meta.push(`Topografía: ${p.topography}`);
    if (p.zoning) meta.push(`Uso: ${p.zoning}`);
  }

  const badge = p.badge || (t === 'lote' ? 'Terreno' : '');

  // ↩️ Mostrar imagen limpia (como antes)
  const imgSrc = primaryImage(p);

  // URL de descarga con marca (desde el primer item de images)
  const first = p.images?.[0];
  let dlUrl = '';
  if (first && typeof first === 'object') {
    dlUrl = toDownloadUrl(first.download || first.src, p.folder, p.slug || p.title || 'propiedad');
  } else if (typeof first === 'string') {
    dlUrl = toDownloadUrl(first, p.folder, p.slug || p.title || 'propiedad');
  }

  const priceUSD = Number(p.price || 0);
  const priceCRC = priceUSD ? Math.round(priceUSD * USD_TO_CRC) : 0;

  return `
    <a href="${linkFor(p)}" class="property-card-link">
      <div class="property-card img-card" ${dlUrl ? `data-download="${dlUrl}"` : ''}>
        <div class="property-image">
          <img class="property-photo"
               src="${imgSrc}"
               alt="${p.title}"
               loading="lazy"
               decoding="async"
               draggable="false"
               ${dlUrl ? `data-download="${dlUrl}"` : ''}>
          ${badge ? `<div class="property-badge">${badge}</div>` : ''}
          <div class="property-type-tag">${t}</div>
        </div>
        <div class="property-content">
          <h4 class="property-title">${p.title}</h4>
          <p class="property-location">${p.location || ''}</p>
          ${meta.length ? `<p class="property-meta">${meta.join(' • ')}</p>` : ''}
          <div class="property-price">
            <span class="price" title="Precio en dólares y colones">
              ${priceUSD ? `${formatMoney(priceUSD, 'USD')} <small>(${formatMoney(priceCRC, 'CRC')})</small>` : 'Consultar'}
            </span>
            <span class="view-btn" aria-hidden="true">Ver Detalles</span>
          </div>
        </div>
      </div>
    </a>
  `;
}

function sortProperties() {
  const v = document.getElementById('sortBy')?.value || '';
  switch (v) {
    case 'price-low':
      window.filteredProperties.sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'price-high':
      window.filteredProperties.sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'bedrooms':
      window.filteredProperties.sort((a, b) => {
        const ta = effectiveType(a), tb = effectiveType(b);
        const ba = isDwelling(ta) ? (a.bedrooms || 0) : 0;
        const bb = isDwelling(tb) ? (b.bedrooms || 0) : 0;
        return bb - ba;
      });
      break;
    case 'newest':
      window.filteredProperties.sort((a, b) => (b.id || 0) - (a.id || 0));
      break;
    default:
      window.filteredProperties.sort((a, b) => (a.id || 0) - (b.id || 0));
  }
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  const total = window.filteredProperties?.length || 0;
  const totalPages = Math.ceil(total / propertiesPerPage);
  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) {
    html += `<button class="page-btn" onclick="changePage(${currentPage - 1})" aria-label="Página anterior">‹ Anterior</button>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    const near = i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1);
    const dots = i === currentPage - 2 || i === currentPage + 2;
    if (i === currentPage) html += `<button class="page-btn active" aria-current="page">${i}</button>`;
    else if (near) html += `<button class="page-btn" onclick="changePage(${i})">${i}</button>`;
    else if (dots) html += `<span class="page-btn ellipsis" aria-hidden="true">...</span>`;
  }
  if (currentPage < totalPages) {
    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" aria-label="Página siguiente">Siguiente ›</button>`;
  }
  pagination.innerHTML = html;
}

function changePage(page) {
  const totalPages = Math.ceil((window.filteredProperties?.length || 0) / propertiesPerPage);
  currentPage = Math.min(Math.max(1, page), totalPages);
  renderProperties();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearFiltersUI() {
  ['property-type', 'price-min', 'price-max', 'size-min', 'size-max', 'bedrooms', 'bathrooms', 'search', 'location']
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

/* -------------------- 🖱️ NUEVO: clic derecho => descarga con marca -------------------- */
function initRightClickDownload() {
  const SELECTOR_IMG = '.property-photo, .property-image img, .img-card img, img[data-download]';

  document.addEventListener('contextmenu', function (e) {
    const img = e.target.closest(SELECTOR_IMG);
    if (!img) return;
    e.preventDefault();

    // Busca URL en data-download del <img> o del contenedor .img-card
    let dlUrl = img.dataset.download || img.closest('.img-card')?.dataset?.download || '';

    // Último recurso: intenta construirla desde el src
    if (!dlUrl && img.src) {
      try {
        const url = new URL(img.src, window.location.origin);
        const abs = url.pathname; // /assets/images/...
        // Construye /download/...
        const rel = abs.replace(/^\/assets\/images\//, '');
        dlUrl = rel ? `/download/${rel}?filename=${encodeURIComponent(img.alt || 'propiedad')}` : '';
      } catch (_) {}
    }

    if (!dlUrl) {
      console.warn('[WM] No se encontró URL de descarga con marca para', img);
      return;
    }

    const a = document.createElement('a');
    a.href = dlUrl + (dlUrl.includes('?') ? '&' : '?') + 'from=rclick';
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, { passive: false });
}
/* -------------------------------------------------------------------------------------- */
