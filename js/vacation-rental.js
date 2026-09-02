// === 🌴 VACATION-RENTAL.JS (detalle) ===

const VRD_DATA_PATH = document.documentElement.lang.startsWith('en')
  ? '/assets/data/vacation-rentals-en.json' : '/assets/data/vacation-rentals.json';

function vrdLang() {
  return document.documentElement.lang === 'en' ? 'en' : 'es';
}

const VRD_I18N = {
  es: {
    bedrooms: 'Habitaciones',
    bathrooms: 'Baños',
    maxGuests: 'Huéspedes máx.',
    location: 'Ubicación',
    viewDetails: 'Ver detalles →',
    notFoundTitle: 'Propiedad no encontrada | Natura Homes',
    notFoundMsg: 'No encontramos esta propiedad.',
    viewAll: 'Ver todos los vacation rentals',
    photoAlt: 'foto',
  },
  en: {
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    maxGuests: 'Max guests',
    location: 'Location',
    viewDetails: 'View details →',
    notFoundTitle: 'Property not found | Natura Homes',
    notFoundMsg: "We couldn't find this property.",
    viewAll: 'View all vacation rentals',
    photoAlt: 'photo',
  },
};

function vrdGetSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get('slug');
}

function vrdSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function vrdBuildGallery(images, title) {
  const container = document.getElementById('vrGallery');
  if (!container || !images || !images.length) return;

  const shown = images.slice(0, 5);
  const remaining = images.length - shown.length;

  container.innerHTML = shown
    .map((src, i) => {
      const isLastThumb = i === 4 && remaining > 0;
      const overlay = isLastThumb
        ? `<div class="vr-gallery-more-overlay"><span>+${remaining}</span></div>`
        : '';
      return `
      <div class="vr-gallery-item ${i === 0 ? 'vr-gallery-main' : ''}" data-index="${i}">
        <img
          src="${src}"
          alt="${title} - ${VRD_I18N[vrdLang()].photoAlt} ${i + 1}"
          loading="lazy"
          decoding="async"
        >
        ${overlay}
      </div>`;
    })
    .join('');

  container.querySelectorAll('.vr-gallery-item').forEach((item) => {
    item.addEventListener('click', () => vrdOpenLightbox(images, parseInt(item.dataset.index, 10)));
  });
}

function vrdBuildAmenities(amenities) {
  const container = document.getElementById('vrAmenities');
  if (!container) return;
  if (!amenities || !amenities.length) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = amenities
    .map((a) => `<div class="vr-amenity"><i class="fa-solid ${NaturaListings.featureIcon(a)}"></i> ${a}</div>`)
    .join('');
}

function vrdBuildDescription(paragraphs) {
  const container = document.getElementById('vrDescription');
  if (!container) return;
  const list = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
  container.innerHTML = list.map((p) => `<p>${p}</p>`).join('');
}

function vrdBuildBookingList(p) {
  const container = document.getElementById('vrBookingList');
  if (!container) return;
  const t = VRD_I18N[vrdLang()];
  container.innerHTML = `
    <li><span>${t.bedrooms}</span> <strong>${p.bedrooms}</strong></li>
    <li><span>${t.bathrooms}</span> <strong>${p.bathrooms}</strong></li>
    <li><span>${t.maxGuests}</span> <strong>${p.maxGuests}</strong></li>
    <li><span>${t.location}</span> <strong>${p.location}</strong></li>
  `;
}

function vrdBuildLocation(p) {
  const section = document.getElementById('vrLocationSection');
  const frame = document.getElementById('vrLocationMap');
  const label = document.getElementById('vrLocationLabel');
  if (!section || !frame) return;

  const query = p.mapQuery || p.location;
  if (!query) {
    section.classList.add('hidden');
    return;
  }

  frame.src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  if (label) label.textContent = p.location || query;
}

// ───────────────────────── Lightbox ─
let vrdLightboxImages = [];
let vrdLightboxIndex = 0;

function vrdOpenLightbox(images, index) {
  vrdLightboxImages = images;
  vrdLightboxIndex = index;
  const lb = document.getElementById('vrLightbox');
  const img = document.getElementById('vrLightboxImg');
  if (!lb || !img) return;
  img.src = images[index];
  lb.classList.add('vr-open');
}

function vrdCloseLightbox() {
  const lb = document.getElementById('vrLightbox');
  if (lb) lb.classList.remove('vr-open');
}

function vrdNavLightbox(dir) {
  if (!vrdLightboxImages.length) return;
  vrdLightboxIndex = (vrdLightboxIndex + dir + vrdLightboxImages.length) % vrdLightboxImages.length;
  const img = document.getElementById('vrLightboxImg');
  if (img) img.src = vrdLightboxImages[vrdLightboxIndex];
}

function vrdInitLightboxControls() {
  const closeBtn = document.getElementById('vrLightboxClose');
  const prevBtn = document.getElementById('vrLightboxPrev');
  const nextBtn = document.getElementById('vrLightboxNext');
  const lb = document.getElementById('vrLightbox');

  if (closeBtn) closeBtn.addEventListener('click', vrdCloseLightbox);
  if (prevBtn) prevBtn.addEventListener('click', () => vrdNavLightbox(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => vrdNavLightbox(1));
  if (lb) {
    lb.addEventListener('click', (e) => {
      if (e.target === lb) vrdCloseLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') vrdCloseLightbox();
    if (e.key === 'ArrowRight') vrdNavLightbox(1);
    if (e.key === 'ArrowLeft') vrdNavLightbox(-1);
  });
}

// ───────────────────────── Related ─
function vrdRenderRelated(all, current) {
  const container = document.getElementById('vrRelatedGrid');
  if (!container) return;

  const related = all.filter((p) => p.slug !== current.slug).slice(0, 3);
  if (!related.length) {
    document.getElementById('vrRelatedSection')?.classList.add('hidden');
    return;
  }

  container.innerHTML = related.map(p => NaturaListings.card(p, {kind: 'rental'})).join('');
}

// ───────────────────────── Init ─
document.addEventListener('DOMContentLoaded', () => {
  const slug = vrdGetSlug();
  vrdInitLightboxControls();

  fetch(VRD_DATA_PATH)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      const list = Array.isArray(data) ? data : [];
      const property = list.find((p) => p.slug === slug);

      if (!property) {
        const t = VRD_I18N[vrdLang()];
        document.title = t.notFoundTitle;
        const main = document.getElementById('vrMain');
        if (main) {
          main.innerHTML = `<div class="vr-section"><p>${t.notFoundMsg} <a href="vacation-rentals.html">${t.viewAll}</a>.</p></div>`;
        }
        return;
      }

      // Meta / título
      document.title = `${property.title} | Natura Homes`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', property.shortDescription || '');

      // Hero
      const heroImg = document.getElementById('vrHeroImg');
      if (heroImg) {
        heroImg.src = property.images?.[0] || '';
        heroImg.alt = property.title;
      }
      vrdSetText('vrTitle', property.title);
      vrdSetText('vrLocation', property.location);
      vrdSetText('vrTagline', property.tagline || property.shortDescription || '');
      vrdSetText('vrBreadcrumbTitle', property.title);

      // Stats bar
      vrdSetText('vrStatBedrooms', property.bedrooms);
      vrdSetText('vrStatBathrooms', property.bathrooms);
      vrdSetText('vrStatGuests', property.maxGuests);

      // Booking sidebar
      vrdBuildBookingList(property);

      const airbnbLink = document.getElementById('vrAirbnbLink');
      const airbnbStatsLink = document.getElementById('vrStatsAirbnbLink');
      [airbnbLink, airbnbStatsLink].forEach((el) => {
        if (!el) return;
        if (property.airbnbUrl) {
          el.href = property.airbnbUrl;
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      });

      // If no booking platform is supplied, offer an inquiry without promising a booking.
      if (!property.airbnbUrl) {
        const inquiry = document.createElement('a');
        inquiry.className = 'natura-btn';
        inquiry.textContent = vrdLang() === 'en' ? 'Ask about availability' : 'Consultar disponibilidad';
        inquiry.href = 'https://wa.me/50685675060?text=' + encodeURIComponent((vrdLang() === 'en' ? 'Hello, I would like to ask about ' : 'Hola, quisiera consultar por ') + property.title);
        inquiry.target = '_blank';
        inquiry.rel = 'noopener';
        document.getElementById('vrBookingCard')?.appendChild(inquiry);
        vrdSetText('vrBookingNote', vrdLang() === 'en' ? 'Contact us to confirm availability and booking options.' : 'Contáctanos para confirmar disponibilidad y opciones de reserva.');
      }

      // Description, gallery, amenities, location
      vrdBuildDescription(property.description || [property.shortDescription]);
      vrdBuildGallery(property.images, property.title);
      vrdBuildAmenities(property.amenities);
      vrdBuildLocation(property);

      // Related
      vrdRenderRelated(list, property);
    })
    .catch((err) => {
      console.error('Error loading property:', err);
      const main = document.getElementById('vrMain');
      if (main) main.innerHTML = `<div class="vr-section" role="alert"><p>${vrdLang() === 'en' ? 'We could not load this property. Please try again.' : 'No se pudo cargar esta propiedad. Intenta de nuevo.'}</p><a href="vacation-rentals.html">${VRD_I18N[vrdLang()].viewAll}</a></div>`;
    });
});