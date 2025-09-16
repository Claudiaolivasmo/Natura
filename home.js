// === 🏠 HOME.JS ===

// Botones principales del hero
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

// Utilidad para aplicar hover a cards existentes (y poder reusarla tras render)
function attachHoverToCards() {
  const hoverCards = document.querySelectorAll('.service-card, .property-card');
  hoverCards.forEach(card => {
    // evita listeners duplicados
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

// ───────────────────────── Featured (Home) ─ 3 tarjetas

// Fallbacks mínimos por si no cargas properties.js en home
const _mapType = (t) => {
  const x = (t || '').toLowerCase();
  if (x === 'terreno') return 'lote';
  return x || '';
};
const _isDwelling = (t) => ['casa','apartamento','villa','cabana'].includes((t||'').toLowerCase());
const _effectiveType = (p) => _mapType(p.type || (
  ((p.badge||'').toLowerCase().includes('terreno') || (p.title||'').toLowerCase().includes('lote')) ? 'lote' : 'casa'
));
const _primaryImage = (p) => `/images/properties/${p.folder}/${p.images?.[0] || ''}`;
const _linkFor = (p) => p.slug ? `property.html?slug=${encodeURIComponent(p.slug)}` : `property.html?id=${encodeURIComponent(p.id)}`;

// Si ya existen las funciones del listado, úsalas; si no, usa los fallbacks
const mapType = (typeof window.mapType === 'function') ? window.mapType : _mapType;
const isDwelling = (typeof window.isDwelling === 'function') ? window.isDwelling : _isDwelling;
const effectiveType = (typeof window.effectiveType === 'function') ? window.effectiveType : _effectiveType;
const primaryImage = (typeof window.primaryImage === 'function') ? window.primaryImage : _primaryImage;
const linkFor = (typeof window.linkFor === 'function') ? window.linkFor : _linkFor;

// Card mínima para Home si no existe renderCard global
function renderCardHome(p) {
  const t = effectiveType(p);
  const isHome = isDwelling(t);
  const meta = [];

  if (isHome) {
    if (p.bedrooms != null) meta.push(`${p.bedrooms} Hab`);
    if (p.bathrooms != null) meta.push(`${p.bathrooms} Baños`);
    if (p.area) meta.push(`${p.area} m² constr.`);
    if (p.lotSize) meta.push(`${p.lotSize} m² lote`);
  } else {
    const s = Number(p.lotSize ?? p.area ?? 0);
    if (s) meta.push(`${s} m²`);
    if (p.topography) meta.push(`Topografía: ${p.topography}`);
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

// Usa el render global si existe; si no, usa el de Home
const renderCardSafe = (typeof window.renderCard === 'function') ? window.renderCard : renderCardHome;

function pickFeatured(props) {
  // Prioriza featured:true o badge que contenga "destacado"
  const featured = (props || []).filter(p =>
    p.featured === true ||
    (p.badge || '').toLowerCase().includes('destacado')
  );
  const base = featured.length ? featured : [...props].sort((a,b) => (b.id||0) - (a.id||0));
  return base.slice(0, 3);
}

function renderFeatured(props) {
  const container = document.querySelector('#propiedades .property-grid');
  if (!container) return;

  const chosen = pickFeatured(props);
  if (!chosen.length) {
    container.innerHTML = `<div class="no-results">Aún no hay propiedades destacadas.</div>`;
    return;
  }

  container.innerHTML = chosen.map(renderCardSafe).join('');
  // Aplica hover a las nuevas tarjetas
  attachHoverToCards();
}

// Hook: carga JSON y pinta destacadas
document.addEventListener('DOMContentLoaded', () => {
  fetch('properties.json')
    .then(r => r.json())
    .then(data => {
      const normalized = (data || []).map(p => ({ ...p, type: effectiveType(p) }));
      window.properties = normalized;
      window.filteredProperties = [...normalized];

      renderFeatured(normalized);

      // Si la página home también carga componentes del listado, estos serán opcionales:
      window.renderProperties?.();
      window.setupUI?.();
      window.applyAdvancedState?.(false);
      window.enforceTypeRules?.();
    })
    .catch(err => console.error('Error al cargar el JSON:', err));
});

// (Eliminado el listener delegado duplicado de #viewAllBtn)
