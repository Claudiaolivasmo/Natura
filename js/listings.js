/* Shared property cards for sales, home, vacation rentals and related listings. */
(() => {
  'use strict';
  const en = document.documentElement.lang.startsWith('en');
  const locale = en ? 'en-US' : 'es-CR';
  const text = {
    bedrooms: en ? 'bedrooms' : 'habitaciones', bathrooms: en ? 'bathrooms' : 'baños',
    guests: en ? 'guests' : 'huéspedes', land: en ? 'land' : 'terreno', built: en ? 'built' : 'construcción',
    details: en ? 'View property' : 'Ver propiedad', sale: en ? 'For sale' : 'En venta',
    rental: en ? 'Vacation rental' : 'Alquiler vacacional', sold: en ? 'Sold' : 'Vendido',
    price: en ? 'Price on request' : 'Precio a consultar', availability: en ? 'Check availability' : 'Consultar disponibilidad'
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const positive = value => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0;
  const sold = p => /^(vendido|sold)$/i.test(String(p.status || '').trim());
  const featured = p => !sold(p) && (p.featured === true || /destacado|featured/i.test(p.badge || ''));
  function image(p) {
    const first = p.images?.[0];
    const src = typeof first === 'string' ? first : first?.src;
    if (!src) return '';
    if (/^(https?:\/\/|\/)/i.test(src)) return src;
    return `/assets/images/properties/${String(p.folder || '').replace(/^\/+|\/+$/g, '')}/${src}`;
  }
  function link(p, kind = 'sale') {
    const page = kind === 'rental' ? 'vacation-rental' : 'property';
    return `${page}.html?${p.slug ? 'slug=' + encodeURIComponent(p.slug) : 'id=' + encodeURIComponent(p.id)}`;
  }
  function price(p) {
    const currency = String(p.currency || 'USD').toUpperCase();
    const amount = currency === 'CRC' ? (p.priceCRC ?? p.price) : p.price;
    return positive(amount) ? new Intl.NumberFormat(locale, {style:'currency', currency, maximumFractionDigits:0}).format(amount) : text.price;
  }
  function metadata(p, kind = 'sale') {
    const items = [];
    const add = (value, icon, label, suffix = '') => {
      if (positive(value)) items.push(`<span><i class="fa-solid ${icon}" aria-hidden="true"></i><span>${escape(Number(value).toLocaleString(locale))}${suffix} ${label}</span></span>`);
    };
    add(p.bedrooms, 'fa-bed', text.bedrooms);
    add(p.bathrooms, 'fa-bath', text.bathrooms);
    if (kind === 'rental') add(p.maxGuests, 'fa-user-group', text.guests);
    else { add(p.lotSize, 'fa-ruler-combined', text.land, ' m²'); add(p.builtSize ?? p.area, 'fa-house', text.built, ' m²'); }
    return items.length ? `<div class="listing-meta">${items.join('')}</div>` : '';
  }
  function download(p) {
    const first = p.images?.[0];
    const explicit = typeof first === 'object' ? first.download : null;
    if (explicit) return explicit;
    const src = image(p);
    const prefix = '/assets/images/properties/';
    return src.startsWith(prefix) ? `/download/${src.slice(prefix.length)}?filename=${encodeURIComponent(p.slug || p.title || 'property')}` : '';
  }
  function card(p, {kind = 'sale'} = {}) {
    const isSold = sold(p), src = image(p);
    const badge = isSold ? text.sold : (p.badge || (kind === 'rental' ? text.rental : text.sale));
    const dl = kind === 'sale' ? download(p) : '';
    return `<a class="listing-card${isSold ? ' listing-card--sold' : ''}" href="${escape(link(p, kind))}">
      <div class="listing-media">
        ${src ? `<img src="${escape(src)}" alt="${escape(p.title)}" loading="lazy" decoding="async" width="800" height="600"${dl ? ` data-download="${escape(dl)}"` : ''}>` : ''}
        <span class="listing-badge${isSold ? ' listing-badge--sold' : ''}">${escape(badge)}</span>
      </div>
      <div class="listing-body">
        <p class="listing-location"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${escape(p.location)}</p>
        <h3 class="listing-title">${escape(p.title)}</h3>
        ${p.tagline ? `<p class="listing-summary">${escape(p.tagline)}</p>` : ''}
        ${metadata(p, kind)}
        <div class="listing-footer">
          <span class="listing-price">${escape(kind === 'sale' ? price(p) : text.availability)}</span>
          <span class="listing-cta">${text.details}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
        </div>
      </div>
    </a>`;
  }
  function featureIcon(label) {
    const match = [
      [/habitaci|bedroom/i, 'fa-bed'], [/baño|bathroom/i, 'fa-bath'], [/piscina|pool/i, 'fa-water-ladder'],
      [/jacuzzi|hot tub/i, 'fa-hot-tub-person'], [/wifi|internet/i, 'fa-wifi'], [/cocina|kitchen/i, 'fa-utensils'],
      [/aire acondicionado|air conditioning/i, 'fa-snowflake'], [/parqueo|estacionamiento|parking/i, 'fa-car'],
      [/seguridad|security/i, 'fa-shield-halved'], [/terreno|lote|land|m²/i, 'fa-ruler-combined'],
      [/jardín|garden|verde|green/i, 'fa-leaf'], [/trabajo|workspace/i, 'fa-laptop'], [/parque infantil|playground/i, 'fa-child-reaching']
    ].find(([pattern]) => pattern.test(label));
    return match ? match[1] : 'fa-check';
  }
  document.addEventListener('contextmenu', event => {
    const target = event.target.closest('.listing-media img[data-download]');
    if (!target) return;
    event.preventDefault();
    const anchor = document.createElement('a');
    anchor.href = target.dataset.download; anchor.download = '';
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
  });
  window.NaturaListings = {card, metadata, price, image, link, sold, featured, featureIcon, escape};
})();
