// === property.js — IMÁGENES + VIDEOS ===
let currentImageIndex = 0;
let currentProperty = null;
let isLightboxOpen = false;
let touchStartX = 0;
let lastFocusedBeforeLB = null;

// ───────────── Helpers DOM Lightbox
const q = (id) => document.getElementById(id);
function lightboxEl() { return q('lightbox'); }
function lbImgEl() { return q('lightboxImage'); }
function lbVideoEl() { return q('lightboxVideo'); } // si no existe, se creará
function lbCounterEl() { return q('lbCounter'); }
function lbCloseEl() { return q('lbClose'); }
function lbPrevEl() { return q('lbPrev'); }
function lbNextEl() { return q('lbNext'); }

// ───────────── Media helpers (IMAGEN + VIDEO desde arrays separados)
function getMediaList() {
  const imgs = Array.isArray(currentProperty?.images) ? currentProperty.images : [];
  const vids = Array.isArray(currentProperty?.videos) ? currentProperty.videos : [];
  // normalizamos: cada item => { kind:'image'|'video', src, poster?, thumb? }
  const folder = (currentProperty?.folder || '').replace(/^\/+|\/+$/g, '');
  const norm = (entry, kind) => {
    const obj = (typeof entry === 'string') ? { src: entry } : (entry || {});
    return {
      kind,
      src: resolvePath(obj.src, folder),
      poster: obj.poster ? resolvePath(obj.poster, folder) : (obj.thumb ? resolvePath(obj.thumb, folder) : ''),
      thumb: obj.thumb ? resolvePath(obj.thumb, folder) : (obj.poster ? resolvePath(obj.poster, folder) : '')
    };
  };
  const images = imgs.map(e => norm(e, 'image'));
  const videos = vids.map(e => norm(e, 'video'));
  return [...images, ...videos];
}

function resolvePath(raw, folder) {
  if (!raw) return '';
  const s = String(raw);
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s; // absoluto
  // relativo a /assets/images/properties/{folder}/
  return `/assets/images/properties/${folder}/${s}`;
}

function mediaCount() { return getMediaList().length; }
function mediaAt(i) {
  const list = getMediaList();
  if (!list.length) return null;
  const idx = Math.max(0, Math.min(i, list.length - 1));
  return list[idx];
}

const isEnglish = window.location.pathname.startsWith('/en/');

const PROPERTIES_URL = isEnglish
  ? '/assets/data/properties-en.json'
  : '/assets/data/properties.json';


// ───────────── Inicio
document.addEventListener('DOMContentLoaded', initPropertyPage);

async function initPropertyPage() {
  const params = new URLSearchParams(location.search);
  const idParam = params.get('id');
  const slugParam = params.get('slug');

  try {
    const res = await fetch(PROPERTIES_URL);
    const list = await res.json();

    if (slugParam) {
      currentProperty = list.find(p => (p.slug || '').toLowerCase() === slugParam.toLowerCase());
    } else if (idParam) {
      currentProperty = list.find(p => String(p.id) === String(idParam) || Number(p.id) === Number(idParam));
    }

    if (!currentProperty) return fallbackToList();

    if (!Array.isArray(currentProperty.images)) currentProperty.images = [];
    if (!Array.isArray(currentProperty.videos)) currentProperty.videos = [];

    currentImageIndex = 0;

    bindProperty(currentProperty);
    setupContactForm?.();
    initLightboxEvents();
    initGalleryEvents();
  } catch (err) {
    console.error('Error al cargar properties.json:', err);
    fallbackToList();
  }
}

function fallbackToList() {
  location.href = isEnglish ? 'properties-en.html' : 'properties.html';
}


// ───────────── Formatos
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
  if (n >= 10000) {
    const ha = n / 10000;
    return `${ha % 1 === 0 ? ha.toFixed(0) : ha.toFixed(2)} ha`;
  }
  return `${n.toLocaleString('es-CR')} m²`;
}

function joinPriceSize(priceStr, sizeStr) {
  if (priceStr && sizeStr) return `${priceStr} \u00A0•\u00A0 ${sizeStr}`;
  return priceStr || sizeStr || 'Consultar';
}

// ───────────── ✅ Badge VENDIDO
const isSold = (prop) => String(prop?.status || '').trim().toLowerCase() === 'vendido';

function renderSoldBadge(prop) {
  const main = document.getElementById('mainImage');
  if (!main) return;
  main.querySelectorAll('.property-badge.sold').forEach(n => n.remove());
  if (isSold(prop)) {
    const badge = document.createElement('div');
    badge.className = 'property-badge sold';
    badge.textContent = 'VENDIDO';
    main.prepend(badge);
  }
}

// ───────────── Bind de datos
function bindProperty(p) {
  document.title = `${p.title} - Natura Real Estate`;

  const titleEl = q('propertyTitle');
  const locEl = q('propertyLocation');
  const priceEl = q('propertyPriceTag');
  const bcEl = q('breadcrumbTitle');

  if (titleEl) titleEl.textContent = p.title || 'Propiedad';
  if (locEl) locEl.textContent = p.location || '—';

  if (priceEl) {
    const priceStr = formatPrice(p.price);
    const sizeStr = formatLotSize(p.lotSize);
    priceEl.textContent = joinPriceSize(priceStr, sizeStr);
  }
  if (bcEl) bcEl.textContent = p.title || 'Propiedad';

  updateMainMedia();
  generateThumbnails();   // 👈 mantiene TUS thumbnails
  loadDescription();
  renderFeatures(p);
  renderSoldBadge(p);
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
    const parts = desc.split(/\n\s*\n/);
    container.innerHTML = parts.map(par =>
      `<p class="text-gray-700 leading-relaxed mb-4">${par.trim()}</p>`
    ).join('');
  } else {
    container.innerHTML = '';
  }
}

// ───────────── Galería (IMAGEN o VIDEO)
function updateMainMedia() {
  const main = q('mainImage');
  if (!main || mediaCount() === 0) return;

  if (currentImageIndex < 0) currentImageIndex = 0;
  if (currentImageIndex >= mediaCount()) currentImageIndex = 0;

  const item = mediaAt(currentImageIndex);

  // Reset contenido (conserva tus flechas)
  main.innerHTML = `
    <button class="gallery-nav prev" onclick="previousImage()" aria-label="Anterior">‹</button>
    <button class="gallery-nav next" onclick="nextImage()" aria-label="Siguiente">›</button>
  `;

  if (item.kind === 'video') {
    // Render video principal
    const v = document.createElement('video');
    v.className = 'property-video';
    v.setAttribute('playsinline', '');
    v.setAttribute('controls', '');
    v.setAttribute('preload', 'metadata');
    v.src = item.src;
    if (item.poster) v.setAttribute('poster', item.poster);

    // Quita fondo para que no tape el video
    main.style.backgroundImage = '';
    main.style.cursor = 'zoom-in';
    main.appendChild(v);
  } else {
    // Imagen como fondo (tu comportamiento original)
    main.style.backgroundImage = `url('${item.src}')`;
    main.style.backgroundSize = 'cover';
    main.style.backgroundPosition = 'center';
    main.style.cursor = 'zoom-in';
  }
}

function generateThumbnails() {
  const thumbnailGrid = q('thumbnailGrid');
  if (!thumbnailGrid || mediaCount() === 0) return;

  const html = getMediaList().map((item, i) => {
    const active = i === currentImageIndex ? 'active' : '';
    if (item.kind === 'video') {
      const thumb = item.thumb || item.poster;
      return `
        <div class="thumbnail ${active}" onclick="selectImage(${i})" title="Video">
          ${thumb
            ? `<img src="${thumb}" alt="Miniatura video ${i + 1}" loading="lazy" decoding="async" />`
            : `<div class="thumb-video-fallback"><i class="fa-solid fa-play"></i></div>`}
          <span class="thumb-video-badge"><i class="fa-solid fa-play"></i></span>
        </div>
      `;
    } else {
      return `
        <div class="thumbnail ${active}" onclick="selectImage(${i})">
          <img src="${item.src}" alt="Miniatura ${i + 1}" loading="lazy" decoding="async" />
        </div>
      `;
    }
  }).join('');

  thumbnailGrid.innerHTML = html;
}

function selectImage(index) {
  if (mediaCount() === 0) return;
  currentImageIndex = Math.max(0, Math.min(index, mediaCount() - 1));
  updateMainMedia();

  document.querySelectorAll('.thumbnail').forEach((thumb, i) =>
    thumb.classList.toggle('active', i === currentImageIndex)
  );

  if (isLightboxOpen) updateLightboxMedia();
}

function previousImage() {
  if (mediaCount() === 0) return;
  currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : mediaCount() - 1;
  selectImage(currentImageIndex);
}

function nextImage() {
  if (mediaCount() === 0) return;
  currentImageIndex = currentImageIndex < mediaCount() - 1 ? currentImageIndex + 1 : 0;
  selectImage(currentImageIndex);
}

// ───────────── Lightbox
function ensureLbVideo() {
  let v = lbVideoEl();
  if (!v && lightboxEl()) {
    v = document.createElement('video');
    v.id = 'lightboxVideo';
    v.className = 'lb-img';
    v.setAttribute('controls', '');
    v.setAttribute('playsinline', '');
    v.style.display = 'none';
    lightboxEl().appendChild(v);
  }
  return v;
}

function showOnlyImageInLB() {
  const img = lbImgEl();
  const vid = ensureLbVideo();
  if (vid) {
    vid.pause?.();
    vid.style.display = 'none';
    vid.removeAttribute('src');
    vid.removeAttribute('poster');
    vid.load?.();
  }
  if (img) img.style.display = '';
}

function showOnlyVideoInLB(src, poster) {
  const img = lbImgEl();
  const vid = ensureLbVideo();
  if (img) img.style.display = 'none';
  if (!vid) return;
  vid.style.display = '';
  if (poster) vid.setAttribute('poster', poster); else vid.removeAttribute('poster');
  vid.src = src;
  vid.load();
  // no autoplay para no sorprender; el usuario decide
}

function updateLightboxMedia() {
  const img = lbImgEl();
  if (!lightboxEl() || !img || mediaCount() === 0) return;

  const item = mediaAt(currentImageIndex);

  if (item.kind === 'video') {
    showOnlyVideoInLB(item.src, item.poster || '');
  } else {
    showOnlyImageInLB();
    img.src = item.src;
    img.alt = `${currentProperty.title} – imagen ${currentImageIndex + 1}`;
  }

  const counter = lbCounterEl();
  if (counter) counter.textContent = `${currentImageIndex + 1} / ${mediaCount()}`;

  // Preload vecinos (solo imágenes para no cargar videos de más)
  const n = mediaCount();
  [ (currentImageIndex + 1) % n, (currentImageIndex - 1 + n) % n ].forEach(i => {
    const it = mediaAt(i);
    if (it?.kind === 'image') {
      const ph = new Image();
      ph.loading = 'eager';
      ph.decoding = 'async';
      ph.src = it.src;
    }
  });
}

function openLightbox() {
  if (mediaCount() === 0) return;
  const lb = lightboxEl();
  if (!lb) return;

  isLightboxOpen = true;
  lastFocusedBeforeLB = document.activeElement;
  lb.classList.remove('hidden');
  lb.setAttribute('aria-hidden', 'false');
  lb.setAttribute('tabindex', '-1');
  document.body.style.overflow = 'hidden';
  updateLightboxMedia();
  lb.focus?.();
}

function closeLightbox() {
  const lb = lightboxEl();
  if (!lb) return;

  isLightboxOpen = false;
  lb.classList.add('hidden');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  // detener video si estuviera reproduciéndose
  const v = lbVideoEl();
  v?.pause?.();

  if (lastFocusedBeforeLB?.focus) {
    lastFocusedBeforeLB.focus();
    lastFocusedBeforeLB = null;
  }
}

function initLightboxEvents() {
  lbCloseEl()?.addEventListener('click', closeLightbox);
  lbPrevEl()?.addEventListener('click', () => previousImage());
  lbNextEl()?.addEventListener('click', () => nextImage());

  lightboxEl()?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!isLightboxOpen) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') previousImage();
    if (e.key === 'ArrowRight') nextImage();
  });

  lightboxEl()?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightboxEl()?.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) { dx > 0 ? previousImage() : nextImage(); }
  }, { passive: true });
}

function initGalleryEvents() {
  const main = q('mainImage');
  if (!main) return;

  main.setAttribute('role', 'button');
  main.tabIndex = 0;

  main.addEventListener('click', (e) => {
    if (e.target.closest('.gallery-nav')) return;
    openLightbox();
  });

  main.addEventListener('keydown', (e) => {
    if (e.target !== main) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox();
    }
  });

  main.querySelectorAll('.gallery-nav').forEach(btn => {
    btn.addEventListener('click', (e) => e.stopPropagation());
    btn.addEventListener('keydown', (e) => e.stopPropagation());
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  });
}

// Exponer funciones para HTML inline
window.previousImage = previousImage;
window.nextImage = nextImage;
window.selectImage = selectImage;

// ───────────── Contacto / WhatsApp / Formspree (sin cambios)
function getWhatsNumber() {
  const box = document.querySelector('.contact-agent');
  const raw = box?.dataset?.whatsapp || '50683018999';
  return raw.replace(/\D/g, '');
}

function buildMessage(extra = '') {
  const form = q('contactForm');
  const nameEl = form?.querySelector('#name, input[type="text"]');
  const emailEl = form?.querySelector('#email, input[type="email"]');
  const phoneEl = form?.querySelector('#phone, input[type="tel"]');
  const msgEl = form?.querySelector('#message, textarea');

  const name = (nameEl?.value || '').trim();
  const email = (emailEl?.value || '').trim();
  const phone = (phoneEl?.value || '').trim();
  const body = (msgEl?.value || '').trim();
  const propName = currentProperty?.title || (isEnglish ? 'Property' : 'Propiedad');


  const labels = isEnglish
    ? { message: 'Message', name: 'Name', phone: 'Phone', email: 'Email' }
    : { message: 'Mensaje', name: 'Nombre', phone: 'Tel', email: 'Email' };

  const lines = [
    body ? `${labels.message}: ${body}` : '',
    name ? `${labels.name}: ${name}` : '',
    phone ? `${labels.phone}: ${phone}` : '',
    email ? `${labels.email}: ${email}` : '',
    extra
  ].filter(Boolean);

  const intro = isEnglish
    ? `Hello, I'm interested in the property "${propName}".\n`
    : `Hola, me interesa la propiedad "${propName}".\n`;

  return intro + lines.join('\n');
}



function openWhatsApp(message) {
  const number = getWhatsNumber();
  if (!number) return alert('No se configuró el número de WhatsApp.');
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

  const msgEl = form.querySelector('#message, textarea');
  if (msgEl && !msgEl.value) {
    const propName = currentProperty?.title || (isEnglish ? 'Property' : 'Propiedad');

    msgEl.value = isEnglish
      ? `Hello, I'm interested in the property "${propName}". Can we talk?`
      : `Hola, estoy interesado(a) en la propiedad "${propName}". ¿Podemos hablar?`;
  }

  

  const btnCall = q('btnCall');
  const btnWapp = q('btnWhatsApp');
  const btnVisit = q('btnVisit');

  btnWapp?.addEventListener('click', () => {
    const message = buildMessage();
    sendToFormspree({ source: 'whatsapp_button', property: currentProperty?.title, message });
    openWhatsApp(message);
  });


  btnCall?.addEventListener('click', () => {
    const tel = getWhatsNumber();
    if (!tel) return alert('No se configuró el número de teléfono.');
    location.href = `tel:${tel}`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = buildMessage();

    const nameEl = form.querySelector('#name, input[type="text"]');
    const emailEl = form.querySelector('#email, input[type="email"]');
    const phoneEl = form.querySelector('#phone, input[type="tel"]');

    const payload = {
      source: 'contact_form',
      property: currentProperty?.title,
      name: (nameEl?.value || '').trim(),
      email: (emailEl?.value || '').trim(),
      phone: (phoneEl?.value || '').trim(),
      message,
    };

    sendToFormspree(payload);
    openWhatsApp(message);
  });
}

function renderFeatures(p) {
  const list = document.getElementById('featuresList');
  if (!list || !p) return;

  const raw = Array.isArray(p.features) ? p.features.filter(Boolean) : [];
  const section = list.closest('.features-section');
  if (!raw.length) {
    if (section) section.style.display = 'none';
    list.innerHTML = '';
    return;
  } else {
    if (section) section.style.display = '';
  }

  const ICONS = {
    'frente a río': 'fa-solid fa-water',
    'acceso por calle pública': 'fa-solid fa-road',
    'agua disponible': 'fa-solid fa-droplet',
    'electricidad disponible': 'fa-solid fa-bolt',
    'internet disponible': 'fa-solid fa-wifi',
    'internet por instalar': 'fa-solid fa-wifi-slash',
    'topografía plana': 'fa-solid fa-chart-area',
    'uso residencial': 'fa-solid fa-house',
    'tamaño del lote': 'fa-solid fa-ruler-combined',
    'entorno natural': 'fa-solid fa-seedling',
    'zona tranquila': 'fa-solid fa-spa'
  };

  const items = raw.map(entry => {
    if (typeof entry === 'string') {
      const label = entry.trim();
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

  list.innerHTML = items.map(it => `
    <li class="feature-item">
      <i class="${it.icon}" aria-hidden="true"></i>
      <span>${it.label}</span>
    </li>
  `).join('');
}

// ───────────── Navegación con flechas global (fuera del lightbox)
document.addEventListener('keydown', (e) => {
  if (isLightboxOpen) return;
  if (e.key === 'ArrowLeft') previousImage();
  if (e.key === 'ArrowRight') nextImage();
});
