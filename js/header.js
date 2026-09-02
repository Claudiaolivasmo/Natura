// === header.js ===
// Header shrink on scroll + menú móvil + accesibilidad

(() => {
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const navMobile = document.getElementById('navMobile');

  if (!header || !hamburger || !navMobile) return;

  const focusableSelectors =
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const SCROLL_THRESHOLD = 50;
  let ticking = false;
  let lastFocusedElement = null;

  function applyHeaderState() {
    header.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(applyHeaderState);
      ticking = true;
    }
  }

  function lockScroll() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  function openMenu() {
    lastFocusedElement = document.activeElement;

    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');

    navMobile.hidden = false;
    navMobile.classList.add('is-open');
    navMobile.setAttribute('aria-hidden', 'false');

    lockScroll();

    const firstFocusable = navMobile.querySelector(focusableSelectors);
    if (firstFocusable) firstFocusable.focus();
  }

  function closeMenu() {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');

    navMobile.classList.remove('is-open');
    navMobile.setAttribute('aria-hidden', 'true');

    unlockScroll();

    const handleTransitionEnd = (e) => {
      if (e.target !== navMobile) return;
      if (!navMobile.classList.contains('is-open')) {
        navMobile.hidden = true;
      }
      navMobile.removeEventListener('transitionend', handleTransitionEnd);
    };

    navMobile.addEventListener('transitionend', handleTransitionEnd);

    // respaldo por si no hay transición en CSS
    setTimeout(() => {
      if (!navMobile.classList.contains('is-open')) {
        navMobile.hidden = true;
      }
    }, 300);

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    } else {
      hamburger.focus();
    }
  }

  function toggleMenu() {
    const isOpen = hamburger.classList.contains('active');
    isOpen ? closeMenu() : openMenu();
  }

  function isMenuOpen() {
    return hamburger.classList.contains('active');
  }

  document.addEventListener('DOMContentLoaded', () => {
    navMobile.hidden = true;
    navMobile.setAttribute('aria-hidden', 'true');
    applyHeaderState();
    window.addEventListener('scroll', onScroll, { passive: true });

    hamburger.addEventListener('click', toggleMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && isMenuOpen()) {
        const items = [hamburger, ...navMobile.querySelectorAll(focusableSelectors)];
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if (e.key === 'Escape' && isMenuOpen()) {
        closeMenu();
      }
    });

    // Cerrar al hacer click en fondo del overlay
    navMobile.addEventListener('click', (e) => {
      if (e.target === navMobile) {
        closeMenu();
      }
    });

    // Cerrar al hacer click en cualquier link o botón dentro del menú
    navMobile.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('click', () => {
        if (isMenuOpen()) closeMenu();
      });
    });

    // Si se cambia a desktop, cerrar menú automáticamente
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100 && isMenuOpen()) {
        closeMenu();
      }
    });
  });
})();
(() => {
  document.querySelectorAll('.lang-switch a').forEach(link => {
    const url = new URL(link.getAttribute('href'), location.href);
    url.search = location.search;
    url.hash = location.hash;
    link.href = url.pathname + url.search + url.hash;
  });
})();
