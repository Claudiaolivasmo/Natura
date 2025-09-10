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

// Hover efecto en cards de servicios y propiedades
const hoverCards = document.querySelectorAll('.service-card, .property-card');
hoverCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-8px) scale(1.02)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0) scale(1)';
  });
});
