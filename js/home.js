// === 🏠 HOME.JS ===

// ───────────────────────── Configuración ─
const WATERMARK_PATH = '/.netlify/functions/watermark';
// ⚠️ Si tienes redirect en netlify.toml de "/watermark" → "/.netlify/functions/watermark",
// puedes cambiarlo por const WATERMARK_PATH = '/watermark';

// Helper de traducción (usa t() si existe; si no, usa fallback en ES)
const hasT = typeof window !== 'undefined' && typeof window.t === 'function';
const translate = (key, fallback) => (hasT ? window.t(key) : fallback);

// ───────────────────────── Hero Buttons ─
const exploreBtn = document.getElementById('exploreBtn');
if (exploreBtn) {
  exploreBtn.addEventListener('click', () => {
    const section = document.getElementById('propiedades');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  });
}

const contactBtn = document.getElementById('contactBtn');
if (contactBtn) {
  contactBtn.addEventListener('click', () => {
    window.location.href = 'tel:+50683018999';
  });
}

const viewAllBtn = document.getElementById('viewAllBtn');
if (viewAllBtn) {
  viewAllBtn.addEventListener('click', () => {
    window.location.href = 'properties.html';
  });
}

// ───────────────────────── Hover effect ─
function attachHoverToCards() {
  const hoverCards = document.querySelectorAll('.service-card, .property-card');
  hoverCards.forEach(card => {
    if (card.__hoverBound) return;
    card.__hoverBound = true;
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px) scale(1.02)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
    });
  });
}
attachHoverToCards();

// ───────────────────────── Utils de propiedades ─
/**
 * Genera la URL para la imagen principal utilizando la función de Watermark.
 * Respeta rutas absolutas (/assets/...) y externas (http...).
 * Si es un nombre de archivo simple, construye la URL con WATERMARK_PATH.
 */
function firstImageWatermarkedSrc(p) {
  const folder = p.folder ? String(p.folder).replace(/^\/+|\/+$/g, '') : '';
  const first = p.images?.[0];
  if (!first) return '';

  let src = '';

  // a) Objeto con {src}
  if (first && typeof first === 'object' && first.src) {
    src = String(first.src);
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
  }
  // b) String
  else if (typeof first === 'string') {
    src = String(first);
    if (/^https?:\/\//i.test(src) || src.startsWith('/')) return src;
  } else {
    return '';
  }

  // Nombre limpio (quita carpeta y querystrings)
  const filename = src.split('/').pop().split('?')[0];
  if (!folder || !filename) return '';

  return `${WATERMARK_PATH}?img=${folder}/${filename}`;
}

const linkFor = (p) =>
  p.slug ? `property.html?slug=${encodeURIComponent(p.slug)}`
         : `property.html?id=${encodeURIComponent(p.id)}`;

// ───────────────────────── Utils de estado ─
const isSold = (p) => String(p?.status || '').toLowerCase() === 'vendido';

const isFeatured = (p) =>
  !isSold(p) && (p?.featured === true || (p?.badge || '').toLowerCase().includes('destacado'));

function buildMeta(p) {
  const bits = [];
  if (p.location) bits.push(p.location);
  if (p.bedrooms != null) bits.push(`${p.bedrooms} ${translate('labelBedrooms', 'Hab')}`);
  if (p.bathrooms != null) bits.push(`${p.bathrooms} ${translate('labelBathrooms', 'Baños')}`);
  if (p.lotSize != null) bits.push(`${p.lotSize} m² ${translate('labelLot', 'lote')}`);
  return bits.join(' • ');
}

// ───────────────────────── Precios (moneda) ─
function selectPrice(p = {}) {
  const curr = String(p.currency || 'CRC').toUpperCase();

  // Preferencias por moneda declarada
  if (curr === 'CRC') {
    if (isFinite(Number(p.priceCRC))) return { amount: Number(p.priceCRC), curr: 'CRC' };
    if (isFinite(Number(p.price)))    return { amount: Number(p.price),    curr: 'CRC' };
  } else if (curr === 'USD') {
    if (isFinite(Number(p.price)))    return { amount: Number(p.price),    curr: 'USD' };
    if (isFinite(Number(p.priceUSD))) return { amount: Number(p.priceUSD), curr: 'USD' };
  }

  // Fallbacks si falta currency o campos “no estándar”
  if (isFinite(Number(p.priceCRC)))   return { amount: Number(p.priceCRC), curr: 'CRC' };
  if (isFinite(Number(p.priceUSD)))   return { amount: Number(p.priceUSD), curr: 'USD' };
  if (isFinite(Number(p.price))) {
    // Si no hay currency, asumimos USD para precios “pequeños” y CRC para montos grandes
    const guessed = Number(p.price) >= 1_000_000 ? 'CRC' : 'USD';
    return { amount: Number(p.price), curr: curr === 'CRC' || curr === 'USD' ? curr : guessed };
  }

  return null; // Precio desconocido
}

function formatPrice(sel) {
  if (!sel) return translate('priceOnRequest', 'Precio a consultar');
  const symbol = sel.curr === 'CRC' ? '₡' : '$';
  const locale = sel.curr === 'CRC' ? 'es-CR' : 'en-US';
  return `${symbol}${sel.amount.toLocaleString(locale)}`;
}

function renderCardHome(p) {
  const badge = p.badge ? `<div class="property-badge">${p.badge}</div>` : '';
  const img = firstImageWatermarkedSrc(p);
  const sel = selectPrice(p);
  const priceText = formatPrice(sel);

  return `
  <a href="${linkFor(p)}" class="property-card-link">
    <div class="property-card">
      <div class="property-image">
        <img class="property-photo"
             src="${img}"
             alt="${p.title || translate('propertyAltFallback', 'Propiedad')}"
             loading="lazy"
             decoding="async">
        ${badge}
      </div>
      <div class="property-content">
        <h4 class="property-title">${p.title || ''}</h4>
        <p class="property-details">${buildMeta(p)}</p>
        <div class="property-price">
          <span class="price">${priceText}</span>
          <span class="view-btn">${translate('viewDetails', 'Ver detalles')}</span>
        </div>
      </div>
    </div>
  </a>
  `;
}

// ───────────────────────── Featured ─
function pickFeatured(list, n = 3) {
  const props = Array.isArray(list) ? list : [];

  // Excluir vendidas de todo el pipeline
  const activos = props.filter(p => !isSold(p));

  const destacados = activos
    .filter(isFeatured)
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  const recientes = [...activos].sort((a, b) => (b.id || 0) - (a.id || 0));

  const out = [];
  for (const p of destacados) { if (out.length < n) out.push(p); }
  for (const p of recientes) {
    if (out.length < n && !out.some(x => x.id === p.id)) out.push(p);
  }
  return out;
}

function renderFeatured(props) {
  const container = document.getElementById('featuredGrid');
  if (!container) { console.warn('[home] NO featuredGrid'); return; }

  const chosen = pickFeatured(props, 3);
  container.innerHTML = chosen.length
    ? chosen.map(renderCardHome).join('')
    : `<div class="no-results">${translate('homeNoFeatured', 'Aún no hay propiedades destacadas.')}</div>`;

  attachHoverToCards();
}

// ───────────────────────── Init ─
document.addEventListener('DOMContentLoaded', () => {
  const isEnglish = /^\/en(\/|$)/.test(window.location.pathname);

  const PROPERTIES_PATH = isEnglish
    ? '/assets/data/properties-en.json'
    : '/assets/data/properties.json';

  fetch(PROPERTIES_PATH)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      const list = Array.isArray(data) ? data : [];
      window.properties = list;
      renderFeatured(list);
    })
    .catch(err => {
      console.error('Error loading:', PROPERTIES_PATH, err);
      const container = document.getElementById('featuredGrid');
      if (container) {
        container.innerHTML = `<div class="no-results">${translate('homePropsLoadError', 'Properties could not be loaded.')}</div>`;
      }
    });
});


