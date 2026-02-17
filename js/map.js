// === MAP.JS ===

async function initMap() {
  try {
    // 📌 1. Cargar JSON de propiedades (ruta absoluta)
    const res = await fetch("/properties.json");
    const properties = await res.json();

    // 📌 2. Crear mapa centrado en La Fortuna
    const map = L.map("propertiesMap").setView([10.4718, -84.6458], 12);

    // 📌 3. Capa base OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const bounds = [];

    // 📌 4. Crear marcadores
    properties.forEach((p) => {
      // Verificar que exista p.geo y que tenga lat/lng válidos
      if (!p.geo || typeof p.geo.lat !== "number" || typeof p.geo.lng !== "number") {
        return;
      }

      const lat = p.geo.lat;
      const lng = p.geo.lng;

      const marker = L.marker([lat, lng]).addTo(map);
      bounds.push([lat, lng]);

      // 📌 Precio (USD o CRC)
      let priceText = "";
      if (p.price && p.currency === "USD") {
        priceText = `$${Number(p.price).toLocaleString("en-US")}`;
      } else if (p.priceCRC) {
        priceText = `₡${Number(p.priceCRC).toLocaleString("es-CR")}`;
      }

      // 📌 Popup bonito
      const popupHTML = `
        <div style="min-width:180px;">
          <h3 style="margin:0 0 4px;font-size:1rem;font-weight:600;">
            ${p.title || "Propiedad"}
          </h3>
          <p style="margin:0 0 4px;font-size:.85rem;opacity:.75;">
            ${p.location || ""}
          </p>
          ${priceText ? `<p style="margin:0 0 8px;font-size:.9rem;font-weight:600;">${priceText}</p>` : ""}
          <a href="property.html?id=${encodeURIComponent(p.id)}"
            style="
              display:inline-block;
              padding:.3rem .8rem;
              font-size:.85rem;
              border-radius:999px;
              border:1px solid #1a2e35;
              text-decoration:none;
            ">
            Ver detalles
          </a>
        </div>
      `;

      marker.bindPopup(popupHTML);
    });

    // 📌 Ajustar zoom para ver todos los marcadores
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  } catch (err) {
    console.error("Error cargando el mapa:", err);
  }
}

// Iniciar el mapa
document.addEventListener("DOMContentLoaded", initMap);

