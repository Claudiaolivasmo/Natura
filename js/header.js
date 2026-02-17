// === header.js ===
// Header shrink on scroll + Menú móvil (overlay) + accesibilidad

(() => {
  // ---- Elements
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const navMobile = document.getElementById('navMobile');
  const focusableSelectors = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

  // ---- Header shrink (grande -> compacto)
  const SCROLL_THRESHOLD = 50;
  let ticking = false;

  function applyHeaderState() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(applyHeaderState);
      ticking = true;
    }
  }

  // ---- Menú móvil
  function openMenu() {
    if (!hamburger || !navMobile) return;
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
    if (!hamburger || !navMobile) return;
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');

    navMobile.setAttribute('aria-hidden', 'true');

    // Permitir fade-out antes de ocultar
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
    if (!hamburger) return;
    const isOpen = hamburger.classList.contains('active');
    isOpen ? closeMenu() : openMenu();
  }

  // ---- Listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Estado inicial del header (por si se entra con scroll)
    applyHeaderState();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Toggle al click del botón
    if (hamburger) hamburger.addEventListener('click', toggleMenu);

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hamburger && hamburger.classList.contains('active')) {
        closeMenu();
        hamburger.focus();
      }
    });

    // Cerrar al hacer clic fuera (overlay)
    if (navMobile) {
      navMobile.addEventListener('click', (e) => {
        if (e.target === navMobile) closeMenu();
      });

      // Cerrar al hacer clic en cualquier enlace dentro del menú
      navMobile.querySelectorAll('[data-close]').forEach(link => {
        link.addEventListener('click', () => closeMenu());
      });
    }
  });
})();
