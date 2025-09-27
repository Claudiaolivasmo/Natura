// === 🏠 HOME.JS ===

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
    window.location.href = 'tel:+50688888888';
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
// Soporta images: ["1.jpg", ...] o images: [{src:"/img/.../1.jpg?w=1200", ...}]
function firstImageSrc(p) {
  const folder = p.folder ? String(p.folder).replace(/^\/+|\/+$/g, '') : '';
  const first = p.images?.[0];
  if (!first) return '';

  // Objeto con src
  if (first && typeof first === 'object' && first.src) {
    const s = String(first.src);
    if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s; // absoluto
    return `/img/properties/${folder}/${s}`; // relativo
  }

  // String (archivo o ruta)
  if (typeof first === 'string') {
    if (/^https?:\/\//i.test(first) || first.startsWith('/')) return first; // absoluto
    return `/img/properties/${folder}/${first}`;
  }

  return '';
}

const linkFor = (p) =>
  p.slug ? `property.html?slug=${encodeURIComponent(p.slug)}`
         : `property.html?id=${encodeURIComponent(p.id)}`;

const isFeatured = (p) =>
  p?.featured === true || (p?.badge || '').toLowerCase().includes('destacado');

function buildMeta(p) {
  const bits = [];
  if (p.location) bits.push(p.location);
  if (p.bedrooms != null) bits.push(`${p.bedrooms} Hab`);
  if (p.bathrooms != null) bits.push(`${p.bathrooms} Baños`);
  if (p.lotSize != null) bits.push(`${p.lotSize} m² lote`);
  return bits.join(' • ');
}

function renderCardHome(p) {
  const badge = p.badge ? `<div class="property-badge">${p.badge}</div>` : '';
  const img = firstImageSrc(p);

  return `
    <a href="${linkFor(p)}" class="property-card-link">
      <div class="property-card">
        <div class="property-image">
          <img class="property-photo"
               src="${img}"
               alt="${p.title || 'Propiedad'}"
               loading="lazy"
               decoding="async">
          ${badge}
        </div>
        <div class="property-content">
          <h4 class="property-title">${p.title || ''}</h4>
          <p class="property-details">${buildMeta(p)}</p>
          <div class="property-price">
            <span class="price">$${Number(p.price || 0).toLocaleString()}</span>
            <span class="view-btn">Ver Detalles</span>
          </div>
        </div>
      </div>
    </a>
  `;
}

// Prioriza destacados, rellena con recientes
function pickFeatured(list, n = 3) {
  const props = Array.isArray(list) ? list : [];
  const destacados = props.filter(isFeatured).sort((a,b) => (b.id||0)-(a.id||0));
  const recientes  = [...props].sort((a,b) => (b.id||0)-(a.id||0));

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
    : `<div class="no-results">Aún no hay propiedades destacadas.</div>`;

  attachHoverToCards();
}

// ───────────────────────── Init ─
document.addEventListener('DOMContentLoaded', () => {
  const url = 'properties.json'; // ajusta si está en otra carpeta

  fetch(url)
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
      console.error('Error al cargar properties.json:', err);
      const container = document.getElementById('featuredGrid');
      if (container) {
        container.innerHTML = `<div class="no-results">No se pudieron cargar las propiedades.</div>`;
      }
    });
});
