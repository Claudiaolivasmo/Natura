// === 🌐 MAIN.JS ===

// ===== Header scroll effect sin parpadeo =====
const header = document.getElementById('header');
let isSmoothScrolling = false;
let ticking = false;
let scrollEndTimer = null;

function applyHeaderState() {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 100);
}

function onScroll() {
  if (isSmoothScrolling) return; // No cambies estado durante el smooth
  if (!ticking) {
    window.requestAnimationFrame(() => {
      applyHeaderState();
      ticking = false;
    });
    ticking = true;
  }
}
window.addEventListener('scroll', onScroll, { passive: true });

// Marca el fin del scroll (debounce)
function markScrollEnd() {
  clearTimeout(scrollEndTimer);
  scrollEndTimer = setTimeout(() => {
    isSmoothScrolling = false;
    applyHeaderState();
  }, 180); // tiempo corto tras terminar la animación
}

// ===== Smooth scroll a anclas con offset del header =====
function getHeaderOffset() {
  return header ? header.offsetHeight + 8 : 0; // +8px de respiro
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    isSmoothScrolling = true;
    // Calcula destino compensando la altura del header actual
    const targetY = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth'
    });

    // Observa el fin del scroll
    markScrollEnd();
  });
});

// Estado inicial correcto
applyHeaderState();


// Fade-in animation using IntersectionObserver
const fadeElements = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

fadeElements.forEach(el => fadeObserver.observe(el));

// Animated counters
const statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counters = entry.target.querySelectorAll('.stat-number');
      counters.forEach(counter => {
        animateCounter(counter);
      });
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats-section');
if (statsSection) {
  statObserver.observe(statsSection);
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-target')) || 0;
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}

// Page load fade-in
window.addEventListener('load', function () {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);
});
