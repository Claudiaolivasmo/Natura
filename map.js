<script>
async function initMap() {
  // 📌 1. Cargar JSON de propiedades
  const res = await fetch("properties.json");
  const properties = await res.json();

  // 📌 2. Crear mapa centrado en La Fortuna
  const map = L.map("propertiesMap").setView([10.4718, -84.6458], 12);

  // 📌 3. Capa de fondo
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // 📌 4. Marcadores por propiedad
  properties.forEach((p) => {
    if (!p.lat || !p.lng) return;

    const marker = L.marker([p.lat, p.lng]).addTo(map);

    // 📌 Popup
    const popupHTML = `
      <div style="min-width: 180px">
        <h3 style="margin:0 0 4px; font-size:1rem;">${p.title}</h3>
        <p style="margin:0; font-size:.85rem; opacity:.7;">${p.location}</p>
        <p style="margin:4px 0; font-weight:600;">₡${p.priceCRC.toLocaleString()}</p>
        <a href="property.html?id=${encodeURIComponent(p.id)}"
           style="padding: .3rem .7rem; border-radius: 8px; border:1px solid #1a2e35; text-decoration:none; font-size:.85rem;">
          Ver detalles
        </a>
      </div>
    `;

    marker.bindPopup(popupHTML);
  });
}

// Iniciar el mapa
initMap();
</script>
