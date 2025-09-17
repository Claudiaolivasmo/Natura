// Elements
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');
const focusableSelectors = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

function openMenu() {
  hamburger.classList.add('active');
  hamburger.setAttribute('aria-expanded', 'true');

  navMobile.hidden = false;
  navMobile.setAttribute('aria-hidden', 'false');

  // Bloquear scroll
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  // Enfocar el primer enlace disponible
  const firstLink = navMobile.querySelector(focusableSelectors);
  if (firstLink) firstLink.focus();
}

function closeMenu() {
  hamburger.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');

  navMobile.setAttribute('aria-hidden', 'true');

  // Permitir la animación de fade-out antes de ocultar
  setTimeout(() => {
    if (navMobile.getAttribute('aria-hidden') === 'true') {
      navMobile.hidden = true;
    }
  }, 250);

  // Desbloquear scroll
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

function toggleMenu() {
  const isOpen = hamburger.classList.contains('active');
  if (isOpen) closeMenu(); else openMenu();
}

// Toggle al click del botón
hamburger.addEventListener('click', toggleMenu);

// Cerrar al pulsar Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && hamburger.classList.contains('active')) {
    closeMenu();
    hamburger.focus();
  }
});

// Cerrar al hacer clic fuera (en el overlay)
navMobile.addEventListener('click', (e) => {
  if (e.target === navMobile) closeMenu();
});

// Cerrar al hacer clic en cualquier enlace dentro del menú
navMobile.querySelectorAll('[data-close]').forEach(link => {
  link.addEventListener('click', () => closeMenu());
});
