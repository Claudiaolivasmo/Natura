// === property.js (completo, con ajustes) ===
let currentImageIndex = 0;
let currentProperty = null;
let isLightboxOpen = false;
let touchStartX = 0;
let lastFocusedBeforeLB = null;

// ───────────── Helpers DOM Lightbox
const q = (id) => document.getElementById(id);
function lightboxEl()  { return q('lightbox'); }
function lbImgEl()     { return q('lightboxImage'); }
function lbCounterEl() { return q('lbCounter'); }
function lbCloseEl()   { return q('lbClose'); }
function lbPrevEl()    { return q('lbPrev'); }
function lbNextEl()    { return q('lbNext'); }

// 🔧 Construye src de imágenes (ruta relativa, sin "/" inicial)
function buildImageSrc(i) {
  if (!currentProperty?.images?.length) return '';
  const file = currentProperty.images[i];
  // Si mueves property.html a una subcarpeta, ajusta a "../images/..."
  return `images/properties/${currentProperty.folder}/${file}`;
}

// ───────────── Inicio
document.addEventListener('DOMContentLoaded', initPropertyPage);

async function initPropertyPage() {
  const params = new URLSearchParams(location.search);
  const idParam   = params.get('id');
  const slugParam = params.get('slug');

  try {
    // Si property.html está en subcarpeta, usa '../properties.json'
    const res = await fetch('properties.json');
    const list = await res.json();

    if (slugParam) {
      currentProperty = list.find(p => (p.slug || '').toLowerCase() === slugParam.toLowerCase());
    } else if (idParam) {
      currentProperty = list.find(p => String(p.id) === String(idParam) || Number(p.id) === Number(idParam));
    }

    if (!currentProperty) return fallbackToList();

    bindProperty(currentProperty);
    setupContactForm?.();  // si existe, configura el formulario
    initLightboxEvents();  // eventos del lightbox
    initGalleryEvents();   // click/teclado en imagen principal
  } catch (err) {
    console.error('Error al cargar properties.json:', err);
    fallbackToList();
  }
}

function fallbackToList() {
  // Ajusta ruta si tu listado está en otra ubicación
  location.href = 'properties.html';
}

// ───────────── Pintado de datos
function formatPrice(value) {
  if (value == null) return 'Consultar';
  try {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `$${Number(value || 0).toLocaleString('en-US')}`;
  }
}

function formatLotSize(m2) {
  if (m2 == null || isNaN(m2)) return null;
  const n = Number(m2);
  // Mostrar en hectáreas si es grande, si no en m²
  if (n >= 10000) {
    const ha = (n / 10000);
    return `${ha % 1 === 0 ? ha.toFixed(0) : ha.toFixed(2)} ha`;
  }
  return `${n.toLocaleString('es-CR')} m²`;
}

function joinPriceSize(priceStr, sizeStr) {
  if (priceStr && sizeStr) return `${priceStr} \u00A0•\u00A0 ${sizeStr}`;
  return priceStr || sizeStr || 'Consultar';
}

function hasCoords(p) {
  return p?.geo && typeof p.geo.lat === 'number' && typeof p.geo.lng === 'number';
}

function buildMapsEmbedSrc(p) {
  const zoom = (p?.geo?.zoom && Number(p.geo.zoom)) || 15;
  if (hasCoords(p)) {
    const { lat, lng } = p.geo;
    // Modo embed por coordenadas
    return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  }
  // Fallback a búsqueda por texto (mapQuery > location > title)
  const q = encodeURIComponent(p.mapQuery || p.location || p.title || 'Costa Rica');
  return `https://www.google.com/maps?q=${q}&z=${zoom}&output=embed`;
}

function buildMapsLink(p) {
  if (hasCoords(p)) {
    const { lat, lng } = p.geo;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  const q = encodeURIComponent(p.mapQuery || p.location || p.title || 'Costa Rica');
  return `https://www.google.com/maps?q=${q}`;
}

function renderMap(p) {
  const sec   = q('locationSection');
  const text  = q('locationText');
  const iframe= q('mapIframe');
  const link  = q('mapLink');

  if (!(sec && iframe && link)) return;

  // Texto descriptivo (si tienes algo específico en el JSON, úsalo; si no, usa p.location)
  const desc = p.mapText || p.location || '';
  if (text) text.textContent = desc;

  // Definir URLs
  const src  = buildMapsEmbedSrc(p);
  const href = buildMapsLink(p);

  iframe.src = src;
  link.href  = href;

  // Mostrar sección solo si hay algo que mapear
  const hasSomething = hasCoords(p) || p.mapQuery || p.location;
  sec.classList.toggle('hidden', !hasSomething);
}





function bindProperty(p) {
  document.title = `${p.title} - Natura Real Estate`;

  const titleEl = q('propertyTitle');
  const locEl   = q('propertyLocation');
  const priceEl = q('propertyPriceTag');      // etiqueta verde
  const bcEl    = q('breadcrumbTitle');

  if (titleEl) titleEl.textContent = p.title || 'Propiedad';
  if (locEl)   locEl.textContent   = p.location || '—';
  if (priceEl) {
  const priceStr = formatPrice(p.price);      // "$100,000"
  const sizeStr  = formatLotSize(p.lotSize);  // "2,296 m²" o "0.23 ha"
  priceEl.textContent = joinPriceSize(priceStr, sizeStr);
}

  if (bcEl)    bcEl.textContent    = p.title || 'Propiedad';

  updateMainImage();
  generateThumbnails();
  loadDescription();
  renderFeatures(p);
  renderMap(p);

}

function loadDescription() {
  const container = q('propertyDescription');
  if (!container) return;
  const desc = currentProperty?.description;

  if (Array.isArray(desc)) {
    container.innerHTML = desc.map(par =>
      `<p class="text-gray-700 leading-relaxed mb-4">${par}</p>`
    ).join('');
  } else if (typeof desc === 'string') {
    // Soporta saltos de línea (párrafos separados por línea en blanco)
    const parts = desc.split(/\n\s*\n/);
    container.innerHTML = parts.map(par =>
      `<p class="text-gray-700 leading-relaxed mb-4">${par.trim()}</p>`
    ).join('');
  } else {
    container.innerHTML = '';
  }
}

// ───────────── Galería
function updateMainImage() {
  const mainImageContainer = q('mainImage');
  if (!mainImageContainer || !currentProperty?.images?.length) return;

  mainImageContainer.style.backgroundImage = `url('${buildImageSrc(currentImageIndex)}')`;
  mainImageContainer.style.backgroundSize = 'cover';
  mainImageContainer.style.backgroundPosition = 'center';
  mainImageContainer.style.cursor = 'zoom-in';
}

function generateThumbnails() {
  const thumbnailGrid = q('thumbnailGrid');
  if (!thumbnailGrid || !currentProperty?.images?.length) return;

  thumbnailGrid.innerHTML = currentProperty.images
    .map((img, i) => `
      <div class="thumbnail ${i === currentImageIndex ? 'active' : ''}" onclick="selectImage(${i})">
        <img src="${buildImageSrc(i)}" alt="Miniatura ${i + 1}" />
      </div>
    `).join('');
}

function selectImage(index) {
  if (!currentProperty?.images?.length) return;
  currentImageIndex = index;
  updateMainImage();

  document.querySelectorAll('.thumbnail').forEach((thumb, i) =>
    thumb.classList.toggle('active', i === index)
  );

  if (isLightboxOpen) updateLightboxImage();
}

function previousImage() {
  if (!currentProperty?.images?.length) return;
  currentImageIndex = currentImageIndex > 0
    ? currentImageIndex - 1
    : currentProperty.images.length - 1;
  selectImage(currentImageIndex);
}

function nextImage() {
  if (!currentProperty?.images?.length) return;
  currentImageIndex = currentImageIndex < currentProperty.images.length - 1
    ? currentImageIndex + 1
    : 0;
  selectImage(currentImageIndex);
}

// ───────────── Lightbox
function updateLightboxImage() {
  const img = lbImgEl();
  if (!img) return;

  img.src = buildImageSrc(currentImageIndex);
  img.alt = `${currentProperty.title} – imagen ${currentImageIndex + 1}`;

  const counter = lbCounterEl();
  if (counter) counter.textContent = `${currentImageIndex + 1} / ${currentProperty.images.length}`;

  // Preload vecinos
  const n = currentProperty.images.length;
  [ (currentImageIndex + 1) % n, (currentImageIndex - 1 + n) % n ].forEach(i => {
    const ph = new Image();
    ph.src = buildImageSrc(i);
  });
}

function openLightbox() {
  if (!currentProperty?.images?.length) return;
  const lb = lightboxEl();
  if (!lb) return;

  isLightboxOpen = true;
  lastFocusedBeforeLB = document.activeElement;
  lb.classList.remove('hidden');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  updateLightboxImage();
  lb.focus?.();
}

function closeLightbox() {
  const lb = lightboxEl();
  if (!lb) return;

  isLightboxOpen = false;
  lb.classList.add('hidden');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  // Devuelve el foco donde estaba
  if (lastFocusedBeforeLB?.focus) {
    lastFocusedBeforeLB.focus();
    lastFocusedBeforeLB = null;
  }
}

function initLightboxEvents() {
  lbCloseEl()?.addEventListener('click', closeLightbox);
  lbPrevEl()?.addEventListener('click', () => previousImage());
  lbNextEl()?.addEventListener('click', () => nextImage());

  // Click en el overlay (fuera del contenido) cierra el lightbox
  lightboxEl()?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  });

  // Teclado
  document.addEventListener('keydown', (e) => {
    if (!isLightboxOpen) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  previousImage();
    if (e.key === 'ArrowRight') nextImage();
  });

  // Gestos touch
  lightboxEl()?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightboxEl()?.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) { dx > 0 ? previousImage() : nextImage(); }
  }, { passive: true });
}

function initGalleryEvents() {
  const mainImageContainer = q('mainImage');
  if (!mainImageContainer) return;

  // Accesibilidad/UX
  mainImageContainer.setAttribute('role', 'button');
  mainImageContainer.tabIndex = 0;

  // Abrir lightbox sólo si no clickeaste en los botones prev/next
  mainImageContainer.addEventListener('click', (e) => {
    if (e.target.closest('.gallery-nav')) return;
    openLightbox();
  });

  // Accesible con Enter/Espacio desde el contenedor
  mainImageContainer.addEventListener('keydown', (e) => {
    if (e.target !== mainImageContainer) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox();
    }
  });

  // Evita burbujeo de los botones
  mainImageContainer.querySelectorAll('.gallery-nav').forEach(btn => {
    btn.addEventListener('click', (e) => e.stopPropagation());
    btn.addEventListener('keydown', (e) => e.stopPropagation());
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  });
}

// Exponer funciones para HTML inline (prev/next en botones y miniaturas)
window.previousImage = previousImage;
window.nextImage = nextImage;
window.selectImage = selectImage;

// ───────────── Contacto / WhatsApp / Formspree
function getWhatsNumber() {
  const box = document.querySelector('.contact-agent');
  const raw = box?.dataset?.whatsapp || '50683018999'; // Cambia si quieres un número fijo
  return raw.replace(/\D/g, '');
}

function buildMessage(extra = '') {
  const form = q('contactForm');
  const nameEl  = form?.querySelector('#name, input[type="text"]');
  const emailEl = form?.querySelector('#email, input[type="email"]');
  const phoneEl = form?.querySelector('#phone, input[type="tel"]');
  const msgEl   = form?.querySelector('#message, textarea');

  const name  = (nameEl?.value || '').trim();
  const email = (emailEl?.value || '').trim();
  const phone = (phoneEl?.value || '').trim();
  const body  = (msgEl?.value || '').trim();
  const propName = currentProperty?.title || 'Propiedad';

  const lines = [
    body ? `Mensaje: ${body}` : '',
    name ? `Nombre: ${name}` : '',
    phone ? `Tel: ${phone}` : '',
    email ? `Email: ${email}` : '',
    extra
  ].filter(Boolean);

  return `Hola, me interesa la propiedad "${propName}".\n` + lines.join('\n');
}

function openWhatsApp(message) {
  const number = getWhatsNumber();
  if (!number) {
    alert('No se configuró el número de WhatsApp.');
    return;
  }
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

async function sendToFormspree(payload) {
  try {
    await fetch('https://formspree.io/f/xwpqdyka', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('Formspree falló (no bloqueante):', e);
  }
}

function setupContactForm() {
  const form = q('contactForm');
  if (!form) return;

  // Prefill mensaje
  const msgEl = form.querySelector('#message, textarea');
  if (msgEl && !msgEl.value) {
    const propName = currentProperty?.title || 'Propiedad';
    msgEl.value = `Hola, estoy interesado(a) en la propiedad "${propName}". ¿Podemos hablar?`;
  }

  // Botones opcionales
  const btnCall  = q('btnCall');
  const btnWapp  = q('btnWhatsApp');
  const btnVisit = q('btnVisit');

  btnWapp?.addEventListener('click', () => {
    const message = buildMessage();
    sendToFormspree({ source: 'whatsapp_button', property: currentProperty?.title, message });
    openWhatsApp(message);
  });

  btnVisit?.addEventListener('click', () => {
    const message = buildMessage('Me gustaría agendar una visita. ¿Qué fechas y horarios tienen disponibles?');
    sendToFormspree({ source: 'visit_button', property: currentProperty?.title, message });
    openWhatsApp(message);
  });

  btnCall?.addEventListener('click', () => {
    const tel = getWhatsNumber();
    if (!tel) return alert('No se configuró el número de teléfono.');
    location.href = `tel:${tel}`;
  });

  // Submit del formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = buildMessage();

    const nameEl  = form.querySelector('#name, input[type="text"]');
    const emailEl = form.querySelector('#email, input[type="email"]');
    const phoneEl = form.querySelector('#phone, input[type="tel"]');

    const payload = {
      source: 'contact_form',
      property: currentProperty?.title,
      name:  (nameEl?.value  || '').trim(),
      email: (emailEl?.value || '').trim(),
      phone: (phoneEl?.value || '').trim(),
      message,
    };

    sendToFormspree(payload); // no bloqueante
    openWhatsApp(message);
    // form.reset(); // opcional
  });
}

function renderFeatures(p) {
  const list = document.getElementById('featuresList');
  if (!list || !p) return;

  // 1) Solo desde JSON
  const raw = Array.isArray(p.features) ? p.features.filter(Boolean) : [];

  // Si no hay nada, ocultamos la sección
  const section = list.closest('.features-section');
  if (!raw.length) {
    if (section) section.style.display = 'none';
    list.innerHTML = '';
    return;
  } else {
    if (section) section.style.display = '';
  }

  // 2) Mapa de iconos por texto (para strings)
  const ICONS = {
    'frente a río':              'fa-solid fa-water',
    'acceso por calle pública':  'fa-solid fa-road',
    'agua disponible':           'fa-solid fa-droplet',
    'electricidad disponible':   'fa-solid fa-bolt',
    'internet disponible':       'fa-solid fa-wifi',
    'internet por instalar':     'fa-solid fa-wifi-slash',
    'topografía plana':          'fa-solid fa-chart-area',
    'uso residencial':           'fa-solid fa-house',
    'tamaño del lote':           'fa-solid fa-ruler-combined',
    'entorno natural':           'fa-solid fa-seedling',
    'zona tranquila':            'fa-solid fa-spa'
  };

  // 3) Normalizador (permite strings u objetos {label, icon})
  const items = raw.map(entry => {
    if (typeof entry === 'string') {
      const label = entry.trim();
      // icono por prefijo (ej: "tamaño del lote: 2 296 m²")
      const key = Object.keys(ICONS).find(k => label.toLowerCase().startsWith(k));
      const icon = key ? ICONS[key] : 'fa-solid fa-circle';
      return { label, icon };
    } else if (entry && typeof entry === 'object') {
      const label = String(entry.label || '').trim();
      const forcedIcon = String(entry.icon || '').trim();
      if (forcedIcon) return { label, icon: forcedIcon };
      const key = Object.keys(ICONS).find(k => label.toLowerCase().startsWith(k));
      const icon = key ? ICONS[key] : 'fa-solid fa-circle';
      return { label, icon };
    }
    return null;
  }).filter(Boolean);

  // 4) Render
  list.innerHTML = items.map(it => `
    <li class="feature-item">
      <i class="${it.icon}" aria-hidden="true"></i>
      <span>${it.label}</span>
    </li>
  `).join('');
}

// ───────────── Navegación con flechas global (fuera del lightbox también)
document.addEventListener('keydown', (e) => {
  if (isLightboxOpen) return; // cuando está el lightbox, ya lo maneja arriba
  if (e.key === 'ArrowLeft')  previousImage();
  if (e.key === 'ArrowRight') nextImage();
});



