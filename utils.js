// === 🛠️ UTILS.JS ===

// Etiquetas de características amigables para mostrar
function getFeatureLabel(feature) {
  const labels = {
    'piscina': 'Piscina',
    'jardin': 'Jardín',
    'vista-volcan': 'Vista Volcán',
    'eco-friendly': 'Eco-Friendly',
    'amueblado': 'Amueblado'
  };
  return labels[feature] || feature;
}

// Convertir texto en slug (opcional para futuros enlaces o filtros)
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
}

// Formato de moneda (si quisieras reutilizar)
function formatCurrency(value) {
  return `$${Number(value).toLocaleString('en-US')}`;
}

function generateBreadcrumb() {
  const breadcrumb = document.getElementById("breadcrumb");
  if (!breadcrumb) return;

  const path = window.location.pathname.split("/").filter(Boolean);
  const basePath = window.location.origin;

  let html = `<a href="${basePath}/index.html">Inicio</a>`;

  let fullPath = "";
  for (let i = 1; i < path.length; i++) {
    fullPath += `/${path[i]}`;
    const isLast = i === path.length - 1;
    const name = decodeURIComponent(path[i])
                  .replace(/-/g, " ")
                  .replace(/\.[^/.]+$/, "")
                  .replace(/\b\w/g, c => c.toUpperCase());

    html += `<span class="separator">›</span>`;
    if (isLast) {
      html += `<span>${name}</span>`;
    } else {
      html += `<a href="${basePath + fullPath}">${name}</a>`;
    }
  }

  breadcrumb.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", generateBreadcrumb);
